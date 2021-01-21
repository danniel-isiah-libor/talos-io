const http = require('http').createServer()
const io = require('socket.io')(http)

io.on('connection', (socket) => {
  const service = require('./service')
  const automate = require('./automate')

  // verify task
  socket.on('socket-verify', async (task) => {
    service.tasks.push(task)
    automate.verify(task, socket)
  })

  // start task
  socket.on('socket-start', async (task) => {
    service.tasks.push(task)
    automate.start(task, socket)
  })

  // stop task
  socket.on('socket-stop', async (task) => {
    await automate.stop(task)

    const item = service.tasks.find((el) => el.id === task.id)

    if (item) {
      const index = service.tasks.indexOf(item)
      service.tasks.splice(index, 1)
    }
  })

  // update task
  socket.on('socket-update', async (tasks) => {
    service.tasks = service.tasks.map(element => {
      const task = tasks.find((val) => val.id === element.id)

      if (task) {
        element = {
          ...task,
          transactionData: element.transactionData
        }
      }

      return element
    })
  })
})

const getPort = require('get-port')

const port = getPort({ port: getPort.makeRange(5000, 5100) });

(async () => {
  const availPort = await port

  http.listen(availPort, () => {
    console.log(`Server started on port ${availPort}`)
  })
})()

module.exports = port
