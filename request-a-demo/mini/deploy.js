await hoctail.stx(({ store, types }) => {
  const { schema } = store.system

  const tableName = 'Demo Requests'
  if (!schema.table(tableName)) {
    const table = schema.addTable(tableName)
    table.addColumn(types.Json, { name: 'first', uiDataType: 'singleLine' })
    table.addColumn(types.Json, { name: 'last', uiDataType: 'singleLine' })
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
})
