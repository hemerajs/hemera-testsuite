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

## Test the implementation of a specific server method `hemera.add`
```js
const AddStub = require('hemera-testsuite/addStub')
AddStub.run(hemera, { topic: 'math', cmd: 'add' }, { a: 100, b: 200 }, function (err, result) {
  expect(err).to.be.not.exists()
  expect(result).to.be.equals(250)
})
```

## Mock the result of a service call `hemera.act`
```js
const ActStub = require('hemera-testsuite/actStub')
const as = new ActStub(hemera)
const stub1 = as.stub({ topic: 'math', cmd: 'sub', a: 100, b: 50 }, null, 50)
const stub2 = as.stubPartial({ topic: 'math', cmd: 'sub' }, null, 50)
stub1.restore() // Sinonjs api
stub2.restore()
```

## Mock the nats server in combination with addStub and actStub
We don't emulate the functionality of the NATS server. If you need it please run a real NATS server and stub some service calls.
```js
const Nats = require('hemera-testsuite/natsStub')
const ActStub = require('hemera-testsuite/actStub')
const AddStub = require('hemera-testsuite/addStub')

const nats = new Nats()
const hemera = new Hemera(nats, {
  logLevel: 'info'
})
const actStub = new ActStub(hemera)
```

## Full Integration test

- Run your tests against a real NATS server

[Example](https://github.com/hemerajs/hemera/blob/master/test/hemera/index.spec.js)

## Unit test

- Use act stubs to mock the result of a service call

[Example](https://github.com/hemerajs/hemera/blob/master/examples/testing/unittest.js)

## Credits
Thanks to [node-nats](https://github.com/nats-io/node-nats) for providing the script to bootstrap the server.
