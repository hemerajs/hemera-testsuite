'use strict'

const Hemera = require('nats-hemera')
const Nats = require('../nats')
const Code = require('code')
const expect = Code.expect

describe('NATS Transport fake', function() {
  it('Should fake a request', function(done) {
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

  /**
   * The asterisk character (*) matches any token at any level of the subject.
   */
  it('Should fake wildcard subjects', function(done) {
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
  it('Should fake > (greater than) subjects', function(done) {
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

  it('Should fake a publish', function(done) {
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
      hemera.act(`topic:math,cmd:add,a:1,b:2,pubsub$:true`, () => {
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
        done()
      })
    })
  })
})
