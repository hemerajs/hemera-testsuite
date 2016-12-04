# hemera-testsuite
Helper library to write tests against NATS.

## Prerequisites

Include the `PATH` to the executable gnatsd.

## Installing

```
npm i hemera-testsuite
```

## Example

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

Thanks to https://github.com/nats-io/node-nats for providing the script.