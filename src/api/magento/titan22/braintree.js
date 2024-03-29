import api from '../index'
import Config from '@/config/app'

const { http } = api

/**
 * ===================
 * Braintree API
 * ===================
 */
export default {
  baseUrl: `${Config.services.braintree.url}/merchants/nw7drdhqdjqh5x6n/client_api/v1`,
  http,

  /**
   * Get merchant secret
   */
  getSecret (params) {
    try {
      params.url = `${Config.services.titan22.url}/rest/V1/braintree/merchant_server`
      params.method = 'GET'

      return this.http(params)
        .then((res) => res)
        .catch((err) => {
          return { error: err }
        })
    } catch (error) {
      return { error: error }
    }
  },
  /**
   * Create paypal payment resource
   */
  createPaymentResource (params) {
    try {
      params.url = `${this.baseUrl}/paypal_hermes/create_payment_resource`
      params.method = 'POST'

      return this.http(params)
        .then((res) => res)
        .catch((err) => {
          return { error: err }
        })
    } catch (error) {
      return { error: error }
    }
  },
  /**
   * Get paypal account
   */
  getPaypalAccount (params) {
    try {
      params.url = `${this.baseUrl}/payment_methods/paypal_accounts`
      params.method = 'POST'

      return this.http(params)
        .then((res) => res)
        .catch((err) => {
          return { error: err }
        })
    } catch (error) {
      return { error: error }
    }
  }
}
