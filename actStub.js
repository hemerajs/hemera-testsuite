'use strict'

const Sinon = require('sinon')

class ActStub {
  static stub(hemera, pattern, error, args) {
    return Sinon.stub(hemera, 'act').withArgs(pattern).callsArgOnWith(1, hemera, error, args)
  }
}

module.exports = ActStub