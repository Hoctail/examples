import { rootModel, RecordSafeReference } from '@hoc/models'
import { CellInputSelectSettings, CellActionSettings } from '@hoc/components'
import { types } from 'mobx-state-tree'

export const title = 'Request a demo'
export const LocalTableName = 'Local request'
export const DemoRequestsTableName = 'Requests'
export const SubmittedTitle = 'Request submitted!'
export const SubmittedMessage = 'Request submitted!'
export const OneRowOnlyMessage = 'Only one row is allowed!'
export const InsufficientDataMessage = 'More fields required to input'
export const BadEmailMessage = 'Bad E-mail'
export const SwitchToAsketMode = 'Switch to "Asket View"'

export const inputOpt = {
  ui: 'UI applications',
  server: 'Server applications',
  both: 'Both: server & UI',
}

export function getSubmittedRecord () {
  const table = rootModel().system.schema.table(DemoRequestsTableName)
  if (table && table.records.size > 0) {
    return Array.from(table.records.values())[0]
  }
}

/**
 * Creating local table with the same columns as server table has.
 * Storage type like types.Json doesn't matter since it's just local.
 * Note: All the operations are permitted in local schema.
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
    table.addColumn(Json, { name: 'FirstName', type: 'singleLine' })
    table.addColumn(Json, { name: 'LastName', type: 'singleLine' })
    table.addColumn(Json, { name: 'about', type: 'multiLine' })
    const interestCol = table.addColumn(Json, { name: 'interestedIn', type: 'selectItems' })
    const submitCol = table.addColumn(Json, { name: 'submit', uiDataType: 'action' })

    const inputSelectSettings = CellInputSelectSettings.create({ col: interestCol.id })
    inputSelectSettings.addSelectItem(inputOpt.ui)
    inputSelectSettings.addSelectItem(inputOpt.server)
    inputSelectSettings.addSelectItem(inputOpt.both)
    const submitCellButtonSettings = CellActionSettings.create({ col: submitCol.id })
    submitCellButtonSettings.setTimeagoTooltipShow(false)
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
    const { submit, ...data } = self.localRecord.object()
    if (!self.table) {
      throw new Error(`Didn't locate table: '${DemoRequestsTableName}'`)
    }
    self.table.insertRecordData({
      ...data,
    })
    return true
  },
}))
