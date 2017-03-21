'use strict'

const Sinon = require('sinon')

class AddStub {
  static stub(hemera, pattern, request, cb) {
    const payload = hemera.router.lookup(pattern)
    if(payload) {
      payload.action.call(hemera, request, cb)
      return payload
    }
    throw new Error('Pattern not found. Please check that you added your server method before you stub it.')
  }
}

module.exports = AddStub
