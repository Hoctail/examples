import { plugin, typePlugin, cssWrapper } from '@hoc/plugins-core'
import { rootModel } from '@hoc/models'
import {
  CustomFormPlugin as CustomForm,
  CustomFormContentPlugin as CustomFormContent,
  ButtonPlugin as Button,
  InputPlugin as Input,
  InputEmailPlugin as InputEmail,
  TextAreaPlugin as TextArea,
  InputSelectPlugin as InputSelect,
  ListPlugin as List,
  formInputParams,
  createSelectItemColoredText
} from '@hoc/components'
import { title, SubmittedTitle, SubmittedMessage, CommonModel } from './common'

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

export const RequestADemo = plugin('RequestADemo', CommonModel, {
  name: 'Form View', // convention: widget name
  navbar: false, // convention: navbar visibility
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
