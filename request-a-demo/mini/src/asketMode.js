import { plugin, typePlugin, cssWrapper } from '@hoc/plugins-core'
import { rootModel } from '@hoc/models'
import {
  ListPlugin as List,
  LabelPlugin as Label,
  TablePlugin as Table,
} from '@hoc/components'
import { CommonModel, ensureLocalRecord,
  LocalTableName, OneRowOnlyMessage, InsufficientDataMessage, SubmittedTitle,
} from './common'

export const AsketMode = plugin('AsketMode', CommonModel, {
  name: 'Asket View',
  snapshot: typePlugin(List, p => p.create({
    // set overflow for table's horizontal scrolling 
    innerCss: cssWrapper`
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: hidden;
    `,
    items: [
      Label.create({
        innerCss: cssWrapper`padding: 1rem;`,
        text: 'Request A Demo',
      }),
      Table.create({
        readOnlySchema: true, // no controls for renaming columns
        id: ensureLocalRecord().table.id,
      }),
    ],
  })),
}).reactions(self => [
  [
    () => self.hasExcessiveRecords,
    () => self.deleteExcessiveLocalRecords(),
    'deleteExcessiveLocalRecords',
  ], [
    () => self.submitValue,
    () => self.submit(),
    'submit',
  ], [
    () => self.submittedRecord,
    () => self.setSubmitted(),
    'setSubmitted'
  ],
]).views(self => ({
  get label () {
    return self.snapshot.items[0]
  },
  get uiTable () {
    return self.snapshot.items[1]
  },
  get localTableStore () {
    return rootModel().store.schema('local').table(LocalTableName)
  },
  get hasExcessiveRecords () {
    return self.localRecords.length > 1
  },
  get submitValue () {
    return self.localRecord.column('submit').value
  },
  get newRowBtn () {
    return self.uiTable.leftTable.newRow.newRowBtn
  },
  get submitButtonElement () {
    // return button element on a table either on a form
    const part = self.uiTable.formDialog
      ? '[data-testid="TableFormDialog"] ' : ''
    return document.querySelector(
      `${part}[data-testid="CellAction"] > [data-testid="Button"]`
    )
  },
})).actions(self => ({
  afterCreate () {
    self.setSubmitted()
  },
  deleteExcessiveLocalRecords () {
    if (self.hasExcessiveRecords) {
      const excessive = self.localRecords.slice(1)
      excessive.forEach(rec => {
        self.localTableStore.deleteRecord(rec.id)
      })
      console.log(OneRowOnlyMessage)
      self.showError(
        self.newRowBtn,
        OneRowOnlyMessage, { relativePos: 'bottom-right' },
      )
    }
  },
  submit () {
    const { email, firstName, lastName, about, interestedIn }
      = self.localRecord.object()
    if (email && firstName && lastName && about && interestedIn) {
      if (self.insertRecord()) {

      }
    } else {
      self.showError(
        self.submitButtonElement, InsufficientDataMessage,
        { relativePos: 'bottom' }
      )
    }
  },
  setSubmitted () {
    if (self.submittedRecord) {
      self.label.setText(SubmittedTitle)
      // recreate table component since there are no action like table.setReadOnly
      self.snapshot.items[1] = Table.create({
        readOnly: true,
        readOnlySchema: true, // no controls for renaming columns
        readOnly: self.submittedRecord ? true : false,
        id: ensureLocalRecord().table.id,
      })
    }
  },
}))
