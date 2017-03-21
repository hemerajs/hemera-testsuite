'use strict'

const Sinon = require('sinon')
let stub = null

class ActStub {
  static stub(hemera, pattern, error, args) {
    if (!stub) {
      stub = Sinon.stub(hemera, 'act')
    }

    return stub.withArgs(pattern).callsFake(function (pattern, cb) {
      // respect act calls without a callback
      if(cb) {
        return cb.call(hemera, error, args)
      }
    })
  }
}

module.exports = ActStub
