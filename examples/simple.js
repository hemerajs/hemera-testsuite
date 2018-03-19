const Hemera = require('nats-hemera')
const Nats = require('../nats')

const nats = new Nats()
const hemera = new Hemera(nats)

hemera.ready(function() {
  hemera.add(
    {
      topic: 'math',
      cmd: 'add'
    },
    function(req, cb) {
      cb(null, req.a + req.b)
    }
  )
  hemera.act(`topic:math,cmd:add,a:1,b:2`, (err, resp) => {
    console.log(err, resp)
  })
})
