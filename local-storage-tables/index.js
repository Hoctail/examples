import { plugin, typePlugin, cssWrapper } from '@hoc/plugins-core'
import { Tables } from '@hoc/components'

export default plugin('LocalTables', {
  navbar: false,
  snapshot: typePlugin(Tables, () => Tables.create({
    schema: 'local',
  })),
  innerCss: cssWrapper`height: 100%; background: #fff;`,
})
