const express = require('express')

const router = express.Router()

/**
 * Place order
 */
router.post('/', async (req, res) => {
  let request = require('request')

  const option = {}

  if (req.body.proxy) option.proxy = `http://${req.body.proxy.username}:${req.body.proxy.password}@${req.body.proxy.host}:${req.body.proxy.port}`

  request = request.defaults(option)

  const jar = request.jar()

  const placeOrder = {
    uri: 'https://www.titan22.com/rest/V1/carts/mine/payment-information',
    body: JSON.stringify(req.body.payload),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${req.body.token}`
    },
    jar
  }

  await request(placeOrder, async function (error, response) {
    if (error || response.statusCode !== 200) res.status(response.statusCode).send({})

    const getTransactionData = {
      uri: 'https://www.titan22.com/ccpp/htmlredirect/gettransactiondata',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      jar
    }

    await request(getTransactionData, async function (error, response) {
      if (error || response.statusCode !== 200) res.status(response.statusCode).send({})

      const parameters = {}
      const fieldRecords = JSON.parse(response.body).fields
      const valueRecords = JSON.parse(response.body).values

      for (let index = 0; index < fieldRecords.length; index++) {
        parameters[fieldRecords[index]] = valueRecords[index]
      }

      const payment = {
        uri: 'https://t.2c2p.com/RedirectV3/Payment',
        form: parameters,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        jar
      }

      await request(payment, function (error, response) {
        if (error) res.status(500).send({})

        jar._jar.store.getAllCookies(function (err, cookieArray) {
          if (err) res.status(500).send({})

          const collection = cookieArray.find((val) => val.key === 'ASP.NET_SessionId')

          res.status(200).send({
            cookies: {
              name: 'ASP.NET_SessionId',
              value: collection.value,
              domain: '.2c2p.com',
              expiry: collection.expiry
            },
            data: parameters
          })
        })
      })
    })
  })
})

module.exports = router