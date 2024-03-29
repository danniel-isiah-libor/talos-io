<template>
  <div>
    <v-row
      align="center"
      class="py-2 px-3"
      no-gutters
    >
      <v-col
        cols="2"
        align-self="center"
      >
        <h3
          class="cursor"
          v-text="'Accounts'"
        />
      </v-col>

      <v-col
        cols="10"
        align-self="center"
        class="text-right"
      >
        <v-btn
          rounded
          x-small
          color="primary"
          depressed
          outlined
          class="mr-3"
          @click="$refs.accountDialog.dialog = true"
        >
          <v-icon
            left
            small
            v-text="'mdi-plus'"
          />
          <span v-text="'create'" />
        </v-btn>

        <v-btn
          rounded
          x-small
          color="primary"
          depressed
          outlined
          class="mr-3"
          @click="importData"
        >
          <v-icon
            left
            small
            v-text="'mdi-download'"
          />
          <span v-text="'import'" />
        </v-btn>

        <v-btn
          rounded
          x-small
          color="primary"
          depressed
          outlined
          class="mr-3"
          @click="exportJson(accounts, 'Export Accounts To JSON')"
        >
          <v-icon
            left
            small
            v-text="'mdi-upload'"
          />
          <span v-text="'export'" />
        </v-btn>

        <v-btn
          rounded
          x-small
          color="paypalLogin"
          depressed
          outlined
          @click="paypalLogin"
        >
          <vue-fontawesome icon="paypal" />
          <span
            class="ml-2"
            v-text="'paypal'"
          />
        </v-btn>
      </v-col>
    </v-row>

    <AccountDialog ref="accountDialog" />
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { Cookie } from 'tough-cookie'

import File from '@/mixins/file'
import AccountDialog from '@/components/Profiles/AccountDialog.vue'

import BraintreeApi from '@/api/magento/titan22/braintree'
import CF from '@/services/cloudflare-bypass'
import Config from '@/config/app'

