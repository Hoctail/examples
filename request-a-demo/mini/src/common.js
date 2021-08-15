import { rootModel, RecordSafeReference } from '@hoc/models'
import { types } from 'mobx-state-tree'

export const title = 'Request a demo'
export const LocalTableName = 'Local request'
export const DemoRequestsTableName = 'Requests'
export const SubmittedTitle = 'Request submitted!'
export const SubmittedMessage = 'Request submitted!'
export const OneRowOnlyMessage = 'Only one row is allowed!'
export const InsufficientDataMessage = 'More fields required to input'

export function getSubmittedRecord () {
  const table = rootModel().system.schema.table(DemoRequestsTableName)
  if (table && table.records.size > 0) {
    return Array.from(table.records.values())[0]
  }
}

/**
 * Creating local table with the same columns as server table has.
 * Storage type like types.Json doesn't matter since it's just local.
*/
export function ensureLocalRecord () {
  const submittedRecord = getSubmittedRecord()
  const { store } = rootModel()
  const schema = store.schema('local')
  let table = schema.table(LocalTableName)
  if (!table) {
    const { Json } = store.types
    table = schema.addTable(LocalTableName)
    table.addColumn(Json, { name: 'email', type: 'email', key: true })
    table.addColumn(Json, { name: 'firstName', type: 'singleLine' })
    table.addColumn(Json, { name: 'lastName', type: 'singleLine' })
    table.addColumn(Json, { name: 'about', type: 'multiLine' })
    table.addColumn(Json, { name: 'interestedIn', type: 'singleLine' })
    table.addColumn(Json, { name: 'status', uiDataType: 'singleLine' })
    table.addColumn(Json, { name: 'submit', uiDataType: 'action' })
  }
  let record
  if (!table.records.size) {
    let data = {}
    // if no local record exists then load from persistent data if any
    if (submittedRecord) {
      const { submit, ...restData } = submittedRecord.object()
      data = restData
    }
    record = table.insertRecordData(data)
  } else {
    record = Array.from(table.records.values())[0]
  }
  return { table, record }
}

export const CommonModel = types.model('CommonModel', {
  localRecord: RecordSafeReference,
}).views(self => ({
  get table () {
    return rootModel().system.schema.table(DemoRequestsTableName)
  },
  get localRecords () {
    return Array.from(self.localTableStore.records.values())
  },
  get submittedRecord () {
    return getSubmittedRecord()
  },
})).actions(self => ({
  afterCreate () {
    self.ensureLocalRecord()
  },
  showError (relativeElement, message, options) {
    rootModel().getController('TooltipError').showMessage(
      relativeElement,
      message, options || { relativePos: 'right' },
    )
  },
  showInfo (relativeElement, message, options) {
    rootModel().getController('TooltipMessage').showMessage(
      relativeElement, message, options,
    )
  },
  ensureLocalRecord () {
    self.localRecord = ensureLocalRecord().record
    return self.localRecord
  },
  insertRecord () {
    const { status, submit, ...data } = self.localRecord.object()
    if (!self.table) {
      throw new Error(`Didn't locate table: '${DemoRequestsTableName}'`)
    }
    self.table.insertRecordData({
      ...data,
    })
    return true
  },
}))