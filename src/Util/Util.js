import { v4 as uuidv4 } from "uuid"
import clone from "lodash.clonedeep"
import objectPath from "object-path"

export const toString = (data) => {
  return JSON.stringify(data)
}

export const getRandomId = () => {
  return uuidv4()
}

export const cloneDeep = (obj) => clone(obj)

export const noop = () => {}

export const getValue = (obj, fieldKey, defaultValue = "") => objectPath.get(obj, fieldKey, defaultValue)

export const splitWithTail = (str = "", separator, limit) => {
  const parts = str.split(separator)
  const tail = parts.slice(limit).join(separator)
  const result = parts.slice(0, limit)
  if (tail.length > 0) {
    result.push(tail)
  }
  return result
}

export const getMetricDuration = (interval, options) => {
  for (let index = 0; index < options.length; index++) {
    const duration = options[index]
    if (interval === duration.value) {
      return duration
    }
  }
  return options[0]
}

export const capitalizeFirstLetter = (value) => {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
