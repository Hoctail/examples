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
    table.addColumn(types.Json, { name: 'status', uiDataType: 'singleLine' })
    table.addColumn(types.Json, { name: 'submit', uiDataType: 'action' })

    store.runCommand({
      op: 'add',
      path: `/schemas/${schema.schemaName}/tables/${tableName}/constraints/unique/email`,
    })
  }
  table.offEvent(inserted)
  table.onEvent('insert', inserted, { tableName })

  table.setVisibleToOthers(true)
  table.setAllowOthersToInsert(true)
  schema.table('metadata').setVisibleToOthers(true)
  schema.table('metadata').setAllowOthersToSelect(true)

  
  function inserted (event) {
    console.log('inserted record', JSON.stringify(event.new))
    const EmailValidator = require('email-validator')
    event.stx(store => {
      const record = store.root.triggerRecord()

      if (!EmailValidator.validate(event.new.email)) {
        throw new Error(`Email '${event.new.email}' is invalid`)
      }

      const tRecord = store.system.schema.table(event.tableName).records.get(event.new.id)
      console.log('triggerData', record, store.root.triggerData,
		  tRecord ? tRecord.toJSON(): 'no table Record in model yet',
		  JSON.stringify(event.new),
        /*JSON.stringify(hoc.sql(`select id, email from "${event.schema}"."Demo Requests" where id=$1`, [event.new.id])),*/
        JSON.stringify(store.root.clocks),
      )
      // record.set('status', 'ok')
    })
    console.log('inserted', JSON.stringify(data.new))
  }  
})
