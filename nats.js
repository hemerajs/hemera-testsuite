'use strict'

const Eventemitter2 = require('eventemitter2').EventEmitter2

/**
 *
 *
 * @class NatsStub
 * @extends {EventEmitter}
 */
class NatsStub extends Eventemitter2 {
  /**
   * Creates an instance of NatsStub.
   * @memberof NatsStub
   */
  constructor() {
    super({ delimiter: '.', wildcard: true })
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
    // The greater than symbol (>), also known as the full wildcard, matches one or more tokens at the tail of a subject, and must be the last token.
    topic = topic.replace(/>/g, '**')
    this.many(topic, opts.max || Number.MAX_SAFE_INTEGER, event => {
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
