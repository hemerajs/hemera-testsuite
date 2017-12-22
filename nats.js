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
    this.subs = new Map()
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
    this.timeoutMap.set(sid, {
      timeout,
      delay,
      handler,
      timer: setTimeout(() => handler(), timeout).unref()
    })
  }

  /**
   *
   *
   * @memberof NatsStub
   */
  publish(topic, payload, handler) {
    this.emit(topic, { payload })
    setImmediate(() => {
      if (handler) {
        handler()
      }
    })
  }

  /**
   *
   *
   * @memberof NatsStub
   */
  request(topic, payload, opts, handler) {
    const subData = { max: opts.max || 1, id: this.subId++ }
    const replyTo = `topic_${subData.id++}`
    this.subs.set(replyTo, subData)

    this.many(replyTo, subData.max, event => {
      const sub = this.subs.get(replyTo)
      const timeout = this.timeoutMap.get(replyTo)
      sub.max -= 1
      clearTimeout(timeout.timer)
      if (sub.max > 0) {
        this.timeout(replyTo, timeout.timeout, timeout.delay, timeout.handler)
      }
      handler(event.payload)
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
