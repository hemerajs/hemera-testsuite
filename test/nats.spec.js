'use strict'

const Hemera = require('nats-hemera')
const Nats = require('../nats')
const Code = require('code')
const expect = Code.expect

describe('NATS Transport emulation', function() {
  it('Should request', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    hemera.ready(function() {
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

  it('Should request with multiple patterns', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    hemera.ready(function() {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          c: 3
        },
        req => {
          throw new Error('test')
        }
      )
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

  it('Should request multiple times', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    hemera.ready(function() {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        req => req.a + req.b
      )
      Promise.all([
        hemera.act(`topic:math,cmd:add,a:1,b:2`),
        hemera.act(`topic:math,cmd:add,a:10,b:20`)
      ]).then(result => {
        expect(result[0]).to.be.equals(3)
        expect(result[1]).to.be.equals(30)
        done()
      })
    })
  })

  it('Should use custom queue groups', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    hemera.ready(function() {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          queue$: 'test'
        },
        req => req.a + req.b
      )
      hemera.act(`topic:math,cmd:add,a:1,b:2`, (err, resp) => {
        expect(resp).to.be.equals(3)
        done()
      })
    })
  })

  /**
   * The asterisk character (*) matches any token at any level of the subject.
   */
  it('Should handle wildcard subjects', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    hemera.ready(function() {
      hemera.add(
        {
          topic: 'math.*'
        },
        req => req.a + req.b
      )
      hemera.act(`topic:math.test,cmd:add,a:1,b:2`, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        done()
      })
    })
  })

  /**
   * The greater than symbol (>), also known as the full wildcard,
   * matches one or more tokens at the tail of a subject, and must be the last token.
   * The wildcarded subject foo.> will match foo.bar or foo.bar.baz.1, but not foo.
   */
  it('Should handle > (greater than) subjects', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    hemera.ready(function() {
      hemera.add(
        {
          topic: 'math.>'
        },
        req => req.a + req.b
      )
      hemera.act(`topic:math.test.foo,cmd:add,a:1,b:2`, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(3)
        done()
      })
    })
  })

  it('Should auto unsubscribe after maxMessages$ messages', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats, { timeout: 200 })
    hemera.ready(function() {
      hemera.add(
        {
          topic: 'math',
          maxMessages$: 1
        },
        req => req.a + req.b
      )
      hemera
        .act(`topic:math,a:1,b:2`)
        .then(() => hemera.act(`topic:math,a:1,b:2`))
        .catch(err => {
          expect(err.message).to.be.equal('Timeout')
          done()
        })
    })
  })

  it('Should auto unsubscribe after maxMessages$ messages defined on client', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats, { timeout: 200 })
    let count = 0
    hemera.ready(function() {
      hemera.add(
        {
          topic: 'math'
        },
        (req, reply) => {
          for (let i = 0; i < 5; i++) {
            reply(null, i)
          }
        }
      )
      hemera.act(
        {
          topic: 'math',
          maxMessages$: 1
        },
        (err, resp) => {
          done()
        }
      )
    })
  })

  it('Should publish', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats, { logLevel: 'info' })
    hemera.ready(function() {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        req => {}
      )
      hemera.act(`topic:math,cmd:add,a:1,b:2,pubsub$:true`, (err, resp) => {
        expect(err).to.be.not.exists()
        expect(resp).to.be.not.exists()
        done()
      })
    })
  })

  it('Should publish multiple times', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats, { logLevel: 'info' })
    hemera.ready(function() {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        req => {}
      )
      Promise.all([
        hemera.act(`topic:math,cmd:add,a:1,b:2,pubsub$:true`),
        hemera.act(`topic:math,cmd:add,a:1,b:2,pubsub$:true`)
      ]).then(() => done())
    })
  })

  it('Should lead to timeout', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats, { timeout: 200 })
    hemera.ready(function() {
      hemera.act(`topic:math,cmd:add,a:1,b:2`, (err, resp) => {
        expect(err).to.be.exists()
        expect(err.message).to.be.equal('Timeout')
        done()
      })
    })
  })
})
