import Vue from 'vue'
import Vuex from 'vuex'

import core from './modules/core'
import snackbar from './modules/snackbar'
import dialog from './modules/dialog'

import settings from './modules/models/settings'
import proxy from './modules/models/proxy'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    core,
    snackbar,
    dialog,

    settings,
    proxy
  }
})