export default {
  components: {
    AccountDialog
  },
  mixins: [File],
  data () {
    return {
      loading: false
    }
  },
  computed: {
    ...mapState('account', { accounts: 'items' }),
    ...mapState('settings', { settings: 'items' })
  },
  methods: {
    ...mapActions('account', ['addItem', 'updateItem']),

    /**
     * Import all accounts
     */
    async importData () {
      const data = await this.importJson('Import Accounts')

      if (data && data.length) {
        for (let index = 0; index < data.length; index++) {
          delete data[index].id
          await this.addItem(data[index])
        }
      }
    },
    /**
     * Mass loging to PayPal
     */
    async paypalLogin () {
      if (this.loading) return false

      const accounts = this.accounts.filter((el) => !el.loading)

      if (!accounts.length) return false

      for (let index = 0; index < accounts.length; index++) {
        await this.updateItem({
          ...accounts[index],
          loading: true,
          paypal: {
            ...accounts[index].paypal,
            account: null
          }
        })
      }

      const collection = []

      let index = 0

      if (this.settings.accountProxyList.configs.length > 1) index = Math.floor(Math.random() * this.settings.accountProxyList.configs.length)

      const UserAgent = require('user-agents')
      const userAgent = new UserAgent()
      const rp = this.settings.accountProxyList.configs[index].rp
      const jar = this.settings.accountProxyList.configs[index].jar

      let params = {
        config: {
          rp: rp,
          jar: jar,
          userAgent: userAgent.toString()
        }
      }

      for (let index = 0; index < accounts.length; index++) {
        const secret = await this.getSecret(params)

        if (!secret || !secret.data) continue

        params = secret.params

        const fingerprint = JSON.parse(atob(JSON.parse(secret.data))).authorizationFingerprint

        const resource = await this.getResource(params, fingerprint)

        if (!resource) continue

        collection.push({
          fingerprint: fingerprint,
          redirectUrl: JSON.parse(resource).paymentResource.redirectUrl
        })
      }

      const auth = await this.authenticatePaypal(params, collection)

      for (let index = 0; index < accounts.length; index++) {
        const item = {
          ...accounts[index],
          loading: false
        }

        if (auth[index]) {
          item.paypal.account = auth[index]
          item.paypal.expires_in = this.$moment().add(150, 'minutes').toISOString()
        }

        this.updateItem(item)
      }
    },

    /**
     * Fetch site secret
     */
    async getSecret (params) {
      try {
        let data = null
        let tries = 0

        while (!data) {
          tries++

          if (tries > 3) break

          const response = await BraintreeApi.getSecret(params)

          if (response.error && (response.error.statusCode === 503 || response.error.statusCode === 403)) {
            const { options } = response.error
            const { jar } = options

            const cookies = await CF.bypass(options)

            if (cookies.length) {
              for (const cookie of cookies) {
                const { name, value, expires, domain, path } = cookie

                const expiresDate = new Date(expires * 1000)

                const val = new Cookie({
                  key: name,
                  value,
                  expires: expiresDate,
                  domain: domain.startsWith('.') ? domain.substring(1) : domain,
                  path
                }).toString()

                jar.setCookie(val, Config.services.titan22.url)
              }

              params.config.options = options
            }
          } else if (response.error) {
            data = null
          } else {
            data = response
          }
        }

        return {
          data: data,
          params: params
        }
      } catch (error) {
        console.log(error)
        return null
      }
    },
    /**
     * Fetch paypal resource
     */
    async getResource (params, fingerprint) {
      params.payload = {
        returnUrl: `http://localhost:${Config.services.port}/api/auth/paypal`,
        cancelUrl: `http://localhost:${Config.services.port}/api/auth/paypal`,
        offerPaypalCredit: false,
        amount: 1,
        currencyIsoCode: 'PHP',
        braintreeLibraryVersion: Config.services.braintree.version,
        authorizationFingerprint: fingerprint
      }

      const response = await BraintreeApi.createPaymentResource(params)

      if (!response || response.error) return null

      return response
    },
    /**
     * Authenticate user
     */
    async authenticatePaypal (params, collection) {
      const vanillaPuppeteer = require('puppeteer')
      const { addExtra } = require('puppeteer-extra')
      const StealthPlugin = require('puppeteer-extra-plugin-stealth')

      const puppeteer = addExtra(vanillaPuppeteer)
      const stealth = StealthPlugin()
      puppeteer.use(stealth)

      const data = []

      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          `--user-agent=${params.config.userAgent}`,
          '--window-size=560,638'
        ],
        executablePath: puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked'),
        headless: false
      })

      try {
        for (let index = 0; index < collection.length; index++) {
          const page = await browser.newPage()

          await page.goto(collection[index].redirectUrl)

          let url = await page.url()

          while (!url.includes(`localhost:${Config.services.port}`)) {
            await page.waitForNavigation({ timeout: 0 })

            url = await page.url()

            if (url.includes(`localhost:${Config.services.port}`)) {
              const domain = `http://localhost:${Config.services.port}/api/auth/paypal?`
              const queries = url.slice(domain.length).split('&')
              const params = {}

              queries.forEach(element => {
                const query = element.split('=')
                params[query[0]] = query[1]
              })

              data.push(params)
              break
            }
          }

          page.close()

          params.payload = {
            paypalAccount: {
              correlationId: data[index].token,
              paymentToken: data[index].paymentId,
              payerId: data[index].PayerID,
              unilateral: true,
              intent: 'authorize'
            },
            braintreeLibraryVersion: Config.services.braintree.version,
            authorizationFingerprint: collection[index].fingerprint
          }

          const response = await BraintreeApi.getPaypalAccount(params)

          if (response && !response.error) data[index] = JSON.parse(response)
        }

        browser.close()

        return data
      } catch (error) {
        console.log(error)

        try {
          browser.close()
        } catch (error) {
          console.log(error)
        }

        return []
      }
    }
  }
}
</script>

<style scoped>
.cursor {
  cursor: default
}
</style>
