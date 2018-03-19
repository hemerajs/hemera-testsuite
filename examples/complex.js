const Hemera = require('nats-hemera')
const Nats = require('../nats')

const nats = new Nats()
const hemera = new Hemera(nats)

hemera.ready(() => {
  hemera.add(
    {
      topic: 'math.add'
    },
    function(req, cb) {
      this.act({
        topic: 'math',
        cmd: 'sub',
        a: 100,
        b: 20
      })

      this.act(
        {
          topic: 'math.constants.pi'
        },
        function(err, resp) {
          if (err) {
            return
          }

          this.act(
            {
              topic: 'math',
              cmd: 'sub',
              a: 100,
              b: resp
            },
            function(err, resp) {
              if (err) {
                cb(err)
                return
              }
              cb(null, resp)
            }
          )
        }
      )
    }
  )

  hemera.add(
    {
      topic: 'math',
      cmd: 'sub'
    },
    function(req, cb) {
      cb(null, req.a - req.b)
    }
  )

  hemera.add(
    {
      topic: 'math.constants.*'
    },
    (req, cb) => {
      cb(null, Math.PI)
    }
  )

  hemera.act(
    {
      topic: 'math.add',
      a: 1,
      b: 20
    },
    function(err, resp) {
      console.log(err, resp)
    }
  )
})
