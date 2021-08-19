import EmailValidator from 'email-validator'
import { plugin, typePlugin, cssWrapper } from '@hoc/plugins-core'
import { rootModel } from '@hoc/models'
import { List, Label, Table } from '@hoc/components'
import { CommonModel, ensureLocalRecord,
  LocalTableName, OneRowOnlyMessage, InsufficientDataMessage,
  SubmittedTitle, SubmittedMessage, BadEmailMessage, title,
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
    submitValue => self.submit(),
    'submit',
  ], [
    () => self.submittedRecord ? self.submittedRecord.column('status').value : '',
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
    const { email, FirstName, LastName, about, interestedIn }
      = self.localRecord.object()
    if (email && FirstName && LastName && about && interestedIn) {
      if (!EmailValidator.validate(email)) {
        self.showError(
          self.submitButtonElement, BadEmailMessage,
          { relativePos: 'bottom' }
        )
      } else if (self.insertRecord()) {
        // use err tooltip to show request submitted
        self.showError(
          self.submitButtonElement, SubmittedMessage,
          { relativePos: 'bottom' }
        )
      }
    } else {
      self.showError(
        self.submitButtonElement, InsufficientDataMessage,
        { relativePos: 'bottom' }
      )
    }
  },
  setSubmitted () {
    const submitted = (
      self.submittedRecord &&
      self.submittedRecord.column('status').value === 'submitted'
    )
    self.label.setText(submitted ? SubmittedTitle : title)
    // recreate table ui with read only flag,
    // since there is no action like table.setReadOnly
    self.snapshot.items[1] = Table.create({
      readOnly: submitted ? true : false,
      readOnlySchema: true, // no controls for renaming columns
      id: ensureLocalRecord().table.id,
    })
  },
}))
