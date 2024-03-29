import api from '../index'
import Config from '@/config/app'

const { http } = api

/**
 * ===================
 * Customer API
 * ===================
 */
export default {
  baseUrl: `${Config.services.titan22.url}/rest/default/V1`,
  url: 'customers',
  http,

  /**
   * Get user profile
   *
   * @param params
   * @return mixed
   */
  getProfile (params) {
    try {
      params.url = `${this.baseUrl}/${this.url}/me`
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
   * Update user profile
   *
   * @param params
   * @return mixed
   */
  updateProfile (params) {
    try {
      params.url = `${this.baseUrl}/${this.url}/me`
      params.method = 'PUT'

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
