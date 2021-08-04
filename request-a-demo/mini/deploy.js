await hoctail.stx(({ store, types }) => {
  const { schema } = store.system
  
  const tableName = 'Requests'
  let table = schema.table(tableName)
  if (!table) {
    table = schema.addTable(tableName)
    table.addColumn(types.Email, { name: 'email', type: 'singleLine', key: true })
    table.addColumn(types.Json, { name: 'firstName', type: 'singleLine' })
    table.addColumn(types.Json, { name: 'lastName', type: 'singleLine' })
    table.addColumn(types.Json, { name: 'about', type: 'multiLine' })
    table.addColumn(types.Json, { name: 'interestedIn', type: 'singleLine' })
    table.addColumn(types.Text, { name: 'status', uiDataType: 'singleLine' })
    table.addColumn(types.Json, { name: 'submit', uiDataType: 'action' })

    store.runCommand({
      op: 'add',
      path: `/schemas/${schema.schemaName}/tables/${tableName}/constraints/unique/email`,
    })
  }

  table.setVisibleToOthers(true)
  table.setAllowOthersToInsert(true)
  schema.table('metadata').setVisibleToOthers(true)
  schema.table('metadata').setAllowOthersToSelect(true)

  table.offEvent(inserted)
  table.setTrigger({
    func: inserted,
    event: `before insert`,
    props: { tableName },
  })

  function inserted (event) {
    console.log('inserted record', JSON.stringify(event.new))
    const EmailValidator = require('email-validator')
    if (!EmailValidator.validate(event.new.email)) {
      throw new Error(`Email '${event.new.email}' is invalid`)
    }
    if (hoc.context.owner.length && event.new.owner !== hoc.context.owner) {
      const count = parseInt((hoc.sql(
        `select count(1) from "${event.schema}"."${event.table}"`,
      ))[0].count)
      if (count > 1) throw new Error(`User can't submit request more than once.`)
    }
    event.new.status = 'added'
    return event.new
  }
})

