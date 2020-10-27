<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="600px"
  >
    <v-form @submit.prevent="submit">
      <v-card>
        <v-card-title>
          <span
            class="headline"
            v-text="'Mass Edit'"
          />
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="sku"
                  label="SKU"
                  outlined
                  dense
                  hide-details
                  autocomplete="off"
                />
              </v-col>

              <v-col cols="12">
                <v-combobox
                  v-model="sizes"
                  chips
                  small-chips
                  deletable-chips
                  clearable
                  label="Sizes"
                  multiple
                  outlined
                  dense
                  append-icon=""
                  hint="Press Enter per input to apply"
                  hide-details="auto"
                  @input="filterSizes"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="delay"
                  dense
                  outlined
                  type="number"
                  hide-details="auto"
                  :error-messages="delayErrors"
                  label="Delays"
                  hint="Input value in milliseconds"
                  @blur="$v.delay.$touch()"
                />
              </v-col>

              <v-col cols="6">
                <v-menu
                  ref="placeOrderMenu"
                  v-model="placeOrderMenu"
                  :close-on-content-click="false"
                  :nudge-right="40"
                  :return-value.sync="placeOrder"
                  transition="scale-transition"
                  offset-y
                  max-width="350px"
                  min-width="350px"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      v-model="placeOrder"
                      dense
                      hide-details
                      outlined
                      readonly
                      v-bind="attrs"
                      style="width: 20vh"
                      clearable
                      label="Place Order At"
                      v-on="on"
                    />
                  </template>
                  <v-time-picker
                    v-if="placeOrderMenu"
                    v-model="placeOrder"
                    full-width
                    ampm-in-title
                    format="ampm"
                    use-seconds
                    color="primary"
                    @click:second="$refs.placeOrderMenu.save(placeOrder)"
                  />
                </v-menu>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn
            class="primary"
            rounded
            small
            @click="onCancel"
            v-text="'cancel'"
          />
          <v-btn
            class="primary"
            rounded
            type="submit"
            small
            v-text="'save'"
          />
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { minValue } from 'vuelidate/lib/validators'

export default {
  data () {
    return {
      dialog: false,
      sizes: [],
      sku: '',
      delay: 1000,
      placeOrder: '',
      placeOrderMenu: false
    }
  },
  computed: {
    ...mapState('attribute', { attributes: 'items' }),
    ...mapState('task', { tasks: 'items' }),
    /**
     * Error messages for delay.
     *
     */
    delayErrors () {
      const errors = []

      if (!this.$v.delay.$dirty) return errors

      this.$v.delay.minValue || errors.push('Invalid input')

      return errors
    }
  },
  methods: {
    ...mapActions('task', { updateTask: 'updateItem' }),

    /**
     * Filter input sizes.
     *
     */
    filterSizes () {
      if (this.sizes.length) {
        const sizes = []

        this.sizes.forEach(element => {
          const attr = this.attributes.find((val) => val.sizes.find((data) => data.label === element))

          if (attr) sizes.push(element)
        })

        this.sizes = sizes
      }
    },
    /**
     * On cancel event.
     *
     */
    onCancel () {
      this.sizes = []
      this.sku = ''
      this.dialog = false
      this.delay = 1000
      this.placeOrder = ''
      this.placeOrderMenu = false
    },

    /**
     * On submit event.
     *
     */
    submit () {
      this.tasks.forEach(element => {
        const params = element

        if (this.delay) params.delay = this.delay

        if (this.sku) params.sku = this.sku

        if (this.placeOrder) params.placeOrder = this.placeOrder

        if (this.sizes.length) {
          const sizes = []

          this.sizes.forEach(element => {
            const attr = this.attributes.find((val) => val.sizes.find((data) => data.label === element))

            const size = attr.sizes.find((data) => data.label === element)

            sizes.push({
              attribute_id: attr.attribute_id,
              value: size.value,
              label: size.label
            })
          })

          params.sizes = sizes
        }

        this.updateTask(params)
      })

      this.onCancel()
    }
  },
  validations: {
    delay: { minValue: minValue(0) }
  }
}
</script>