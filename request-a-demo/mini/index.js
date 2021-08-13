// import React from 'react'
import { plugin, plugins, typePlugin, cssWrapper } from '@hoc/plugins-core'
import { formInputParams, createSelectItemColoredText, } from '@hoc/components'
import { storeRoot, rootModel, RecordSafeReference } from '@hoc/models'
import { values } from 'mobx'
import { types } from 'mobx-state-tree'

const {
  List,
  CustomForm,
  CustomFormContent,
  Button,
  Input,
  InputEmail,
  TextArea,
  InputSelect,
  Label,
  Table,
  Demo,
} = plugins

const title = 'Request a demo'
const localTableName = 'Local request'
const DemoRequestsTableName = 'Requests'
const SubmittedTitle = 'Request submitted!'
const SubmittedMessage = 'Request submitted!'
const OneRowOnlyMessage = 'Only one row is allowed!'
const InsufficientDataMessage = 'More fields required to input'

/**
 * Creating local table with the same columns as server table has.
 * Storage type like types.Json doesn't matter since it's just local.
*/
function ensureLocalRecord () {
  const store = storeRoot()
  const schema = store.schema('local')
  let table = schema.table(localTableName)
  if (!table) {
    const { Json } = store.types
    table = schema.addTable(localTableName)
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
    record = table.insertRecordData({})
  } else {
    record = Array.from(table.records.values())[0]
  }
  return { table, record }
}

