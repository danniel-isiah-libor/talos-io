import { ipcRenderer } from 'electron'
import AuthService from '@/services/auth'

/**
 * =======================================
 * Route Guards
 * =======================================
 */
export default {
  /**
   * Route guard for protected endpoints.
   *
   * @param next
   * @return next
   */
  async authorized (next) {
    const now = new Date()

    if (!AuthService.isAuthenticated() || now >= (new Date(AuthService.getAuth().expiry))) {
      sessionStorage.clear()

      ipcRenderer.send('authenticate')
    } else {
      const params = {
        discord_id: AuthService.getAuth().profile.id,
        key: AuthService.getAuth().key
      }

      await AuthService.verify(params)
        .then((response) => {
          switch (response.status) {
            case 200:
              if (!response.data) {
                sessionStorage.clear()
                AuthService.flush()

                ipcRenderer.send('authenticate')
              }
              break

            default:
              sessionStorage.clear()
              AuthService.flush()

              ipcRenderer.send('authenticate')
              break
          }
        })
    }

    return next()
  }
}
