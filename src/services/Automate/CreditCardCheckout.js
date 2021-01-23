import MainWindow from '@/windows/Main'

export default {
  /**
   * Initiate automation
   *
   * @param {*} arg
   */
  async automate (arg) {
    const puppeteer = require('puppeteer')
    const UserAgent = require('user-agents')
    const userAgent = new UserAgent({ deviceCategory: 'desktop' })

    const task = arg.task
    const settings = arg.settings

    const browser = await puppeteer.launch({
      headless: false,
      args: ['--window-size=800,600'],
      defaultViewport: null,
      executablePath: settings.executablePath || 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
    })

    const page = await browser.newPage()

    await page.setCookie({
      name: task.transactionData.cookie.key,
      value: task.transactionData.cookie.value,
      domain: `.${task.transactionData.cookie.domain}`
    })

    await page.setUserAgent(userAgent.toString())

    await page.goto('https://t.2c2p.com/RedirectV3/Payment/Accept')

    const array = [
      `<p><strong>Profile:</strong> ${task.profile.name}</p>`,
      `<p><strong>Product name:</strong> ${task.transactionData.product.name}</p>`,
      `<p><strong>Product SKU:</strong> ${task.transactionData.product.sku}</p>`,
      `<p><strong>Size:</strong> ${task.transactionData.product.size}</p>`,
      `<p><strong>Price:</strong> ${task.transactionData.product.price.toLocaleString()}</p>`
    ]

    await page.waitForSelector('.navbar-inner')

    await page.evaluate((array) => {
      array.forEach(element => {
        var div = document.getElementsByClassName('navbar-inner')[0]
        div.insertAdjacentHTML('beforeend', element)
      })
    }, array)

    if (task.bank && Object.keys(task.bank).length) {
      switch (task.bank.bank.toLowerCase()) {
        case 'gcash':
          try {
            if (settings.autoFill || settings.autoPay) {
              await page.waitForSelector('#btnGCashSubmit')
              await page.click('#btnGCashSubmit')

              await page.waitForNavigation()

              await page.waitForSelector('.layout-header')

              await page.evaluate((array) => {
                array.forEach(element => {
                  var div = document.getElementsByClassName('layout-header')[0]
                  div.insertAdjacentHTML('beforebegin', element)
                })
              }, array)

              await page.waitForSelector('input[type=number]')
              await page.type('input[type=number]', task.bank.cardNumber)
            }

            if (settings.autoPay) await page.click('.ap-button')
          } catch (error) {
            //
          }

          break

        default:
          try {
            if (settings.autoFill || settings.autoPay) {
              await page.waitForSelector('#credit_card_number')
              await page.type('#credit_card_number', task.bank.cardNumber)

              await page.waitForSelector('#credit_card_holder_name')
              await page.type('#credit_card_holder_name', task.bank.cardHolder)

              await page.waitForSelector('#credit_card_expiry_month')
              await page.type('#credit_card_expiry_month', task.bank.expiryMonth)

              await page.waitForSelector('#credit_card_expiry_year')
              await page.type('#credit_card_expiry_year', task.bank.expiryYear)

              await page.waitForSelector('#credit_card_cvv')
              await page.type('#credit_card_cvv', task.bank.cvv)

              await page.waitForSelector('#credit_card_issuing_bank_name')
              await page.type('#credit_card_issuing_bank_name', task.bank.bank)
            }

            if (settings.autoPay) {
              await page.waitForSelector('#btnCCSubmit')
              await page.click('#btnCCSubmit')
            }
          } catch (error) {
            //
          }
          break
      }
    }

    page.on('close', () => {
      MainWindow.getWindow().webContents.send('updateTask', task)
    })
  }
}
