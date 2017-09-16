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
const a = require('hemera-testsuite/addStub')
as.run(hemera, { topic: 'math', cmd: 'add' }, { a: 100, b: 200 }, function (err, result) {
  expect(err).to.be.not.exists()
  expect(result).to.be.equals(250)
})
```

## Mock the result of a service call `hemera.act`
```js
const ActStub = require('hemera-testsuite/actStub')
const a = new ActStub(hemera)
const stub1 = as.stub({ topic: 'math', cmd: 'sub', a: 100, b: 50 }, null, 50)
const stub2 = as.stubPartial({ topic: 'math', cmd: 'sub' }, null, 50)
stub1.restore() // Sinonjs api
stub2.restore()
```

## Integration test

- Real NATS Server is running but some act calls can be mocked.

[Example](https://github.com/hemerajs/hemera/blob/master/test/hemera/index.spec.js)

## Unit test

- We do not emulate the NATS messaging system we only stub the interface to don't run into an error.

[Example](https://github.com/hemerajs/hemera/blob/master/examples/testing/unittest.js)

```

## Credits
Thanks to [node-nats](https://github.com/nats-io/node-nats) for providing the script to bootstrap the server.
