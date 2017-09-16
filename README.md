[![npm](https://img.shields.io/npm/v/hemera-testsuite.svg?maxAge=3600)](https://github.com/hemerajs/hemera-testsuite)
[![Build Status](https://travis-ci.org/hemerajs/hemera-testsuite.svg?branch=master)](https://travis-ci.org/hemerajs/hemera-testsuite)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/hemerajs/hemera)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

# hemera-testsuite
Helper library to write tests against NATS.

## Use cases

- You want to create an integration test (cluster support)
- You want to run your system but have to mock some external services
- You want to test specific implementations without to start NATS

## Prerequisites

Include the `PATH` to the executable gnatsd.

## Installing

```
npm i hemera-testsuite
```

## Test the implementation of a specific server method
```js
AddStub.run(hemera, { topic: 'math', cmd: 'add' }, { a: 100, b: 200 }, function (err, result) {
  expect(err).to.be.not.exists()
  expect(result).to.be.equals(250)
})
```

## Mock the result of a service call
```js
const actStub = new ActStub(hemera)
actStub.stub({ topic: 'math', cmd: 'sub', a: 100, b: 50 }, null, 50)
```

## Integration test

- Real NATS Server is running but some act calls can be mocked.

```js
const Hemera = require('nats-hemera')
const HemeraTestsuite = require('hemera-testsuite')
const Code = require('code')
const expect = Code.expect

describe('Basic', function () {

  const PORT = 6242
  const noAuthUrl = 'nats://localhost:' + PORT
  let server

  // Start up our own nats-server
  before(function (done) {
    server = HemeraTestsuite.start_server(PORT, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Test', function(done) {

    const nats = require('nats').connect(noAuthUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {

      hemera.add({
        topic: 'math',
        cmd: 'add'
      }, function (resp, cb) {
        cb(null, resp.a + resp.b)
      })

      
      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
      }, (err, resp) => {
        expect(err).not.to.be.exists()
        expect(resp.result).to.be.equals(3)
        
        hemera.close()
        done()
      })

    })

  })

})
```

## Unit test

- We do not emulate the NATS messaging system we only stub the interface to don't run into an error.

Whats is stubbing?
> Test stubs are functions (spies) with pre-programmed behavior.

```js
'use strict'

/**
 * Run mocha ./examples/unittest.js
 */

const Hemera = require('nats-hemera')
const Nats = require('hemera-testsuite/natsStub')
const ActStub = require('hemera-testsuite/actStub')
const AddStub = require('hemera-testsuite/addStub')
const Code = require('code')
const expect = Code.expect

describe('Math', function () {
  it('Should do some math operations', function (done) {
    const nats = new Nats()
    const hemera = new Hemera(nats, {
      logLevel: 'info'
    })
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

      // stub act calls
      actStub.stub({ topic: 'math', cmd: 'sub', a: 100, b: 50 }, null, 50)
      actStub.stub({ topic: 'math', cmd: 'add' }, new Error('wrong arguments'))
      actStub.stub({ topic: 'math', cmd: 'add', a: 100, b: 200 }, null, 300)

      // Important run it when "add" was already added
      // Should execute the server method with the pattern topic:math,cmd:add,a:100,b:200"
      AddStub.run(hemera, { topic: 'math', cmd: 'add' }, { a: 100, b: 200 }, function (err, result) {
        expect(err).to.be.not.exists()
        expect(result).to.be.equals(250)
      })

      hemera.act({
        topic: 'math',
        cmd: 'add',
        a: 100,
        b: 200
      }, function(err, result) {
        expect(err).to.be.not.exists()
        expect(result).to.be.equals(300)
        done()
      })

    })
  })
})

```

## Credits
Thanks to [node-nats](https://github.com/nats-io/node-nats) for providing the script to bootstrap the server.
