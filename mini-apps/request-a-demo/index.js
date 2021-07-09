import { plugin, plugins, typePlugin, cssWrapper } from '@hoc/plugins-core'
import { formInputParams, createSelectItemColoredText } from '@hoc/components'
import * as EmailValidator from 'email-validator'
import { rootModel } from '@hoc/models'

const {
  List,
  CustomForm,
  CustomFormContent,
  Button,
  Input,
  InputSelect,
} = plugins

export default plugin('RequestADemo', {
  snapshot: typePlugin(CustomForm, p => p.create({
    formContent: CustomFormContent.create({
      // add wrapper around scroll area as scroller doesn't respect paddings
      outerCss: cssWrapper``,
      editingRecord: null,
      fields: {
	      firstName: {
          displayName: 'First Name',
          input: Input.create({
            ...formInputParams(),
            events: {
              onFocus: 'RequestADemo.InputFocused',
            },
          }),
        },
	      lastName: {
          displayName: 'Last Name',
          input: Input.create({
            ...formInputParams(),
          }),
        },	
	      email: {
          displayName: 'Email',
          input: Input.create({
              ...formInputParams(),
          }),
        },
	      name: {
          displayName: 'App name',
          input: Input.create({
            ...formInputParams(),
          }),
        },
        interestedIn: {
          displayName: 'Interested in',
          input: InputSelect.create({
            width: '10rem',
            items: [
              createSelectItemColoredText('', null, {}, {
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
          name: 'OkBtn',
          testid: 'OkBtn',
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
    () => self.formContent.currentDataStr,
    currentStr => {
      self.enableOkButton(
        !self.isDusplicateAppName &&
        self.formValue('name').length &&
        currentStr !== self.formContent.prevDataStr,
      )
    },
    'enableOkButton',
  ],
]).views(self => ({
  get formContent () {
    return self.snapshot.formContent
  },
  get validated () {
    const { firstName, lastName } = self.snapshot.formContent.data
    return {
      firstName: firstName.length > 1 ? true : 'Too short',
      lastName: lastName.length > 1 ? true : 'Too short',      
      email: EmailValidator.validate("test@email.com"),
    }
  }
})).actions(self => ({
  afterCreate () {
    self.snapshot.dialog.setTitle('Request a demo')
    self.snapshot.dialog.closeButton.setVisible(false)
    self.snapshot.show()
  },
  enableOkButton (enable) {
    self.snapshot.buttons.items[0].enableButton(enable)
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
})).events({
  HandleSelectInputItem: ({ data }) => {
    InputSelect.self(data).handleItemClick(data)
  },
  InputFocused: ({ self, data }) => {
    console.log(data.inputValue)
  },
  FormOk: ({ self }) => {

  },
})
