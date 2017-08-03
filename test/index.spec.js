'use strict'

const Hemera = require('nats-hemera')
const Nats = require('../natsStub')
const ActStub = require('../actStub')
const AddStub = require('../addStub')
const Code = require('code')
const expect = Code.expect

process.setMaxListeners(0)

describe('Testsuite Stubing', function () {
  it('Should stub the add', function (done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    hemera.ready(function () {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (args, cb) {
        cb(null, args.a + args.b)
      })

      AddStub.run(hemera, { topic: 'math', cmd: 'add' }, { a: 100, b: 200 }, function (err, result) {
        expect(err).to.be.not.exists()
        expect(result).to.be.equals(300)
        hemera.close(done)
      })
    })
  })

  it('Should stub the add which returns an error', function (done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    hemera.ready(function () {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (args, cb) {
        cb(new Error('test'))
      })

      AddStub.run(hemera, { topic: 'math', cmd: 'add' }, { a: 100, b: 200 }, function (err, result) {
        expect(err).to.exists()
        expect(err.message).to.be.equals('test')
        hemera.close(done)
      })
    })
  })

  it('Should stub an act within a add method', function (done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    const actStub = new ActStub(hemera)
    hemera.ready(function () {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (args, cb) {
        this.act({ topic: 'math', cmd: 'sub', a: 100, b: 50 }, function (err, resp) {
          cb(err, args.a + args.b - resp)
        })
      })

      actStub.stub({ topic: 'math', cmd: 'sub', a: 100, b: 50 }, null, 50)

      AddStub.run(hemera, { topic: 'math', cmd: 'add' }, { a: 100, b: 200 }, function (err, result) {
        expect(err).to.be.not.exists()
        expect(result).to.be.equals(250)
        hemera.close(done)
      })
    })
  })

  it('Should stub an add method with middleware', function (done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    const actStub = new ActStub(hemera)
    hemera.ready(function () {
      hemera.add({
        topic: 'math',
        cmd: 'add'
      })
      .use((req, next) => {
        next()
      })
      .end(function (args, cb) {
        this.act({ topic: 'math', cmd: 'sub', a: 100, b: 50 }, function (err, resp) {
          cb(err, args.a + args.b - resp)
        })
      })

      actStub.stub({ topic: 'math', cmd: 'sub', a: 100, b: 50 }, null, 50)

      AddStub.run(hemera, { topic: 'math', cmd: 'add' }, { a: 100, b: 200 }, function (err, result) {
        expect(err).to.be.not.exists()
        expect(result).to.be.equals(250)
        hemera.close(done)
      })
    })
  })

  it('Should stub an act method', function (done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    const actStub = new ActStub(hemera)
    hemera.ready(function () {
      actStub.stub({ topic: 'math', cmd: 'add', a: 100, b: 200 }, null, 300)

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 100,
        b: 200
      }, function (err, result) {
        expect(err).to.be.not.exists()
        expect(result).to.be.equals(300)
        hemera.close(done)
      })
    })
  })

  it('Should stub an act without a callback method', function (done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    const actStub = new ActStub(hemera)
    hemera.ready(function () {
      actStub.stub({ topic: 'math', cmd: 'add', a: 100, b: 200 }, null, 300)

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 100,
        b: 200
      })

      hemera.close(done)
    })
  })

  it('Should stub an act which returns an error', function (done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    const actStub = new ActStub(hemera)
    hemera.ready(function () {
      actStub.stub({ topic: 'math', cmd: 'add', a: 100, b: 200 }, new Error('test'))

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 100,
        b: 200
      }, function (err, result) {
        expect(err).to.exists()
        expect(err.message).to.be.equals('test')
        hemera.close(done)
      })
    })
  })

  it('Should correctly stub an act with different args', function (done) {
    const nats = new Nats()
    const hemera = new Hemera(nats)
    const actStub = new ActStub(hemera)
    hemera.ready(function () {
      actStub.stub({ topic: 'math', cmd: 'add', a: 100, b: 200 }, null, 300)
      actStub.stub({ topic: 'math', cmd: 'add', a: 200, b: 200 }, null, 400)
      actStub.stub({ topic: 'math', cmd: 'add', a: 300, b: 200 }, null, 500)

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 300,
        b: 200
      }, function (err, result) {
        expect(err).to.be.not.exists()
        expect(result).to.be.equals(500)

        hemera.act({
          topic: 'math',
          cmd: 'add',
          a: 200,
          b: 200
        }, function (err, result) {
          expect(err).to.be.not.exists()
          expect(result).to.be.equals(400)
          hemera.act({
            topic: 'math',
            cmd: 'add',
            a: 100,
            b: 200
          }, function (err, result) {
            expect(err).to.be.not.exists()
            expect(result).to.be.equals(300)
            hemera.close(done)
          })
        })
      })
    })
  })
})
