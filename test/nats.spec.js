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

  it('Should request to one subscription', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    let callCount = 0
    hemera.ready(function() {
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        req => {
          callCount++
          return req.a + req.b
        }
      )
      hemera.add(
        {
          topic: 'math',
          cmd: 'add'
        },
        req => {
          callCount++
          return req.a + req.b
        }
      )
      hemera.act(`topic:math,cmd:add,a:1,b:2`, (err, resp) => {
        expect(resp).to.be.equals(3)
        expect(callCount).to.be.equals(1)
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
        req => {
          expect(nats.listeners('math').length).to.be.equal(0)
          return req.a + req.b
        }
      )

      expect(nats.listeners('math').length).to.be.equal(1)

      hemera
        .act(`topic:math,a:1,b:2`)
        .then(() => hemera.act(`topic:math,a:1,b:2`))
        .catch(err => {
          expect(err.message).to.be.equal('Timeout')
          done()
        })
    })
  })

  it('Should pass only count of expectedMessages$', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats, { timeout: 200 })
    let msgCount = 0
    hemera.ready(function() {
      hemera.add(
        {
          topic: 'math'
        },
        function(req) {
          this.reply(3)
          this.reply(3)
          this.reply(3)
          this.reply(3)
        }
      )

      hemera.act(
        {
          topic: 'math',
          expectedMessages$: 2
        },
        (err, resp) => {
          msgCount++
          expect(err).to.be.not.exists()
          expect(resp).to.be.equal(3)
          if (msgCount == 2) {
            done()
          }
        }
      )
    })
  })

  it('Should throw timeout when expectedMessages$ could not be fulfilled within the timeout', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats, { timeout: 100 })
    let msgCount = 0
    hemera.ready(function() {
      hemera.add(
        {
          topic: 'math'
        },
        function(req, reply) {
          this.reply(3)
        }
      )

      hemera.act(
        {
          topic: 'math',
          expectedMessages$: 2
        },
        (err, resp) => {
          msgCount++
          if (msgCount > 1) {
            expect(err).to.be.exists()
            expect(err.message).to.be.equal('Timeout')
            done()
          }
        }
      )
    })
  })

  it('Should auto unsubscribe after maxMessages$ messages defined on client-side', function(done) {
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
        function(err, resp) {
          expect(nats.listeners(this.sid).length).to.be.equal(0)
          done()
        }
      )
    })
  })

  it('Should publish one-to-many', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    hemera.ready(function() {
      const hemera2 = new Hemera(nats)
      let callCount = 0
      hemera.add(
        {
          topic: 'math',
          cmd: 'add',
          pubsub$: true
        },
        req => {
          callCount++
        }
      )
      hemera2.add(
        {
          topic: 'math',
          cmd: 'add',
          pubsub$: true
        },
        req => {
          callCount++
        }
      )
      hemera.act(`topic:math,cmd:add,a:1,b:2,pubsub$:true`).then(() => {
        expect(callCount).to.be.equal(2)
        done()
      })
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

  it('Should close hemera and nats', function(done) {
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
      hemera.close(done)
    })
  })

  it('Should unsubscribe all subscription on close', function(done) {
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

      expect(nats.listeners('math').length).to.be.equal(1)
      hemera.close(() => {
        expect(nats.listeners('math').length).to.be.equal(0)
        done()
      })
    })
  })

  it('Should unsubscribe', function(done) {
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
      expect(nats.listeners('math').length).to.be.equal(1)

      hemera.remove('math')

      expect(nats.listeners('math').length).to.be.equal(0)
      done()
    })
  })

  it('Should be ready even when nats connection was already established', function(done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)

    nats.on('connect', () => {
      hemera.ready(err => {
        expect(err).to.be.not.exists()
        done()
      })
    })
  })
})
