await hoctail.install('node_modules/email-validator')

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

  // using before trigger to be able altering a data
  table.setAction(inserted_updated, { when: 'before', op: ['insert', 'update', 'delete'] })
  console.log('table triggers', JSON.stringify(Array.from(table.triggers.keys())))

  function inserted_updated (event) {
    hoc.dummyLog(`inserted trigger ${event.op} ${event.when}, old: ${JSON.stringify(event.old)}, new: ${JSON.stringify(event.new)}`)

    // avoid population bad email
    const email = event.new ? event.new.email : event.old.email
    const owner = event.new ? event.new.owner : event.old.owner

    const EmailValidator = require('email-validator')
    if (!EmailValidator.validate(email)) {
      throw new Error(`Email '${email}' is invalid`)
    }
    if (event.op === 'INSERT') {
      // do not allow submit more than once
      if (hoc.context.owner.length && owner !== hoc.context.owner) {
        const count = parseInt((hoc.sql(
          `select count(1) from "${event.schema}"."${event.table}"`,
        ))[0].count)
        if (count > 1) throw new Error(`User can't submit request more than once.`)
      }
      event.new.status = 'added'
    } else if (event.op === 'UPDATE' || event.op === 'DELETE') {
      hoc.dummyLog(`trigger ${event.op}, rec owner ${owner}, app owner ${hoc.context.owner}, hoc.isOwner ${hoc.isOwner}`)
      if (!hoc.isOwner) {
        throw new Error('User not allowed to update/delete submitted data')
      }
    }
    
    return event.new
  }
})

