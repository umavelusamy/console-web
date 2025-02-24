import { Button, Modal, ModalVariant } from "@patternfly/react-core"
import { EditIcon } from "@patternfly/react-icons"
import objectPath from "object-path"
import React from "react"
import Editor from "../../Editor/Editor"
import ErrorBoundary from "../../ErrorBoundary/ErrorBoundary"
import { DataType, FieldType } from "../../../Constants/Form"
import {
  ResourceTypeOptions,
  CallerType,
  FieldDataType,
  FieldDataTypeOptions,
  TelegramParseModeOptions,
  ExporterTypeOptions,
  ExportTypeOptions,
  ExporterType,
} from "../../../Constants/ResourcePicker"
import {
  getOptionsDescriptionFunc,
  getResourceFilterFunc,
  getResourceOptionsAPI,
  getResourceOptionValueFunc,
  getRootObject,
  updateValue,
} from "./ResourceUtils"
import { validate } from "../../../Util/Validator"
import PropTypes from "prop-types"

class ResourcePicker extends React.Component {
  state = {
    isOpen: false,
  }

  onClose = () => {
    this.setState({ isOpen: false })
  }

  onOpen = () => {
    this.setState({ isOpen: true })
  }

  render() {
    const { isOpen } = this.state
    const { value, id, name, onChange, callerType } = this.props
    return (
      <>
        <Button key={"edit-btn-" + id} variant="control" onClick={this.onOpen}>
          <EditIcon />
        </Button>
        <Modal
          key={"edit-field-data" + id}
          title={"Update value: " + name}
          variant={ModalVariant.medium}
          position="top"
          isOpen={isOpen}
          onClose={this.onClose}
          onEscapePress={this.onClose}
        >
          <ErrorBoundary>
            <Editor
              key={"editor" + id}
              disableEditor={false}
              language="yaml"
              rootObject={getRootObject(value)}
              onSaveFunc={(rootObject) => {
                updateValue(rootObject, onChange, this.onClose)
              }}
              onChangeFunc={() => {}}
              minimapEnabled={false}
              onCancelFunc={this.onClose}
              isWidthLimited={false}
              getFormItems={(rootObject) => getItems(rootObject, callerType)}
              saveButtonText="Update"
            />
          </ErrorBoundary>
        </Modal>
      </>
    )
  }
}

ResourcePicker.propTypes = {
  value: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  callerType: PropTypes.string,
}

export default ResourcePicker

const getItems = (rootObject, callerType) => {
  const FieldTypes = FieldDataTypeOptions.filter((t) => {
    if (callerType === CallerType.Variable) {
      switch (t.value) {
        case FieldDataType.TypeString:
        case FieldDataType.TypeResourceByLabels:
        case FieldDataType.TypeResourceByQuickId:
          return true
        default:
          return false
      }
    } else {
      return true
    }
  })

  const items = [
    {
      label: "Data Type",
      fieldId: "type",
      fieldType: FieldType.SelectTypeAhead,
      dataType: DataType.String,
      value: "",
      isRequired: true,
      isDisabled: false,
      helperText: "",
      helperTextInvalid: "Invalid type",
      validated: "default",
      options: FieldTypes,
      validator: { isNotEmpty: {} },
      resetFields: { data: {}, string: "" },
    },
  ]
  const dataType = objectPath.get(rootObject, "type", FieldDataType.TypeString)

  switch (dataType) {
    case FieldDataType.TypeResourceByQuickId:
    case FieldDataType.TypeResourceByLabels:
      const resItems = getResourceDataItems(rootObject, dataType, callerType)
      items.push(...resItems)
      break

    case FieldDataType.TypeEmail:
      const emailItems = getEmailDataItems(rootObject)
      items.push(...emailItems)
      break

    case FieldDataType.TypeTelegram:
      const telegramItems = getTelegramDataItems(rootObject)
      items.push(...telegramItems)
      break

    case FieldDataType.TypeExporter:
      const exporterItems = getExporterItems(rootObject)
      items.push(...exporterItems)
      break

    default:
      items.push({
        label: "Value",
        fieldId: "string",
        fieldType: FieldType.Text,
        dataType: DataType.String,
        value: "",
      })
  }

  return items
}

