import { Alert, Divider, Flex, Grid, Radio, Stack, StackItem } from "@patternfly/react-core"
import PropTypes from "prop-types"
import React from "react"
import ActionBar from "../ActionBar/ActionBar"
import { updateItems, updateRootObject } from "../Form/Functions"
import CodeEditorBasic from "../CodeEditor/CodeEditorBasic"
import { Form } from "../Form/Form"
import "./Editor.scss"
import { validate, validateItem } from "../../Util/Validator"
import objectPath from "object-path"
import Loading from "../Loading/Loading"
import { DownloadIcon } from "@patternfly/react-icons"
import { toObject, toString } from "../../Util/Language"
import ErrorBoundary from "../ErrorBoundary/ErrorBoundary"
const { v4: uuidv4 } = require("uuid")

class Editor extends React.Component {
  state = {
    loading: true,
    isReloadable: false,
    rootObject: {},
    formView: true,
    inValidItems: [],
  }
  editorRef = React.createRef()

  handleEditorOnMount = (editor, _monaco) => {
    this.editorRef.current = editor
  }

  componentDidMount() {
    this.onReloadClick()
  }

  onReloadClick = () => {
    if (this.props.resourceId) {
      this.props
        .apiGetRecord(this.props.resourceId)
        .then((res) => {
          const rootObject = res.data
          this.updateStateWithRootObject(rootObject, true)
        })
        .catch((_e) => {
          this.setState({ loading: false, isReloadable: true })
        })
    } else if (this.props.rootObject) {
      this.updateStateWithRootObject(this.props.rootObject)
    } else {
      this.setState({ loading: false, rootObject: {}, isReloadable: false })
    }
  }

  updateStateWithRootObject = (rootObject, isReloadable = false) => {
    this.setState(
      (prevState) => {
        // validate fields
        const { inValidItems } = prevState
        const formItems = this.getUpdatedFormItems(rootObject, inValidItems)
        formItems.forEach((item) => {
          updateInValidList(inValidItems, item, item.value)
        })
        return {
          rootObject: rootObject,
          inValidItems: inValidItems,
          loading: false,
          isReloadable: isReloadable,
        }
      },
      () => {
        if (this.editorRef.current) {
          const codeString = toString(this.props.language, rootObject)
          this.editorRef.current.setValue(codeString)
        }
      }
    )
  }

  onViewChange = () => {
    this.setState((prevState) => {
      if (!prevState.formView) {
        const data = toObject(this.props.language, this.editorRef.current.getValue())
        return { formView: !prevState.formView, rootObject: data }
      }
      return { formView: !prevState.formView }
    })
  }

  onFormValueChange = (item, newValue) => {
    this.setState((prevState) => {
      const { rootObject, inValidItems } = prevState
      updateRootObject(rootObject, item, newValue)
      updateInValidList(inValidItems, item, newValue)
      // update reset fields
      if (item.resetFields) {
        const fields = Object.keys(item.resetFields)
        fields.forEach((field) => {
          objectPath.set(rootObject, field, item.resetFields[field])
        })
      }
      if (this.props.onChangeFunc) {
        this.props.onChangeFunc(rootObject)
      }
      return { rootObject: rootObject, inValidItems: inValidItems }
    })
  }

  onSaveClick = () => {
    if (this.props.apiSaveRecord || this.props.onSaveFunc) {
      this.setState((prevState) => {
        const { formView, rootObject, inValidItems } = prevState
        let data = {}
        if (formView) {
          // validate fields
          const formItems = this.getUpdatedFormItems(rootObject, inValidItems)
          formItems.forEach((item) => {
            updateInValidList(inValidItems, item, item.value)
          })
          if (inValidItems.length > 0) {
            return { inValidItems: inValidItems }
          }
          data = rootObject
        } else {
          const codeString = this.editorRef.current.getValue()
          data = toObject(this.props.language, codeString)
        }
        if (this.props.apiSaveRecord) {
          this.props
            .apiSaveRecord(data)
            .then((_res) => {
              this.callOnSaveRedirect()
            })
            .catch((_e) => {})
        } else if (this.props.onSaveFunc) {
          this.props.onSaveFunc(data)
          this.callOnSaveRedirect()
        }
      })
      return {}
    }
  }

  onDownloadClick = () => {}

  callOnSaveRedirect = () => {
    if (this.props.onSaveRedirectFunc) {
      this.props.onSaveRedirectFunc()
    }
  }

  getUpdatedFormItems = (rootObject, inValidItems) => {
    if (this.props.getFormItems) {
      const formItems = this.props.getFormItems(rootObject)
      updateItems(rootObject, formItems)
      updateValidations(formItems, inValidItems) // update validations
      return formItems
    }
    return []
  }

