import Store from '@/store/index'
import Task from '@/services/task'
import Constant from '@/config/constant'
import Config from '@/config/app'

/**
 * ===============================================
 * Cloudflare Bypass service
 * ===============================================
 */
export default {
  /**
   * Is browser headless
   */
  isHeadless () {
    const settings = Store._modules.root._children.settings.context.state.items

    return settings.isHeadless
  },
  /**
   * Identify if proxy is running
   */
  isProxyRunning (id) {
    const Proxies = Store._modules.root._children.proxy.context

    let proxy = Proxies.state.items

    proxy = proxy.find((el) => el.id === id)

    if (!proxy) return false

    return proxy.status === Constant.STATUS.RUNNING
  },
  /**
   * Initialize bypassing
   */
  async bypass (options, id = null, service = null) {
    // Start queue
    try {
      if (id && service && service === 'TASK') {
        let isPassed = false

        let cfStorage = Store._modules.root._children.cloudflare.context

        cfStorage.dispatch('addToQueue', {
          id: id,
          cookies: []
        })

        let interval = null
        await new Promise((resolve) => {
          interval = setInterval(() => {
            if (!Task.isRunning(id)) {
              clearInterval(interval)
              resolve()
            }

            cfStorage = Store._modules.root._children.cloudflare.context
            const item = cfStorage.state.items.queue.find((el) => el.id === id)

            if (item) {
              if (item.cookies.length) {
                isPassed = true
                clearInterval(interval)
                resolve()
              } else {
                for (let index = 0; index < cfStorage.state.items.doors.length; index++) {
                  if (cfStorage.state.items.queue.length && cfStorage.state.items.queue[0].id === id && cfStorage.state.items.doors[index]) {
                    cfStorage.dispatch('removeToQueue')

                    const doors = cfStorage.state.items.doors.slice()
                    doors[index] = false
                    cfStorage.dispatch('setDoors', doors)

                    clearInterval(interval)
                    resolve()
                  }
                }
              }
            } else {
              clearInterval(interval)
              resolve()
            }
          }, 500)
        })
        clearInterval(interval)

        if (isPassed) {
          cfStorage = Store._modules.root._children.cloudflare.context
          const index = cfStorage.state.items.queue.findIndex((el) => el.id === id)
          cfStorage.dispatch('removeToQueue', index)

          return []
        }
      }
    } catch (error) {
      console.log(error)
      return []
    }

    // Start bypassing

    if (id && ((service === 'TASK' && !Task.isRunning(id)) || (!service && !this.isProxyRunning(id)))) return []

    const vanillaPuppeteer = require('puppeteer')
    const { addExtra } = require('puppeteer-extra')
    const StealthPlugin = require('puppeteer-extra-plugin-stealth')
    const ProxyChain = require('proxy-chain')
    let newProxyUrl = null

    const puppeteer = addExtra(vanillaPuppeteer)
    const stealth = StealthPlugin()
    puppeteer.use(stealth)

    const blockedResources = ['queue-it']

    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      `--user-agent=${options.headers['User-Agent']}`,
      '--window-size=560,638'
    ]

    let cookies = []

    if (options.proxy) {
      const oldProxyUrl = options.proxy

      newProxyUrl = await ProxyChain.anonymizeProxy(oldProxyUrl)

      args.push(`--proxy-server=${newProxyUrl}`)
    }

    const isHeadless = await this.isHeadless()

    const browser = await puppeteer.launch({
      args,
      executablePath: puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked'),
      headless: isHeadless
    })

    try {
      if (id && ((service === 'TASK' && !Task.isRunning(id)) || (!service && !this.isProxyRunning(id)))) {
        await browser.close()

        if (newProxyUrl) await ProxyChain.closeAnonymizedProxy(newProxyUrl, true)

        return []
      }

      const page = await browser.newPage()

      await page.setRequestInterception(true)

      page.on('request', async (request) => {
        if (id && ((service === 'TASK' && !Task.isRunning(id)) || (!service && !this.isProxyRunning(id)))) {
          await browser.close()

          if (newProxyUrl) await ProxyChain.closeAnonymizedProxy(newProxyUrl, true)

          return []
        }

        if (request.url().endsWith('.png') || request.url().endsWith('.jpg') || request.resourceType() === 'image') {
        // BLOCK IMAGES
          request.abort()
        } else if (blockedResources.some(resource => request.url().indexOf(resource) !== -1)) {
        // BLOCK CERTAIN DOMAINS
          request.abort()
        } else if (request.resourceType() === 'stylesheet' || request.resourceType() === 'font') {
          // BLOCK STYLES
          request.abort()
        } else {
        // ALLOW OTHER REQUESTS
          request.continue()
        }
      })

      if (id && ((service === 'TASK' && !Task.isRunning(id)) || (!service && !this.isProxyRunning(id)))) {
        await browser.close()

        if (newProxyUrl) await ProxyChain.closeAnonymizedProxy(newProxyUrl, true)

        return []
      }

      await page.goto(`${Config.services.titan22.url}/new-arrivals.html`)

      while (!cookies.length) {
        try {
          if (id && ((service === 'TASK' && !Task.isRunning(id)) || (!service && !this.isProxyRunning(id)))) {
            await browser.close()

            if (newProxyUrl) await ProxyChain.closeAnonymizedProxy(newProxyUrl, true)

            break
          }

          const content = await page.content()

          if (content && content.includes('cf-browser-verification')) {
            cookies = await this.cfChallenge(page, id, service)
            await browser.close()

            if (newProxyUrl) await ProxyChain.closeAnonymizedProxy(newProxyUrl, true)

            break
          } else if (content && content.includes('cf_captcha_kind')) {
            if (id && service && service === 'TASK') {
              await Task.setCurrentTaskStatus(id, { status: Constant.STATUS.RUNNING, msg: 'Waiting to solve captcha' })
            }

            await browser.close()
            cookies = await this.cfHcaptcha(args, id, service)

            if (newProxyUrl) await ProxyChain.closeAnonymizedProxy(newProxyUrl, true)

            break
          }

          await page.reload()
        } catch (error) {
          console.log(error)

          try {
            await browser.close()

            if (newProxyUrl) await ProxyChain.closeAnonymizedProxy(newProxyUrl, true)
          } catch (error) {
            console.log(error)
          }

          break
        }
      }

      if (id && ((service === 'TASK' && !Task.isRunning(id)) || (!service && !this.isProxyRunning(id)))) return []

      try {
        if (id && service && service === 'TASK') {
          const cfStorage = Store._modules.root._children.cloudflare.context
          const taskStorage = Store._modules.root._children.task.context

          let ids = taskStorage.state.items.filter((el) => el.proxy.id === Task.getCurrentTask(id).proxy.id)
          ids = ids.filter((el) => el.proxy.configs.find((val) => val.proxy === options.proxy))
          ids = ids.map((el) => el.id)

          const cfInQueue = cfStorage.state.items.queue.filter((el) => ids.includes(el.id))

          if (cfInQueue.length) {
            cfInQueue.forEach((val) => {
              val.cookies = cookies
              cfStorage.dispatch('updateToQueue', val)
            })
          }

          const doors = cfStorage.state.items.doors.slice()
          const key = doors.findIndex((el) => !el)
          doors[key] = true
          cfStorage.dispatch('setDoors', doors)
        }
      } catch (error) {
        console.log(error)
        return []
      }

      return cookies
    } catch (error) {
      console.log(error)

      try {
        await browser.close()

        if (newProxyUrl) await ProxyChain.closeAnonymizedProxy(newProxyUrl, true)
      } catch (error) {
        console.log(error)
      }

      return []
    }
  },

  /**
   * Bypass cloudflare challenge
   */
  async cfChallenge (page, id = null, service) {
    try {
      let response = []
      let content = await page.content()

      let counter = 0

      while (content.includes('cf-browser-verification')) {
        if (id && ((service === 'TASK' && !Task.isRunning(id)) || (!service && !this.isProxyRunning(id)))) break

        counter++

        if (counter > 3) break

        await page.waitForNavigation({
          timeout: 45000,
          waitUntil: 'domcontentloaded'
        })

        const cookies = await page.cookies()

        if (!cookies.find((el) => el.name === 'cf_clearance')) {
          content = await page.content()
          continue
        }

        response = cookies
        break
      }

      return response
    } catch (error) {
      console.log(error)
      return []
    }
  },

  /**
   * Bypass cloudflare Hcaptcha
   */
  async cfHcaptcha (args, id = null, service) {
    const vanillaPuppeteer = require('puppeteer')
    const { addExtra } = require('puppeteer-extra')
    const StealthPlugin = require('puppeteer-extra-plugin-stealth')

    const puppeteer = addExtra(vanillaPuppeteer)
    const stealth = StealthPlugin()
    puppeteer.use(stealth)

    const blockedResources = ['queue-it']

    let response = []

    const browser = await puppeteer.launch({
      args,
      executablePath: puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked'),
      headless: false
    })

    try {
      if (id && ((service === 'TASK' && !Task.isRunning(id)) || (!service && !this.isProxyRunning(id)))) {
        await browser.close()
        return []
      }

      const page = await browser.newPage()

      await page.setRequestInterception(true)

      page.on('request', async (request) => {
        if (id && ((service === 'TASK' && !Task.isRunning(id)) || (!service && !this.isProxyRunning(id)))) await browser.close()

        if (request.url().endsWith('.png') || request.url().endsWith('.jpg')) {
          // BLOCK IMAGES
          request.abort()
        } else if (blockedResources.some(resource => request.url().indexOf(resource) !== -1)) {
          // BLOCK CERTAIN DOMAINS
          request.abort()
        } else {
          // ALLOW OTHER REQUESTS
          request.continue()
        }
      })

      await page.goto(`${Config.services.titan22.url}/new-arrivals.html`)

      if (id) {
        const vm = this
        const loop = setInterval(async () => {
          if ((service === 'TASK' && !Task.isRunning(id)) || (!service && !vm.isProxyRunning(id))) {
            await browser.close()
            clearInterval(loop)
          }
        }, 1000)
      }

      let content = await page.content()

      while (content.includes('cf_captcha_kind')) {
        if (id && ((service === 'TASK' && !Task.isRunning(id)) || (!service && !this.isProxyRunning(id)))) break

        await page.waitForNavigation({
          timeout: 0,
          waitUntil: 'domcontentloaded'
        })

        if (id && ((service === 'TASK' && !Task.isRunning(id)) || (!service && !this.isProxyRunning(id)))) break

        const cookies = await page.cookies()

        if (!cookies.find((el) => el.name === 'cf_clearance')) {
          content = await page.content()
          continue
        }

        response = cookies
        break
      }

      await browser.close()

      return response
    } catch (error) {
      console.log(error)

      try {
        await browser.close()
      } catch (error) {
        console.log(error)
      }

      return []
    }
  }
}