const getResourceDataItems = (rootObject = {}, dataType, callerType) => {
  const items = []
  items.push({
    label: "Resource Type",
    fieldId: "data.resourceType",
    fieldType: FieldType.SelectTypeAhead,
    dataType: DataType.String,
    value: "",
    isRequired: true,
    isDisabled: false,
    helperText: "",
    helperTextInvalid: "Invalid type",
    validated: "default",
    options: ResourceTypeOptions,
    validator: { isNotEmpty: {} },
  })

  switch (dataType) {
    case FieldDataType.TypeResourceByQuickId:
      const resourceType = objectPath.get(rootObject, "data.resourceType", "")

      if (resourceType !== "") {
        const resourceAPI = getResourceOptionsAPI(resourceType)
        const resourceOptionValueFunc = getResourceOptionValueFunc(resourceType)
        const resourceFilterFunc = getResourceFilterFunc(resourceType)
        const resourceDescriptionFunc = getOptionsDescriptionFunc(resourceType)
        items.push({
          label: "Resource",
          fieldId: "data.quickId",
          apiOptions: resourceAPI,
          optionValueFunc: resourceOptionValueFunc,
          fieldType: FieldType.SelectTypeAheadAsync,
          getFiltersFunc: resourceFilterFunc,
          getOptionsDescriptionFunc: resourceDescriptionFunc,
          dataType: DataType.String,
          value: "",
          isRequired: true,
          isDisabled: false,
          helperText: "",
          helperTextInvalid: "Invalid type",
          validated: "default",
          options: [],
          validator: { isNotEmpty: {} },
        })
      }

      break

    case FieldDataType.TypeResourceByLabels:
      items.push({
        label: "Labels",
        fieldId: "data.labels",
        fieldType: FieldType.Labels,
        dataType: DataType.Object,
        value: {},
      })
      break

    default:
    // no change
  }

  if (callerType === CallerType.Parameter) {
    items.push(
      {
        label: "Payload",
        fieldId: "data.payload",
        fieldType: FieldType.Text,
        dataType: DataType.String,
        value: "",
      },
      {
        label: "Pre Delay",
        fieldId: "data.preDelay",
        fieldType: FieldType.Text,
        dataType: DataType.String,
        value: "",
      }
    )
  } else if (callerType === CallerType.Variable) {
    items.push({
      label: "Selector",
      fieldId: "data.selector",
      fieldType: FieldType.Text,
      dataType: DataType.String,
      value: "",
    })
  }
  return items
}

const getEmailDataItems = (_rootObject) => {
  const items = [
    {
      label: "From",
      fieldId: "data.from",
      fieldType: FieldType.Text,
      dataType: DataType.String,
      value: "",
      // validator: { isEmail: {} },
    },
    {
      label: "To",
      fieldId: "data.to",
      fieldType: FieldType.DynamicArray,
      dataType: DataType.ArrayString,
      validateValueFunc: (key) => {
        return validate("isEmail", key)
      },
      value: [],
    },
    {
      label: "Subject",
      fieldId: "data.subject",
      fieldType: FieldType.Text,
      dataType: DataType.String,
      value: "",
    },
    {
      label: "Body",
      fieldId: "data.body",
      fieldType: FieldType.TextArea,
      dataType: DataType.String,
      value: "",
    },
  ]
  return items
}

const getTelegramDataItems = (_rootObject) => {
  const items = [
    {
      label: "Chat IDs",
      fieldId: "data.chatIds",
      fieldType: FieldType.DynamicArray,
      dataType: DataType.ArrayString,
      value: [],
    },
    {
      label: "Parse Mode",
      fieldId: "data.parseMode",
      fieldType: FieldType.SelectTypeAhead,
      dataType: DataType.String,
      value: "",
      options: TelegramParseModeOptions,
    },
    {
      label: "Text",
      fieldId: "data.text",
      fieldType: FieldType.TextArea,
      dataType: DataType.String,
      isRequired: true,
      value: "",
      helperText: "",
      helperTextInvalid: "Enter a valid text",
      validated: "default",
      validator: { isNotEmpty: {} },
    },
  ]
  return items
}

const getExporterItems = (rootObject) => {
  const items = []
  items.push({
    label: "Exporter Type",
    fieldId: "data.exporterType",
    isRequired: true,
    fieldType: FieldType.SelectTypeAhead,
    dataType: DataType.String,
    options: ExporterTypeOptions,
    value: "",
    resetFields: { "data.spec": {} },
    validator: { isNotEmpty: {} },
  })

  const exporterType = objectPath.get(rootObject, "data.exporterType", "")
  switch (exporterType) {
    case ExporterType.Disk:
      items.push(
        {
          label: "Export Type",
          fieldId: "data.spec.exportType",
          fieldType: FieldType.SelectTypeAhead,
          dataType: DataType.String,
          options: ExportTypeOptions,
          value: "",
          isRequired: false,
        },
        {
          label: "Target Directory",
          fieldId: "data.spec.targetDirectory",
          fieldType: FieldType.Text,
          dataType: DataType.String,
          value: "",
          isRequired: false,
        }
      )
      break

    default:
  }

  return items
}
