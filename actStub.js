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
    const self = this
    if (!this.s) {
      this.s = Sinon.stub(this.hemera, 'act')
    }

    self.hemera.router.add(pattern, {
      error: error,
      args: args
    })

    this.s.callsFake((p, cb) => {
      const lookup = this.hemera.router.lookup(p)
      if (lookup) {
        if (cb) {
          return cb.call(this.hemera, lookup.error, lookup.args)
        }
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
