import { getBase } from "../listPageBase"

const slice = getBase("resourceSensor")

export default slice.reducer

export const {
  updateRecords,
  loading,
  loadingFailed,
  updateFilter,
  deleteFilterValue,
  deleteFilterCategory,
  deleteAllFilter,
  onSortBy,
} = slice.actions
