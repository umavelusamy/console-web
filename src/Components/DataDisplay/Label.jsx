import { Flex, FlexItem, Label as PfLabel } from "@patternfly/react-core"
import React from "react"
import IFrame from "../IFrame/IFrame"

import "./Label.scss"

export const Label = ({ name, value, index = 0 }) => {
  return (
    <FlexItem key={name + index} className="mc-label">
      <span className="label-pair">
        <PfLabel className="label-key">{name}</PfLabel>
        {value && value.length > 0 && <PfLabel className="label-value">{value || ""}</PfLabel>}
      </span>
    </FlexItem>
  )
}

export const Labels = ({ data = {} }) => {
  if (data === null) {
    return <span>No labels</span>
  }
  const names = Object.keys(data)

  if (names.length === 0) {
    return <span>No labels</span>
  }

  names.sort()

  const elements = names.map((name, index) => {
    return <Label key={index} name={name} value={data[name]} index={index} />
  })
  return <Flex>{elements}</Flex>
}

const hideItems = ["password", "token"]

export const KeyValue = ({ name, value, index = 0 }) => {
  let finalValue = ""
  switch (name) {
    case "node_web_url":
      finalValue = <IFrame url={value} />
      break
    default:
      finalValue = hideItems.includes(name) ? "******" : value !== undefined ? String(value) : ""
  }
  return (
    <div className="key-value-map" key={name + index}>
      <span className="key">{name}</span> <span className="value">{finalValue}</span>
    </div>
  )
}

export const KeyValueMap = ({ data = {} }) => {
  if (data === undefined || data === null) {
    return <span>No data</span>
  }
  const names = Object.keys(data)
  if (names.length === 0) {
    return <span>No data</span>
  }

  names.sort()

  const elements = names.map((name, index) => {
    const value = typeof data[name] !== "object" ? data[name] : JSON.stringify(data[name],null," ")
    return <KeyValue key={index} name={name} value={value} index={index} />
  })
  return elements
}
