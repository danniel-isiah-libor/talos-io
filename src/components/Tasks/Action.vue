<template>
  <div>
    <v-btn
      v-if="item.status.id === 1"
      icon
      color="success"
      depressed
      :loading="item.loading"
      @click="$emit('click:start', item)"
    >
      <v-icon
        small
        v-text="'mdi-play'"
      />
    </v-btn>

    <v-btn
      v-else
      icon
      color="error"
      depressed
      @click="$emit('click:stop', item)"
    >
      <v-icon v-text="'mdi-stop'" />
    </v-btn>

    <v-btn
      icon
      color="warning"
      depressed
      :disabled="item.loading"
      @click="$refs.taskDialog.onEdit(item.id)"
    >
      <v-icon
        small
        v-text="'mdi-pencil'"
      />
    </v-btn>

    <v-btn
      icon
      color="red"
      depressed
      :disabled="item.loading"
      @click="$emit('click:delete', item)"
    >
      <v-icon
        small
        v-text="'mdi-delete'"
      />
    </v-btn>

    <v-menu offset-y>
      <template v-slot:activator="{ attrs, on }">
        <v-btn
          color="secondary"
          v-bind="attrs"
          icon
          depressed
          :disabled="item.loading"
          v-on="on"
        >
          <v-icon
            small
            v-text="'mdi-dots-vertical'"
          />
        </v-btn>
      </template>

      <v-list
        nav
        dense
        rounded
        class="text-center"
      >
        <v-list-item
          link
          @click="$emit('click:init', item)"
        >
          <v-list-item-title v-text="'Initialize'" />
        </v-list-item>

        <v-list-item
          link
          @click="duplicate(item)"
        >
          <v-list-item-title v-text="'Duplicate'" />
        </v-list-item>

        <v-list-item
          link
          @click="$refs.logsDialog.launch(item.id)"
        >
          <v-list-item-title v-text="'Logs'" />
        </v-list-item>
      </v-list>
    </v-menu>

    <TaskDialog ref="taskDialog" />
    <LogsDialog ref="logsDialog" />
  </div>
</template>

<script>
import { mapActions } from 'vuex'

import TaskDialog from '@/components/Tasks/TaskDialog.vue'
import LogsDialog from '@/components/Tasks/LogsDialog.vue'

export default {
  components: {
    TaskDialog,
    LogsDialog
  },
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      //
    }
  },
  methods: {
    ...mapActions('task', ['addItem']),

    duplicate (item) {
      const data = { ...item }

      delete data.id

      this.addItem(data)
    }
  }
}
</script>
