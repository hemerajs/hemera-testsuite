'use strict'

const Hemera = require('nats-hemera')
const Code = require('code')
const Nats = require('nats')
const HemeraTestsuite = require('./../../')

const expect = Code.expect

describe('Start and connect to NATS Cluster', function() {
  this.timeout(10000)

  const WAIT = 20
  const ATTEMPTS = 4

  const PORT1 = 15621
  const PORT2 = 15622

  const s1Url = 'nats://localhost:' + PORT1
  const s2Url = 'nats://localhost:' + PORT2

  let s1
  let s2
  let hemera

  // Start up our own nats-server
  before(function(done) {
    s1 = HemeraTestsuite.start_server(PORT1, function() {
      s2 = HemeraTestsuite.start_server(PORT2, function() {
        const nats = Nats.connect({
          servers: [s1Url, s2Url]
        })
        hemera = new Hemera(nats)
        hemera.ready(x => done())
      })
    })
  })

  // Shutdown our server
  after(function(done) {
    HemeraTestsuite.stop_cluster([s1, s2], done)
  })

  it('Should be able to request/reply', function(done) {
    hemera.add(
      {
        topic: 'math',
        cmd: 'add'
      },
      (req, cb) => {
        cb(null, req.a + req.b)
      }
    )
    hemera.act(`topic:math,cmd:add,a:1,b:2`, (err, resp) => {
      expect(resp).to.be.equals(3)
      done()
    })
  })
})

describe('NATS Cluster dynamically', function() {
  this.timeout(10000)

  let servers

  // Shutdown our servers
  afterEach(function(done) {
    HemeraTestsuite.stop_cluster(servers, function() {
      servers = []
      done()
    })
  })

  it('Should add multiple members and request/reply with hemera', function(done) {
    const route_port = 54220
    const port = 54221
    // start a new cluster with single server
    servers = HemeraTestsuite.start_cluster([port], route_port, function() {
      expect(servers.length).to.be.equal(1)
      // connect the client
      const nats = Nats.connect({
        url: 'nats://127.0.0.1:' + port,
        reconnectTimeWait: 100
      })
      nats.on('connect', function() {
        // start adding servers
        process.nextTick(function() {
          const others = HemeraTestsuite.add_member_with_delay(
            [port + 1, port + 2],
            route_port,
            250,
            function() {
              // verify that 2 servers were added
              expect(others.length).to.be.equal(2)
            }
          )
          others.forEach(function(o) {
            // add them so they can be reaped
            servers.push(o)
          })
        })
      })
      const hemera = new Hemera(nats)
      hemera.ready(x => {
        hemera.add(
          {
            topic: 'math',
            cmd: 'add'
          },
          (req, cb) => {
            cb(null, req.a + req.b)
          }
        )
        hemera.act(`topic:math,cmd:add,a:1,b:2`, (err, resp) => {
          expect(resp).to.be.equals(3)
          hemera.close(done)
        })
      })
    })
  })
})
