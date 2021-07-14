await hoctail.stx(({ store, types }) => {
  const { schema } = store.system

  const tableName = 'Demo Requests'
  let table = schema.table(tableName)
  if (!table) {
    table = schema.addTable(tableName)
    table.addColumn(types.Json, { name: 'firstName', uiDataType: 'singleLine' })
    table.addColumn(types.Json, { name: 'lastName', uiDataType: 'singleLine' })
    table.addColumn(types.Json, { name: 'email', uiDataType: 'singleLine' })
    table.addColumn(types.Json, { name: 'about', uiDataType: 'multiLine' })
    table.addColumn(
      types.Json,
      { name: 'interestedIn', uiDataType: 'singleLine' },
    )
    table.addColumn(types.Json, { name: 'status', uiDataType: 'singleLine' })

    // const addConstraint = {
    //   op: 'add',
    //   path: `/schemas/${schema.schemaName}/tables/${tableName}/constraints/unique/email`,
    // }
    // console.log('addConstraint', addConstraint)
    // store.runCommand(addConstraint)
  }
  table.onEvent('insert', inserted)

  function inserted (event) {
    console.log('inserted record', JSON.stringify(event.new))
    event.stx(store => {
      const record = store.root.triggerRecord()
      const tRecord = store.system.schema.table('Demo Requests').records.get(event.new.id)
      console.log('triggerData', record, store.root.triggerData,
        tRecord ? tRecord.toJSON(): 'no table Record in model yet',
        JSON.stringify(hoc.sql(`select id, email from "${event.schema}"."Demo Requests" where id=$1`, [event.new.id])),
        JSON.stringify(store.root.clocks),
      )
      // record.set('status', 'ok')
    })
    console.log('inserted', JSON.stringify(data.new))
  }  
})
