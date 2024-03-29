<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="900px"
  >
    <v-form @submit.prevent="submit">
      <v-card>
        <v-card-title style="border-bottom:1px solid #d85820">
          <span
            class="headline primary--text"
            v-text="`${header} Task`"
          />

          <v-spacer />

          <v-btn
            icon
            class="primary--text"
            @click="onCancel"
          >
            <v-icon v-text="'mdi-close'" />
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-container>
            <v-row>
              <v-col>
                <v-row>
                  <v-col>
                    <v-autocomplete
                      v-model="account"
                      required
                      :error-messages="accountErrors"
                      clearable
                      :items="accounts"
                      outlined
                      dense
                      label="Account"
                      item-text="name"
                      return-object
                      :disabled="isRunning"
                      hide-details="auto"
                      @blur="$v.account.$touch()"
                    />
                  </v-col>

                  <v-col>
                    <v-autocomplete
                      v-model="billing"
                      clearable
                      :items="billings"
                      outlined
                      dense
                      label="Billing"
                      item-text="name"
                      return-object
                      hide-details="auto"
                    />
                  </v-col>

                  <v-col>
                    <v-autocomplete
                      v-model="proxy"
                      required
                      :items="proxies"
                      outlined
                      dense
                      label="Proxy List"
                      item-text="name"
                      return-object
                      :error-messages="proxyErrors"
                      hide-details="auto"
                      @blur="$v.proxy.$touch()"
                    />
                  </v-col>
                </v-row>

                <v-row>
                  <v-col>
                    <v-select
                      v-model="mode"
                      required
                      dense
                      :items="modes"
                      return-object
                      item-text="label"
                      label="Mode"
                      outlined
                      hide-details="auto"
                    />
                  </v-col>

                  <v-col>
                    <v-select
                      v-model="checkoutMethod"
                      required
                      dense
                      :items="checkoutMethods"
                      return-object
                      item-text="label"
                      label="Checkout Method"
                      outlined
                      hide-details="auto"
                    />
                  </v-col>
                </v-row>

                <v-row>
                  <v-col>
                    <v-text-field
                      v-model="sku"
                      label="Product SKU"
                      required
                      outlined
                      dense
                      :error-messages="skuErrors"
                      autocomplete="off"
                      hide-details="auto"
                      @blur="$v.sku.$touch()"
                    />
                  </v-col>

                  <v-col>
                    <v-text-field
                      v-model="qty"
                      dense
                      outlined
                      type="number"
                      :error-messages="qtyErrors"
                      label="Quantity"
                      required
                      hide-details="auto"
                      @blur="$v.qty.$touch()"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-combobox
                      v-model="sizes"
                      chips
                      small-chips
                      deletable-chips
                      clearable
                      label="Size"
                      multiple
                      outlined
                      dense
                      append-icon=""
                      :error-messages="sizesErrors"
                      hint="Press Enter per input to apply"
                      hide-details="auto"
                      @blur="$v.sizes.$touch()"
                      @input="filterSizes"
                    />
                  </v-col>
                </v-row>
              </v-col>

              <v-divider vertical />

              <v-col cols="5">
                <v-row>
                  <v-col>
                    <v-text-field
                      v-model="delay"
                      dense
                      outlined
                      type="number"
                      :error-messages="delayErrors"
                      label="Retry Delay (ms)"
                      hide-details="auto"
                      @blur="$v.delay.$touch()"
                    />
                  </v-col>

                  <v-col>
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
                          outlined
                          readonly
                          v-bind="attrs"
                          clearable
                          label="Place Order"
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

                <v-list dense>
                  <v-list-item
                    class="pa-0"
                    dense
                  >
                    <v-list-item-content class="pa-2">
                      <v-list-item-title v-text="'Auto Pay'" />
                      <v-list-item-subtitle v-text="'Submit payment automatically'" />
                    </v-list-item-content>

                    <v-list-item-action>
                      <v-switch
                        v-model="autoPay"
                        inset
                      />
                    </v-list-item-action>
                  </v-list-item>

                  <v-list-item
                    class="pa-0"
                    dense
                  >
                    <v-list-item-content class="pa-2">
                      <v-list-item-title v-text="'Auto Fill'" />

                      <v-list-item-subtitle v-text="'Fill up billing details automatically'" />
                    </v-list-item-content>

                    <v-list-item-action>
                      <v-switch
                        v-model="autoFill"
                        inset
                      />
                    </v-list-item-action>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-container class="text-right">
            <v-btn
              rounded
              class="mr-3"
              depressed
              small
              outlined
              color="primary"
              @click="onCancel"
              v-text="'close'"
            />
            <v-btn
              color="primary"
              rounded
              type="submit"
              small
              depressed
              outlined
              v-text="'Save'"
            />
          </v-container>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { required, minValue } from 'vuelidate/lib/validators'

