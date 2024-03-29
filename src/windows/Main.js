'use strict'

import { app, BrowserWindow, globalShortcut } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'

import MonitorWindow from '@/windows/Monitor'

const isDevelopment = process.env.NODE_ENV !== 'production'

let win

export default {
  getWindow () {
    return win
  },
  async createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
      width: 1122,
      height: 600,
      minHeight: 600,
      minWidth: 1122,
      center: true,
      show: false,
      frame: false,
      webPreferences: {
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
        enableRemoteModule: true,
        webSecurity: false
      }
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
      if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
      createProtocol('app')
      // Load the index.html when not in development
      win.loadURL('app://./index.html')
    }

    win.once('ready-to-show', async () => {
      win.show()

      try {
        const version = await app.getVersion()
        const client = require('discord-rich-presence')(process.env.VUE_APP_DISCORD_CLIENT_ID)

        client.updatePresence({
          startTimestamp: Math.floor(Date.now() / 1000),
          details: `v${version}`,
          largeImageKey: '1024x1024',
          instance: true
        })
      } catch (error) {
        console.log(error)
      }
    })

    win.on('closed', () => {
      if (MonitorWindow.getWindow()) MonitorWindow.getWindow().destroy()

      win = null
    })

    if (!isDevelopment) {
      win.on('focus', () => {
        globalShortcut.register('CommandOrControl+R', () => {})
      })

      win.on('blur', () => {
        globalShortcut.unregister('CommandOrControl+R')
      })
    }
  }
}
