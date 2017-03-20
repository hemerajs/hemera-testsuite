'use strict'

const Sinon = require('sinon')

class AddStub {
  static stub(hemera, pattern, error, args) {
    return Sinon.stub(hemera, 'add').withArgs(pattern).callsArgOnWith(1, hemera, error, args)
  }
}

module.exports = AddStub