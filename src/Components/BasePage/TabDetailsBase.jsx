import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Grid,
  GridItem
} from "@patternfly/react-core"
import PropTypes from "prop-types"
import React from "react"
import Metrics from "../../Pages/Resources/SensorField/Metrics"
import Loading from "../Loading/Loading"
import PageContent from "../PageContent/PageContent"
import Table from "../Table/Table"

export default class TabDetailsBase extends React.Component {
  state = {
    loading: true,
    data: {},
  }

  componentDidMount() {
    if (this.props.resourceId) {
      this.props
        .apiGetRecord(this.props.resourceId)
        .then((res) => {
          this.setState({ data: res.data, loading: false })
        })
        .catch((_e) => {
          this.setState({ loading: false })
        })
    } else {
      this.setState({ loading: false })
    }
  }

  tableRowFuncCellWrapper = (rawData, _index, history) => {
    const rowCells = this.props.getTableRowsFunc(rawData, _index, history)
    return {
      cells: rowCells,
      rid: rawData.id,
    }
  }

  getTable = (data) => {
    return (
      <Table
        title={this.props.tableTitle}
        apiGetRecords={this.props.apiListTablesRecord}
        tableColumns={this.props.tableColumns}
        toRowFunc={this.tableRowFuncCellWrapper}
        history={this.props.history}
        filters={this.props.getTableFilterFunc(data)}
      />
    )
  }

  render() {
    const { data, loading } = this.state

    if (loading) {
      return <Loading />
    }

    const content = wrapCard("Details", this.props.getDetailsFunc(data))
    const metrics = this.props.showMetrics ? <Metrics data={data} /> : null
    return (
      <>
        <PageContent>
          {metrics}
          <Grid sm={12} md={12} lg={12} xl={12}>
            {this.props.tableColumns ? this.getTable(data) : null}
          </Grid>
          <Grid sm={12} md={12} lg={12} xl={12}>
            {content}
          </Grid>
        </PageContent>
      </>
    )
  }
}

TabDetailsBase.propTypes = {
  resourceId: PropTypes.string,
  apiGetRecord: PropTypes.func,
  apiListTablesRecord: PropTypes.func,
  getTableFilterFunc: PropTypes.func,
  getTableRowsFunc: PropTypes.func,
  tableTitle: PropTypes.string,
  tableColumns: PropTypes.array,
  getDetailsFunc: PropTypes.func,
  showMetrics: PropTypes.bool,
}

// helper functions

const wrapField = (key, value) => {
  return (
    <DescriptionListGroup key={key}>
      <DescriptionListTerm>{key}</DescriptionListTerm>
      <DescriptionListDescription>{value}</DescriptionListDescription>
    </DescriptionListGroup>
  )
}

const wrapCard = (title, fieldsMap) => {
  const content = []
  const fieldMapKeys = Object.keys(fieldsMap)
  fieldMapKeys.forEach((key) => {
    const fieldsList = fieldsMap[key].map(({ key, value }) => wrapField(key, value))
    content.push(
      <DescriptionList key={key} isHorizontal={false}>
        {fieldsList}
      </DescriptionList>
    )
  })

  return (
    <GridItem key={title}>
      <Card isFlat={false}>
        <CardTitle>
          {title} <Divider />
        </CardTitle>
        <CardBody>
          <Grid hasGutter sm={12} md={12} lg={6} xl={6}>
            {content}
          </Grid>
        </CardBody>
      </Card>
    </GridItem>
  )
}