import Constant from '@/config/constant'
import ProxyDistribution from '@/mixins/proxy-distribution'

export default {
  mixins: [ProxyDistribution],
  data () {
    return {
      id: null,

      dialog: false,
      placeOrderMenu: false,

      autoPay: false,
      autoFill: true,

      sku: null,
      account: null,
      billing: null,
      placeOrder: null,

      sizes: [],
      delay: 3500,
      qty: 1,
      mode: Constant.CLIENT[0],
      checkoutMethod: Constant.METHODS[3],
      proxy: {}
    }
  },
  computed: {
    ...mapState('task', { tasks: 'items' }),
    ...mapState('account', { accounts: 'items' }),
    ...mapState('billing', { billings: 'items' }),
    ...mapState('proxy', { proxies: 'items' }),

    /**
     * Return all modes
     */
    modes () {
      return Constant.CLIENT
    },
    /**
     * Is task running
     */
    isRunning () {
      let data = false

      if (this.tasks.length && this.id) {
        const task = this.tasks.find((val) => val.id === this.id)
        data = (task && task.status.id === Constant.STATUS.RUNNING)
      }

      return data
    },
    /**
     * return available checkout methods
     */
    checkoutMethods () {
      return Constant.METHODS
    },
    /**
     * Set modal header.
     */
    header () {
      return this.id ? 'Edit' : 'New'
    },
    /**
     * Error messages for account.
     */
    accountErrors () {
      const errors = []

      if (!this.$v.account.$dirty) return errors

      this.$v.account.required || errors.push('Required')

      return errors
    },
    /**
     * Error messages for sku.
     */
    skuErrors () {
      const errors = []

      if (!this.$v.sku.$dirty) return errors

      this.$v.sku.required || errors.push('Required')

      return errors
    },
    /**
     * Error messages for sizes.
     */
    sizesErrors () {
      const errors = []

      if (!this.$v.sizes.$dirty) return errors

      this.$v.sizes.required || errors.push('Required')

      return errors
    },
    /**
     * Error messages for delay.
     */
    delayErrors () {
      const errors = []

      if (!this.$v.delay.$dirty) return errors

      this.$v.delay.minValue || errors.push('Invalid input')
      this.$v.delay.required || errors.push('Required')

      return errors
    },
    /**
     * Error messages for qty.
     */
    qtyErrors () {
      const errors = []

      if (!this.$v.qty.$dirty) return errors

      this.$v.qty.minValue || errors.push('Invalid input')
      this.$v.qty.required || errors.push('Required')

      return errors
    },
    /**
     * Error messages for proxy.
     */
    proxyErrors () {
      const errors = []

      if (!this.$v.proxy.$dirty) return errors

      this.$v.proxy.required || errors.push('Required')

      return errors
    }
  },
  watch: {
    autoPay () {
      if (this.autoPay) this.autoFill = false
    },
    autoFill () {
      if (this.autoFill) this.autoPay = false
    },
    dialog () {
      if (this.dialog && !this.id) {
        this.proxy = { ...this.proxies[0] }
      }
    }
  },
  methods: {
    ...mapActions('task', { addTask: 'addItem', updateTask: 'updateItem', setAllTasks: 'setItems' }),
    ...mapActions('snackbar', ['showSnackbar']),

    /**
     * On edit event
     */
    onEdit (id) {
      const item = { ...this.tasks.find((el) => el.id === id) }

      const sizes = item.sizes.slice().map((val) => val.label)

      this.id = id

      this.dialog = true
      this.placeOrderMenu = false

      this.autoPay = item.autoPay
      this.autoFill = item.autoFill

      this.sku = item.sku
      this.account = item.account
      this.billing = item.billing
      this.placeOrder = item.placeOrder
      this.sizes = sizes
      this.delay = item.delay
      this.qty = item.qty
      this.mode = item.mode
      this.checkoutMethod = item.checkoutMethod
      this.proxy = item.proxy || { ...this.proxies[0] }
    },
    /**
     * Filter input sizes.
     */
    filterSizes () {
      if (this.sizes.length) {
        const sizes = []

        this.sizes.forEach(element => {
          const attr = Constant.TITAN_ATTRIBUTES.find((val) => val.sizes.find((data) => data.label.toLowerCase() === element.toLowerCase()))

          if ((attr && !sizes.find((val) => val.toLowerCase() === element.toLowerCase())) || element.toLowerCase() === 'ra') sizes.push(element)
        })

        this.sizes = sizes
      }
    },
    /**
     * On cancel event.
     */
    onCancel () {
      this.$v.$reset()

      this.id = null

      this.dialog = false
      this.placeOrderMenu = false

      this.autoPay = false
      this.autoFill = true

      this.sku = null
      this.account = null
      this.billing = null
      this.placeOrder = null

      this.sizes = []
      this.delay = 3500
      this.qty = 1
      this.mode = Constant.CLIENT[0]
      this.checkoutMethod = Constant.METHODS[3]
      this.proxy = { ...this.proxies[0] }
    },
    /**
     * On submit event.
     */
    async submit () {
      this.$v.$touch()

      if (!this.$v.$invalid) {
        const sizes = []

        this.sizes.forEach((element) => {
          const attr = Constant.TITAN_ATTRIBUTES.find((val) => val.sizes.find((data) => data.label.toLowerCase() === element.toLowerCase()))

          if (attr) {
            const size = attr.sizes.find((data) => data.label.toLowerCase() === element.toLowerCase())

            sizes.push({
              attribute_id: attr.attribute_id,
              value: size.value,
              label: size.label
            })
          } else {
            sizes.push({
              attribute_id: null,
              value: null,
              label: 'RA'
            })
          }
        })

        const params = {
          sku: this.sku,
          account: { ...this.account },
          billing: this.billing ? { ...this.billing } : null,
          proxy: { ...this.proxy },
          placeOrder: this.placeOrder,

          sizes: sizes,
          delay: this.delay,
          qty: this.qty,
          mode: this.mode,
          checkoutMethod: this.checkoutMethod,

          autoPay: this.autoPay,
          autoFill: this.autoFill
        }

        const localhost = this.proxies.find((el) => el.id === 1)

        if (this.id) {
          const item = this.tasks.slice().find((el) => el.id === this.id)

          if (params.proxy.id !== item.proxy.id || params.mode.id !== item.mode.id) {
            const opt = { deviceCategory: 'desktop' }

            if (params.mode.id !== 1) opt.deviceCategory = 'mobile'

            const UserAgent = require('user-agents')
            let userAgent = new UserAgent(opt)
            userAgent = userAgent.toString()

            if (params.proxy.id) {
              params.proxy.configs = params.proxy.configs.map(el => {
                return {
                  ...el,
                  userAgent: userAgent,
                  retry: 1
                }
              })
            } else {
              const rp = require('request-promise')
              const jar = rp.jar()

              params.proxy.configs = [{
                rp: rp,
                jar: jar,
                userAgent: userAgent,
                retry: 1
              }]
            }
          }

          const updatedTask = await this.updateTask({
            ...params,
            id: this.id
          })

          const modifiedTasks = await this.setProxyConfigs(this.tasks, updatedTask, localhost)
          await this.setAllTasks(modifiedTasks)

          const proxy = this.proxies.find((val) => val.id === item.proxy.id)
          const oldProxyTasks = this.tasks.filter((val) => val.proxy.id === proxy.id)

          if (proxy && proxy.distribute && proxy.proxies && proxy.proxies.length && proxy.configs && proxy.configs.length && oldProxyTasks.length) {
            const modifiedOldTasks = await this.setOldProxyConfigs(this.tasks, oldProxyTasks, proxy, localhost)
            await this.setAllTasks(modifiedOldTasks)
          }

          this.showSnackbar({ message: 'Updated successfully', color: 'teal' })
        } else {
          const newTask = await this.addTask(params)

          const modifiedTasks = await this.setProxyConfigs(this.tasks, newTask, localhost)
          this.setAllTasks(modifiedTasks)

          this.showSnackbar({ message: 'Created successfully', color: 'teal' })
        }

        this.onCancel()
      }
    }
  },
  validations: {
    account: { required },
    proxy: { required },
    sku: { required },
    sizes: { required },
    delay: {
      required,
      minValue: minValue(0)
    },
    qty: {
      required,
      minValue: minValue(1)
    }
  }
}
</script>
