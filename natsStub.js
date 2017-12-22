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
  constructor() {
    super()
    this.subId = 0
    this.timeoutMap = new Map()
    setImmediate(() => {
      this.emit('connect')
    })
  }

  /**
   *
   *
   * @memberof NatsStub
   */
  close(handler) {
    setImmediate(() => handler())
  }

  /**
   *
   *
   * @memberof NatsStub
   */
  timeout(sid, timeout, delay, handler) {
    this.timeoutMap.set(sid, setTimeout(() => handler(), timeout).unref())
  }

  /**
   *
   *
   * @memberof NatsStub
   */
  publish(topic, payload, handler) {
    this.emit(topic, { payload })
    setImmediate(() => handler())
  }

  /**
   *
   *
   * @memberof NatsStub
   */
  request(topic, payload, opts, handler) {
    const replyTo = `topic_${this.subId++}`
    this.once(replyTo, event => {
      clearTimeout(this.timeoutMap.get(replyTo))
      setImmediate(() => handler(event.payload))
    })
    this.emit(topic, { payload, replyTo })
    return replyTo
  }

  /**
   *
   *
   * @memberof NatsStub
   */
  subscribe(topic, opts, handler) {
    this.on(topic, event => {
      setImmediate(() => handler(event.payload, event.replyTo))
    })
  }

  /**
   *
   *
   * @memberof NatsStub
   */
  unsubscribe(topic) {
    this.removeListener(topic)
  }

  /**
   *
   *
   * @param {any} cb
   * @memberof NatsStub
   */
  flush(cb) {
    if (typeof cb === 'function') {
      cb()
    }
  }
}

module.exports = NatsStub
