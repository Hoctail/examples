// import React from 'react'
import { plugin, plugins, typePlugin, cssWrapper } from '@hoc/plugins-core'
import { formInputParams, createSelectItemColoredText, } from '@hoc/components'
import { storeRoot, rootModel, RecordSafeReference } from '@hoc/models'
import { values } from 'mobx'
import { types } from 'mobx-state-tree'
import { RequestADemo } from './src/requestADemo'
import { AsketMode } from './src/asketMode'

export default [
  AsketMode,
  RequestADemo,
]
