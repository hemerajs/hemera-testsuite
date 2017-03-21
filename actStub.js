'use strict'

const Sinon = require('sinon')
let stub = null

class ActStub {
  static stub(hemera, pattern, error, args) {
    if (!stub) {
      stub = Sinon.stub(hemera, 'act')
    }

    return stub.withArgs(pattern).callsArgOnWith(1, hemera, error, args)
  }
}

module.exports = ActStub
