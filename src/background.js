'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let monitorWin
let settingsWin

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 500,
    height: 900,
    minWidth: 500,
    minHeight: 600,
    frame: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      enableRemoteModule: true,

      // TODO: this should not be false.
      webSecurity: false
    }
  })

  // Create monitor window.
  monitorWin = new BrowserWindow({
    width: 1000,
    height: 900,
    minHeight: 600,
    minWidth: 500,
    parent: win,
    show: false,
    frame: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      enableRemoteModule: true,

      // TODO: this should not be false.
      webSecurity: false
    }
  })

  // Create monitor window.
  settingsWin = new BrowserWindow({
    width: 800,
    height: 600,
    minHeight: 600,
    minWidth: 500,
    parent: win,
    show: false,
    frame: false,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      enableRemoteModule: true,

      // TODO: this should not be false.
      webSecurity: false
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    monitorWin.loadURL(`${process.env.WEBPACK_DEV_SERVER_URL}/#/monitor`)
    settingsWin.loadURL(`${process.env.WEBPACK_DEV_SERVER_URL}/#/settings`)

    // if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
    monitorWin.loadURL('app://./index.html/#/monitor')
    settingsWin.loadURL('app://./index.html/#/settings')
  }

  win.on('closed', () => {
    win = null
  })

  monitorWin.on('close', (e) => {
    monitorWin.webContents.send('stop', true)
    e.preventDefault()
    monitorWin.hide()
  })

  settingsWin.on('close', (e) => {
    e.preventDefault()
    settingsWin.hide()
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

ipcMain.on('toggle-monitor', (event, arg) => {
  monitorWin.show()

  // if (!process.env.IS_TEST) monitorWin.openDevTools()

  monitorWin.webContents.send('init', arg)
})

ipcMain.on('toggle-settings', (event, arg) => {
  settingsWin.show()

  // if (!process.env.IS_TEST) settingsWin.openDevTools()
})
