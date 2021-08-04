import { plugin, plugins, typePlugin, cssWrapper } from '@hoc/plugins-core'
import { formInputParams, createSelectItemColoredText } from '@hoc/components'
import { storeRoot, rootModel, RecordSafeReference } from '@hoc/models'

const {
  List,
  CustomForm,
  CustomFormContent,
  Button,
  Input,
  InputEmail,
  TextArea,
  InputSelect,
} = plugins

const DemoRequestsTableName = 'Requests'
const SubmittedTitle = 'Request submitted!'
const SubmittedMessage = 'Request submitted!'

/**
 * Creating local table with the same columns as server table has.
 * Storage type like types.Json doesn't matter since it's just local.
*/
function ensureLocalRecord () {
  const tableName = 'Local request'
  const store = storeRoot()
  const schema = store.schema('local')
  const { types } = store
  let table = schema.table(tableName)
  if (!table) {
    table = schema.addTable(tableName)
    table.addColumn(types.Json, { name: 'email', type: 'email', key: true })
    table.addColumn(types.Json, { name: 'firstName', type: 'singleLine' })
    table.addColumn(types.Json, { name: 'lastName', type: 'singleLine' })
    table.addColumn(types.Json, { name: 'about', type: 'multiLine' })
    table.addColumn(types.Json, { name: 'interestedIn', type: 'singleLine' })
    table.addColumn(types.Json, { name: 'status', uiDataType: 'singleLine' })
    table.addColumn(types.Json, { name: 'submit', uiDataType: 'action' })
  }
  let record
  if (!table.records.size) {
    record = table.insertRecordData({})
  } else {
    record = Array.from(table.records.values())[0]
  }
  return record
}

export default plugin('RequestADemo', {
  localRecord: RecordSafeReference,
  snapshot: typePlugin(CustomForm, p => p.create({
    title: 'Request a demo',
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
  })),
}).reactions(self => [
  [
    () => !self.localRecord,
    () => self.setLocalRecord(),
    'setLocalRecord',
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
  get table () {
    return rootModel().system.schema.table(DemoRequestsTableName)
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
  setLocalRecord () {
    self.localRecord = ensureLocalRecord()
    self.formContent.setEditingRecord(self.localRecord)
  },
  afterCreate () {
    self.setLocalRecord()
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
    self.okButton.enableButton(/*!self.submittedRecord && */enable)
  },
  showMessageAsideOkButton (message) {
    // show message aside of okButton
    rootModel().getController('TooltipMessage').showMessage(
      self.okButton, message,
    )
  },
  showSubmittedInfo () {
    self.showMessageAsideOkButton(SubmittedMessage)
    self.setTitle()
  },
  setTitle () {
    if (self.submittedRecord) {
      self.form.dialog.setTitle(SubmittedTitle)
      self.setReadOnly()
    }
  },
  showError (relativeElement, error) {
    const tooltip = rootModel().getController('TooltipError')
    tooltip.showMessage(relativeElement,
      error,
      { relativePos: 'right' },
    )
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
    const { data } = self.formContent
    if (!self.table) {
      throw new Error(`Didn't locate table: '${DemoRequestsTableName}'`)
    }
    self.table.insertRecordData(data)
    self.showMessageAsideOkButton('Submitted!')
    self.setTitle()
    self.handleOkButtonVisibility() // try enabling ok button
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
