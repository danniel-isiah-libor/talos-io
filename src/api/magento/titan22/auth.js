import api from '../index'
import Config from '@/config/app'

const { http } = api

/**
 * ===================
 * Auth API
 * ===================
 */
export default {
  baseUrl: `${Config.services.titan22.url}/rest/default/V1`,
  url: 'integration/customer/token',
  http,

  /**
   * Get user token
   *
   * @param params
   * @return mixed
   */
  async fetchToken (params) {
    try {
      params.url = `${this.baseUrl}/${this.url}`
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
