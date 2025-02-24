import React from "react"
import {
  ChartArea,
  ChartBar,
  ChartGroup,
  ChartLine,
  ChartThemeColor,
  ChartVoronoiContainer,
} from "@patternfly/react-charts"
import { capitalizeFirstLetter, getValue } from "../../../Util/Util"
import { ChartType } from "../../../Constants/Widgets/UtilizationPanel"
import { Stack, StackItem } from "@patternfly/react-core"
import "./UtilizationPanel.scss"
import { InterpolationType, MetricType } from "../../../Constants/Metric"
import v from "validator"

const SparkLine = ({ config = {}, resource = {}, metric = {} }) => {
  const chartType = getValue(config, "chart.type", ChartType.SparkLine)
  const chartColor = getValue(config, "chart.color", ChartThemeColor.blue)
  const strokeWidth = getValue(config, "chart.strokeWidth", 2)
  const chartInterpolation = getValue(config, "chart.interpolation", InterpolationType.Basis)
  const metricFunction = getValue(config, "chart.metricFunction", "")
  const unit = getValue(config, "resource.unit", "")
  const roundDecimal = getValue(config, "resource.roundDecimal", 2)

  const displayValueFloat = parseFloat(resource.value)
  let displayValue = resource.value

  if (v.isFloat(String(displayValue), {})) {
    displayValue = displayValueFloat.toFixed(roundDecimal)
  }

  const isMetricDataAvailable = getValue(metric, "data.length", 0)

  let metricsChart = null

  if (isMetricDataAvailable) {
    let chart = null
    let padding = 0

    switch (chartType) {
      case ChartType.SparkArea:
        chart = (
          <ChartArea
            style={{
              data: {
                fill: chartColor,
                fillOpacity: 0.3,
                stroke: chartColor,
                strokeWidth: strokeWidth,
              },
            }}
            interpolation={chartInterpolation}
            animate={false}
            data={metric.data}
          />
        )
        // padding = { bottom: -5, left: -2, right: -2 }
        break

      case ChartType.SparkLine:
        chart = (
          <ChartLine
            style={{ data: { strokeWidth: strokeWidth } }}
            interpolation={chartInterpolation}
            animate={false}
            data={metric.data}
          />
        )
        break

      case ChartType.SparkBar:
        chart = <ChartBar animate={false} data={metric.data} />
        break

      default:
    }

    const minValue = metric.minValue !== undefined ? metric.minValue - metric.minValue * 0.1 : 0

    metricsChart = (
      <ChartGroup
        standalone={true}
        height={100}
        width={400}
        domainPadding={{ y: 9 }}
        minDomain={{ y: minValue }}
        containerComponent={
          <ChartVoronoiContainer
            labels={({ datum }) => {
              if (datum.y || datum.y === 0) {
                // round decimal number
                const yValue = datum.y % 1 === 0 ? datum.y : datum.y.toFixed(roundDecimal)
                return `${yValue} ${unit} at ${datum.x}`
              }
              return null
            }}
            constrainToVisibleArea
          />
        }
        padding={padding}
        color={chartColor}
        scale={{ x: "time", y: "linear" }}
      >
        {chart}
      </ChartGroup>
    )
  } else {
    metricsChart = (
      <span className="no-metric-data" style={{ color: chartColor }}>
        Metric data not available
      </span>
    )
  }

  let unitText = unit
  let metricFunctionText = ""
  let displayValueText = displayValue

  if (resource.metricType === MetricType.Binary) {
    unitText = ""
    displayValueText = displayValue ? "ON" : "OFF"
  }

  if (resource.metricType !== MetricType.Binary && isMetricDataAvailable) {
    metricFunctionText = `[${capitalizeFirstLetter(metricFunction)}]`
  }

  return (
    <Stack className="mc-spark-chart" hasGutter={false}>
      <StackItem>
        <span class="title">{resource.name}</span>
      </StackItem>
      <StackItem>
        <span class="value">{displayValueText}</span>
        <span className="value-unit">{unitText}</span>
        <span className="metric-function">{metricFunctionText}</span>
      </StackItem>
      <StackItem>{metricsChart}</StackItem>
    </Stack>
  )
}

export default SparkLine