  render() {
    const { loading, rootObject, formView, isReloadable, inValidItems } = this.state
    const { saveButtonText, isWidthLimited = true, disableEditor = false } = this.props
    if (loading) {
      return <Loading />
    }

    const content = []

    if (formView) {
      // update items with root object
      const formItems = this.getUpdatedFormItems(rootObject, inValidItems)

      content.push(
        <Form
          key={"form-view"}
          isHorizontal
          isWidthLimited={isWidthLimited}
          items={formItems}
          onChange={this.onFormValueChange}
        />
      )
    } else {
      const codeString = toString(this.props.language, rootObject)

      const otherOptions = this.props.otherOptions ? this.props.otherOptions : {}

      const basicOptions = {
        readOnly: this.props.readOnly,
        minimap: { enabled: this.props.minimapEnabled },
      }

      const options = {
        ...basicOptions,
        ...otherOptions,
      }

      content.push(
        <CodeEditorBasic
          key={"code-editor"}
          height={this.props.height}
          language={this.props.language}
          data={codeString}
          options={options}
          handleEditorOnMount={this.handleEditorOnMount}
        />
      )
    }

    let saveDisabled = false

    if (formView && inValidItems.length > 0) {
      saveDisabled = true
    }

    const saveText = saveButtonText ? saveButtonText : "Save"

    const actionButtons = [
      { text: saveText, variant: "primary", onClickFunc: this.onSaveClick, isDisabled: saveDisabled },
    ]

    if (isReloadable) {
      actionButtons.push({
        text: "Reload",
        variant: "secondary",
        onClickFunc: this.onReloadClick,
        isDisabled: false,
      })
    }

    if (this.props.onCancelFunc) {
      actionButtons.push({
        text: "Cancel",
        variant: "secondary",
        onClickFunc: this.props.onCancelFunc,
        isDisabled: false,
      })
    }

    const rightBar = formView
      ? []
      : [
          {
            text: "Download",
            icon: DownloadIcon,
            variant: "secondary",
            onClickFunc: this.onDownloadClick,
            isDisabled: true,
          },
        ]

    let errorMessage = null
    if (formView && inValidItems.length > 0) {
      errorMessage = <Alert variant="danger" isInline title="Check the error and/or mandatory(*) fields" />
      if (isWidthLimited) {
        errorMessage = (
          <Grid lg={7} md={9} sm={12}>
            {errorMessage}
          </Grid>
        )
      }
    }

    return (
      <div className="mc-editor">
        <Stack hasGutter>
          <StackItem>
            <Flex style={{ paddingBottom: "5px" }}>
              <span>
                <strong>Configure via:</strong>
              </span>
              <Radio
                isChecked={formView}
                onChange={this.onViewChange}
                label="Form View"
                id={"form_view_" + uuidv4()}
              />
              <Radio
                isChecked={!formView}
                isDisabled={disableEditor}
                onChange={this.onViewChange}
                label="YAML View"
                id={"yaml_view_" + uuidv4()}
              />
            </Flex>
            <Divider component="hr" />
          </StackItem>
          <StackItem isFilled>{content}</StackItem>
          <StackItem>{errorMessage}</StackItem>
          <StackItem>
            <ActionBar leftBar={actionButtons} rightBar={rightBar} />
          </StackItem>
        </Stack>
      </div>
    )
  }
}

Editor.propTypes = {
  resourceId: PropTypes.string,
  apiGetRecord: PropTypes.func,
  apiSaveRecord: PropTypes.func,
  rootObject: PropTypes.object,
  onChangeFunc: PropTypes.func,
  onSaveFunc: PropTypes.func,
  onSaveRedirectFunc: PropTypes.func, // on successful save called this redirect will be called
  onCancelFunc: PropTypes.func,
  language: PropTypes.string,
  minimapEnabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  otherOptions: PropTypes.object,
  getFormItems: PropTypes.func,
  isWidthLimited: PropTypes.bool,
  saveButtonText: PropTypes.string,
}

export default Editor

// helper functions

const updateValidations = (items, inValidItems) => {
  items.forEach((item) => {
    if (inValidItems.indexOf(item.fieldId) !== -1) {
      item.validated = "error"
    } else {
      item.validated = "default"
    }
  })
}

const updateInValidList = (inValidItems, item, value) => {
  const isValid = validateItem(item, value)
  let makeInvalid = false

  if (isValid) {
    if (item.isRequired) {
      const isEmpty = validate("isEmpty", value, {})
      if (isEmpty) {
        makeInvalid = true
      }
    }
    if (inValidItems.indexOf(item.fieldId) !== -1 && !makeInvalid) {
      inValidItems.splice(inValidItems.indexOf(item.fieldId), 1)
    }
  } else {
    makeInvalid = true
  }

  if (makeInvalid) {
    if (inValidItems.indexOf(item.fieldId) === -1) {
      inValidItems.push(item.fieldId)
    }
  }
}
