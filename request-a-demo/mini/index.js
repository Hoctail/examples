import { plugin, plugins, typePlugin, cssWrapper } from '@hoc/plugins-core'
import { formInputParams, createSelectItemColoredText } from '@hoc/components'
import EmailValidator from 'email-validator'
import { rootModel, RecordSafeReference } from '@hoc/models'

const {
  List,
  CustomForm,
  CustomFormContent,
  Button,
  Input,
  TextArea,
  InputSelect,
} = plugins

export default plugin('RequestADemo', {
  submittedRecord: RecordSafeReference,
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
          input: Input.create({
            ...formInputParams(),
            autoFocus: false,
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
            onClick: 'RequestADemo.FormOk',
          },
        }),
      ],
    }),
  })),
}).reactions(self => [
  [
    () => self.submittedRecord ? self.submittedRecord.column('status').value : null,
    status => {
      if (status != null) {
        rootModel().system.schema.setMeta('status', status)
        self.handleStatus()
      }
    },
    'status'
  ], [
    () => self.table ? self.table.records.size : 0,
    size => {
      if (size > 0) self.setSubmittedRecord()
    },
    'setSubmittedRecord',
  ], [
    () => self.form.error,
    error => self.enableOkButton(!error),
    'enableOkButton',
  ], [
    () => self.formContent.currentDataStr,
    () => {
      // save in local storage what user entered
      rootModel().system.schema.setMeta(
        'formData', self.formContent.data, 'local',
      )
    },
    'save formData locally',
  ],
]).views(self => ({
  get form () {
    return self.snapshot
  },
  get formContent () {
    return self.form.formContent
  },
  get table () {
    return rootModel().system.schema.table('Demo Requests')
  },
})).actions(self => ({
  afterCreate () {
    self.form.dialog.closeButton.setVisible(false)
    self.handleStatus()
    self.loadSavedData()
    self.form.setErrorHandler('email', inputMethod => {
      if (!EmailValidator.validate(inputMethod.inputValue)) {
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
  enableOkButton (enable) {
    self.form.buttons.items[0].enableButton(enable)
  },
  showSubmittedInfo () {
    rootModel().getController('TooltipMessage').showMessage(
      self.form.buttons.items[0], 'Submitted',
    )
    self.form.dialog.setTitle('Request submitted!')
  },
  handleStatus () {
    if (rootModel().system.schema.getMeta('status') === 'ok') {
      self.form.dialog.setTitle('Request submitted!')
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
    // since we save data on submit, here we populate form with
    // already submitted data so user can see it when open again
    const formData = rootModel().system.schema.getMeta('formData', 'local')
    if (formData) {
      self.formContent.setFormData(formData)
    }
    self.form.handleErrors() // check if loaded data has errors
    self.enableOkButton(!self.form.error) // try enabling ok button
  },
  submit () {
    const { data } = self.formContent
    if (!self.table) {
      throw new Error("Didn't locate table: 'Demo Requests'")
    }
    self.table.insertRecordData(data)
  },
  setSubmittedRecord () {
    const table = self.table
    if (table && table.records.size > 0) {
      //if (!self.submittedRecord) {
        self.submittedRecord = Array.from(table.records.values())[0]
      // }
      //  else if (table.records.size > 1) {
      //  throw new Error('Not allowed to have more than one record')
      //}
    }
  },
})).events({
  HandleSelectInputItem ({ data }) {
    InputSelect.self(data).handleItemClick(data)
  },
  FormOk ({ self, data, errHandlers }) {
    self.submit()
    //const { schema } = rootModel().system
    //const status = schema.getMeta('status', 'local')
    // form data returned by getter
    //const formData = self.formContent.data
    //schema.setMeta('status', true, 'local')
    //console.log(formData)
    // something went wrong
    
    // errHandlers.push([() => self.showError(data, self.status.value())])
  },
})