const CommonModel = types.model('CommonModel', {
  localRecord: RecordSafeReference,
}).views(self => ({
  get table () {
    return rootModel().system.schema.table(DemoRequestsTableName)
  },
  get localRecords () {
    return values(self.localTableStore.records)
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

function formInstance () {
  return CustomForm.create({
    title: title,
    formContent: CustomFormContent.create({
      // add wrapper around scroll area as scroller doesn't respect paddings
      outerCss: cssWrapper``,
      innerCss: cssWrapper`width: 18rem;`,
      fields: {
	      firstName: {
          required: true,
          displayName: 'First Name',
          input: Input.create({
            ...formInputParams(),
            autoFocus: true,
          }),
        },
	      lastName: {
          required: true,
          displayName: 'Last Name',
          input: Input.create({
            ...formInputParams(),
            autoFocus: false,
          }),
        },	
	      email: {
          required: true,
          displayName: 'Email',
          input: InputEmail.create({
            ...formInputParams(),
            autoFocus: false,
            coloredOnError: false,
          }),
        },
	      about: {
          required: true,
          displayName: 'About',
          input: TextArea.create({
            ...formInputParams(),
            autoFocus: false,
            rows: 4,
          }),
        },
        interestedIn: {
          displayName: 'Interested in',
          input: InputSelect.create({
            width: '10rem',
            items: [
              createSelectItemColoredText('Select an option', null, { bgcolor: 'red' }, {
                events: {
                  onClick: 'RequestADemo.HandleSelectInputItem',
                },
              }),
              createSelectItemColoredText('UI applications', null, { bgcolor: 'blue' }, {
                events: {
                  onClick: 'RequestADemo.HandleSelectInputItem',
                },
              }),
              createSelectItemColoredText('Server applications', null, { bgcolor: 'blue' }, {
                events: {
                  onClick: 'RequestADemo.HandleSelectInputItem',
                },
              }),
              createSelectItemColoredText('Both: server & UI', null, { bgcolor: 'blue' }, {
                events: {
                  onClick: 'RequestADemo.HandleSelectInputItem',
                },
              }),              
            ],
          }),
        },
      },
    }),
    buttons: List.create({
      innerCss: cssWrapper`
        display: flex;
        padding: 1.5rem;
        justify-content: center;
      `,
      items: [
        Button.create({
          innerCss: cssWrapper('disabled')`
	          ${props => props.disabled ? `
	            background: #FFBF00;
	            opacity: 0.5;
	          ` : `
	            background: #FFBF00;
	            opacity: 0.9;
	          `}
	        `,
          name: 'Submit',
          disabled: true,
          events: {
            onClick: 'RequestADemo.Submit',
            onMouseEnter: 'RequestADemo.HoveringOkButton',
          },
        }),
      ],
    }),
  })
} 

const RequestADemo = plugin('RequestADemo', CommonModel, {
  navbar: false,
  snapshot: typePlugin(CustomForm, p => formInstance()),
}).reactions(self => [
  [
    () => !self.localRecord,
    () => self.assignLocalRecord(),
    'assignLocalRecord',
  ], [
    () => self.submittedRecord,
    () => self.setTitle(),
    'setTitle',
  ], [
    () => self.form.error,
    () => self.handleOkButtonVisibility(),
    'handleOkButtonVisibility',
  ], [
    () => self.formContent.currentDataStr,
    () => {
      if (self.localRecord) {
        self.localRecord.setMany(self.formContent.data)
      } else {
        console.log('Didn\'t locate local record')
      }
    },
    'localRecord.setMany',
  ],
]).views(self => ({
  get form () {
    return self.snapshot
  },
  get formContent () {
    return self.form.formContent
  },
  get okButton () {
    return self.form.buttons.items[0]
  },
  get submittedRecord () {
    const table = self.table
    let record
    if (table && table.records.size > 0) {
      record = Array.from(table.records.values())[0]
    }
    // do not return submitted record for owner
    // so form will not be locked for owner
    if (!storeRoot().system.isOwner) return record
  },
})).actions(self => ({
  assignLocalRecord () {
    self.formContent.setEditingRecord(
      self.ensureLocalRecord()
    )
  },
  afterCreate () {
    self.ensureLocalRecord()
    self.form.dialog.closeButton.setVisible(false)
    self.setTitle()
    self.loadSavedData()
    self.form.setErrorHandler('email', inputMethod => {
      if (!inputMethod.input.valid) {
        return 'is incorrect'
      }
    })
    self.form.setErrorHandler('interestedIn', inputMethod => {
      if (inputMethod.inputValue === 'Select an option') {
        return 'not selected'
      }
    })
    self.form.show()
  },
  handleOkButtonVisibility () {
    const enable = !self.form.error
    self.okButton.enableButton(!self.submittedRecord && enable)
  },
  showMessageAsideOkButton (message) {
    self.showError(self.okButton, message)
  },
  showSubmittedInfo () {
    self.showMessageAsideOkButton(SubmittedMessage)
    self.setTitle()
  },
  setTitle () {
    const submit = self.submittedRecord
    self.form.dialog.setTitle(submit ? SubmittedTitle : title)
    self.setReadOnly(!!submit)
  },
  hideError () {
    const tooltip = rootModel().getController('TooltipError')
    tooltip.hide()
  },
  loadSavedData () {
    if (self.localRecord) {
      self.formContent.setFormData(self.localRecord.object())
    }
    self.form.handleErrors() // check if loaded data has errors
    self.handleOkButtonVisibility() // try enabling ok button
  },
  submit () {
    if (self.insertRecord()) {
      self.showMessageAsideOkButton('Submitted!')
      self.setTitle()
      self.handleOkButtonVisibility() // try enabling ok button  
    }
  },
  setReadOnly (readOnly=true) {
    self.formContent.fields.forEach((inputMethod, name) => {
      const { input } = inputMethod
      if (name === 'interestedIn') input.setDisabled(readOnly)
      else input.setReadOnly(readOnly)
    })
  },
})).events({
  HandleSelectInputItem ({ data }) {
    InputSelect.self(data).handleItemClick(data)
  },
  HoveringOkButton ({ self }) {
    if (self.submittedRecord) {
      self.showMessageAsideOkButton(SubmittedMessage)
    }
  },
  Submit ({ self, errHandlers }) {
    self.submit()
    // err handling:    
    errHandlers.push([exception => {
      if (exception.message.includes('duplicate key value violates unique constraint')) {
        mdtoast('Submit error: Duplicate email', { type: 'error' })
        return true // handled, don't display exception
      }
    }])
  },
})

const AsketMode = plugin('AsketMode', CommonModel, {
  snapshot: typePlugin(List, p => p.create({
    innerCss: cssWrapper`
      display: flex;
      flex-direction: column;
      align-items: center;
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
  ]
]).views(self => ({
  get label () {
    return self.snapshot.items[0]
  },
  get uiTable () {
    return self.snapshot.items[1]
  },
  get localTableStore () {
    return storeRoot().schema('local').table(localTableName)
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
    const el = document.querySelector(
      '[data-testid="CellAction"] > [data-testid="Button"]'
    )
    return el
  },
})).actions(self => ({
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
}))

export default [
  AsketMode,
  plugin('Demo Mode', {
    snapshot: typePlugin(Demo, p => p.create()),
  }),
  RequestADemo,
]
