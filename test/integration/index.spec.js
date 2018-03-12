'use strict'

const Hemera = require('nats-hemera')
const Code = require('code')
const Nats = require('nats')
const HemeraTestsuite = require('./../../')

const expect = Code.expect

describe('Starting NATS Server', function() {
  let PORT = 6242
  let natsUrl = 'nats://localhost:' + PORT
  let server
  let hemera

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, () => {
      const nats = Nats.connect(natsUrl)
      hemera = new Hemera(nats)
      hemera.ready(x => done())
    })
  })

  after(function(done) {
    hemera.close()
    server.kill()
    done()
  })

  it('Should produce and consume', function(done) {
    hemera.add(
      {
        topic: 'math',
        cmd: 'add'
      },
      req => req.a + req.b
    )
    hemera.act(`topic:math,cmd:add,a:1,b:2`, (err, resp) => {
      expect(resp).to.be.equals(3)
      done()
    })
  })
})
