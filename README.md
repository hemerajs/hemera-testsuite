[![npm](https://img.shields.io/npm/v/hemera-testsuite.svg?maxAge=3600)](https://github.com/hemerajs/hemera-testsuite)
[![Build Status](https://travis-ci.org/hemerajs/hemera-testsuite.svg?branch=master)](https://travis-ci.org/hemerajs/hemera-testsuite)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/hemerajs/hemera)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

# hemera-testsuite
Helper library to write tests against NATS.

## Use cases

- You want to create an integration test (cluster support)
- You want to run in-memory tests

## Prerequisites

[Install](https://nats.io/documentation/tutorials/gnatsd-install/) NATS Server and include the path to the executable in your user `PATH` environment variable. (Only needed for integration tests)

## Installing

```
npm i hemera-testsuite
```

## Emulate NATS
We emulate all features of NATS server. You can run and test your service in memory.

### Features

- Support of wildcard `*` and `>` subjects
- Support for auto-unsubscribe after `max` messages
- Support for request & publish
- Support for timeouts

### Not supported*

- Custom queue groups
- Special one-to-one publish
- Multiple Hemera instances

\**In this case we recommend to start a real NATS Server.*

```js
const Nats = require('hemera-testsuite/nats')
const nats = new Nats()
const hemera = new Hemera(nats, {
  logLevel: 'info'
})
```

## Full Integration test

- Run your tests against a real NATS server

[Example](https://github.com/hemerajs/hemera/blob/master/test/hemera/index.spec.js)

## Credits
Thanks to [node-nats](https://github.com/nats-io/node-nats) for providing the script to bootstrap the server.
