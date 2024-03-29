<template>
  <v-app-bar
    app
    dense
    class="titleBar"
  >
    <v-row no-gutters>
      <v-col
        cols="1"
        class="titleBar"
        align-self="center"
      >
        <div class="d-flex align-center">
          <v-img
            v-if="!updating"
            class="shrink mr-2"
            contain
            :src="require('@/assets/talos.png')"
            transition="scale-transition"
            width="35"
          />

          <v-progress-circular
            v-else
            :rotate="-90"
            :size="40"
            :width="3"
            :value="progress"
            color="primary"
          >
            <span class="caption">{{ progress }}%</span>
          </v-progress-circular>
        </div>
      </v-col>

      <v-col align-self="center">
        <v-tabs
          :value="tab"
          background-color="transparent"
          grow
          slider-color="primary"
          centered
          @change="setCurrentTab"
        >
          <v-tab
            v-for="item in items"
            :key="item"
          >
            {{ item }}
          </v-tab>
        </v-tabs>
      </v-col>

      <v-col cols="1">
        <v-row
          no-gutters
          class="text-right mt-1"
          justify="center"
          align="center"
        >
          <v-col align-self="center">
            <v-btn
              icon
              x-small
              :ripple="false"
              class="mr-1"
              @click="onMaximize"
            >
              <v-icon
                small
                color="success"
                v-text="'mdi-checkbox-blank-circle'"
              />
            </v-btn>

            <v-btn
              icon
              x-small
              :ripple="false"
              class="mr-1"
              @click="onMinimize"
            >
              <v-icon
                small
                color="warning"
                v-text="'mdi-checkbox-blank-circle'"
              />
            </v-btn>

            <v-btn
              icon
              x-small
              :ripple="false"
              @click="onClose"
            >
              <v-icon
                small
                color="error"
                v-text="'mdi-checkbox-blank-circle'"
              />
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-app-bar>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { remote, ipcRenderer } from 'electron'

const isDevelopment = process.env.NODE_ENV !== 'production'

export default {
  props: {
    items: {
      type: Array,
      required: true
    }
  },
  data () {
    return {
      updating: false,
      progress: 0,
      updateCheck: null
    }
  },
  computed: {
    ...mapState('core', ['tab'])
  },
  created () {
    // progress app update
    ipcRenderer.on('newUpdate', (event, arg) => {
      this.updating = true
      this.progress = 0
      clearInterval(this.updateCheck)
      this.showSnackbar({ message: 'New update found!', color: 'warning' })
    })

    // no app update
    ipcRenderer.on('noUpdate', (event, arg) => {
      this.updating = false
      this.progress = 0
    })

    // error app update
    ipcRenderer.on('errorUpdate', (event, arg) => {
      this.updating = false
      this.progress = 0
    })

    // progress app update
    ipcRenderer.on('progressUpdate', (event, arg) => {
      this.updating = true
      this.progress = arg
    })

    // done app update
    ipcRenderer.on('doneUpdate', (event, arg) => {
      this.updating = false
      this.progress = 0

      this.openDialog({
        title: `Version ${arg}`,
        body: 'A new version has been downloaded.\nRestart the application to apply the updates.',
        actionLabel: 'Restart',
        cancelLabel: 'Later',
        action: () => { ipcRenderer.send('quit-install') }
      })
    })

    // Check update every minute
    if (!isDevelopment) {
      this.updateCheck = setInterval(async () => {
        ipcRenderer.send('check-update')
      }, 60000)
    }
  },
  methods: {
    ...mapActions('core', ['setCurrentTab']),
    ...mapActions('dialog', ['openDialog']),
    ...mapActions('snackbar', ['showSnackbar']),

    onClose () {
      remote.getCurrentWindow().close()
    },
    onMaximize () {
      const win = remote.getCurrentWindow()

      if (!win.isMaximized()) {
        win.maximize()
      } else {
        win.unmaximize()
      }
    },
    onMinimize () {
      remote.getCurrentWindow().minimize()
    }
  }
}
</script>
