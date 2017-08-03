'use strict'

const EventEmitter = require('events')

/**
 *
 *
 * @class NatsStub
 * @extends {EventEmitter}
 */
class NatsStub extends EventEmitter {
  /**
   * Creates an instance of NatsStub.
   * @memberof NatsStub
   */
  constructor () {
    super()
    setImmediate(() => {
      this.emit('connect')
    })
  }

  /**
   *
   *
   * @memberof NatsStub
   */
  close () { this.emit('mock.close', arguments) }

  /**
   *
   *
   * @memberof NatsStub
   */
  timeout () { this.emit('mock.timeout', arguments) }

  /**
   *
   *
   * @memberof NatsStub
   */
  publish () { this.emit('mock.publish', arguments) }

  /**
   *
   *
   * @memberof NatsStub
   */
  subscribe () { this.emit('mock.subscribe', arguments) }

  /**
   *
   *
   * @memberof NatsStub
   */
  unsubscribe () { this.emit('mock.unsubscribe', arguments) }

  /**
   *
   *
   * @memberof NatsStub
   */
  request () { this.emit('mock.request', arguments) }

  /**
   *
   *
   * @param {any} cb
   * @memberof NatsStub
   */
  flush (cb) {
    if (typeof cb === 'function') {
      cb()
    }
  }
}

module.exports = NatsStub
