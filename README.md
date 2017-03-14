# hemera-testsuite
Helper library to write tests against NATS.

## Prerequisites

Include the `PATH` to the executable gnatsd.

## Installing

```
npm i hemera-testsuite
```

## Integration test

```js

describe('Basic', function () {

  const PORT = 6242
  const authUrl = 'nats://derek:foobar@localhost:' + PORT
  const noAuthUrl = 'nats://localhost:' + PORT
  let server

  // Start up our own nats-server
  before(function (done) {
    server = nsc.start_server(PORT, flags, done)
  })

  // Shutdown our server after we are done
  after(function () {
    server.kill()
  })

  it('Test', function(done) {

    const nats = require('nats').connect(authUrl)

    const hemera = new Hemera(nats)

    hemera.ready(() => {

    })

  })

})
```

## Unit test

We do not emulate the NATS messaging system we only stub the interface to don't run into an error.

```js
const Hemera = require('nats-hemera')
const NatsStub = require('hemera-testsuite/natsStub')
const Assert = require('assert')

const nats = new NatsStub()
const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.ready(function () {
  // Define server method
  hemera.add({
    topic: 'math',
    cmd: 'add'
  }, (req, cb) => {
    cb(null, req.a + req.b)
  })

  // get server method by pattern signature
  const payload = hemera.router.lookup({
    topic: 'math',
    cmd: 'add'
  })

  // pass arguments
  const request = {
    a: 1,
    b: 2
  }
  // call action  but beware the scope is not set
  payload.action(request, function (err, result) {
    Assert(!err, 'Should not return an error')
    Assert(result === 3, 'Should be 3')
  })
})

```

## Credits
Thanks to https://github.com/nats-io/node-nats for providing the script to bootstrap the server.