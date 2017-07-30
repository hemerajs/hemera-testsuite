'use strict'

const Sinon = require('sinon')

/**
 *
 *
 * @class ActStub
 */
class ActStub {
  /**
   * Creates an instance of ActStub.
   *
   * @memberOf ActStub
   */
  constructor (hemera) {
    this.s = null
    this.hemera = hemera
  }

  /**
   *
   *
   * @param {any} pattern
   * @param {any} error
   * @param {any} args
   * @returns
   *
   * @memberOf ActStub
   */
  stub (pattern, error, args) {
    if (!this.s) {
      this.s = Sinon.stub(this.hemera, 'act')
    }
    this.s.withArgs(pattern).callsFake((pattern, cb) => {
      // respect act calls without a callback
      if (cb) {
        return cb.call(this.hemera, error, args)
      }
    })

    this.s.callThrough()

    return this.s
  }

  /**
   *
   *
   *
   * @memberOf ActStub
   */
  restore () {
    if (this.s) {
      this.s.restore()
    }
  }
}

module.exports = ActStub
