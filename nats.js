'use strict'

const Eventemitter2 = require('eventemitter2').EventEmitter2

/**
 *
 *
 * @class Nats
 * @extends {EventEmitter}
 */
class Nats extends Eventemitter2 {
  /**
   * Creates an instance of Nats.
   * @memberof Nats
   */
  constructor() {
    super({ delimiter: '.', wildcard: true })
    this.subId = 1
    this.inboxId = 1
    this.subscriptions = new Map()
    this.timeoutsMap = new Map()
    this.connected = false
    setImmediate(() => {
      this.connected = true
      this.emit('connect')
    })
  }

  /**
   * Close the NATS connection
   * We working in-memory no need to implement this.
   *
   * @param {any} handler
   * @memberof Nats
   */
  close(handler) {
    if (typeof handler === 'function') {
      setImmediate(() => handler())
    }
  }

  /**
   * Set a timeout on a subscription. The subscription is cancelled if the
   * expected number of messages is reached or the timeout is reached.
   *
   * @param {Mixed} sid
   * @param {Number} timeout
   * @param {Number} expected
   * @param {any} handler
   * @memberof Nats
   */
  timeout(sid, timeout, expected, handler) {
    this.timeoutsMap.set(sid, {
      timeout,
      expected,
      handler,
      timer: setTimeout(() => handler(), timeout).unref()
    })
  }

  /**
   * Publish a message to the given subject, with optional reply and callback.
   *
   * @param {String} topic
   * @param {String} payload
   * @param {Function} handler
   * @memberof Nats
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
   * Publish a message with an implicit inbox listener as the reply. Message is optional.
   * This should be treated as a subscription. You can optionally indicate how many
   * messages you only want to receive using opt_options = {max:N}. Otherwise you
   * will need to unsubscribe to stop the message stream.
   * The Subscriber Id is returned.
   *
   * @param {String} topic
   * @param {String} payload
   * @param {Object} opts
   * @param {Function} handler
   * @return {Mixed}
   * @memberof Nats
   */
  request(topic, payload, opts, handler) {
    const subData = {
      max: opts.max || 1,
      inbox: this.inboxId++
    }
    const replyTo = `topic_${subData.inbox}`

    if (subData.max === -1) {
      subData.max = Number.MAX_SAFE_INTEGER
    }

    if (this.listeners(replyTo).length === 0) {
      handler({
        code: 'REQ_TIMEOUT' // NATS CODE
      })
      return
    }


    // auto unsubscribe after max messages
    this.many(replyTo, subData.max, event => {
      // this only ensure that the first request was received within the timeout
      const timeout = this.timeoutsMap.get(replyTo)
      if (timeout) {
        clearTimeout(timeout.timer)
      }
      // fire handler
      setImmediate(() => handler(event.payload))
    })

    // start the request with inbox channel
    this.emit(topic, { payload, replyTo })

    return replyTo
  }

  /**
   *
   *
   * @param {any} topic
   * @param {any} opts
   * @param {any} handler
   * @memberof Nats
   */
  subscribe(topic, opts, handler) {
    // The greater than symbol (>), also known as the full wildcard, matches one or more tokens at the tail of a subject, and must be the last token.
    topic = topic.replace(/>/g, '**')
    let listener = event => {
      setImmediate(() => handler(event.payload, event.replyTo))
    }
    let sub = { id: this.subId++, options: opts, handler, topic, listener }
    this.subscriptions.set(sub.id, sub)

    this.many(sub.topic, sub.options.max || Number.MAX_SAFE_INTEGER, listener)

    return sub.id
  }

  /**
   * Unsubscribe to a given Subscriber Id, with optional max parameter.
   * Unsubscribing to a subscription that already yielded the specified number of messages
   * will clear any pending timeout callbacks.
   *
   * @param {Mixed} sid
   * @param {Number} opt_max
   * @memberof Nats
   */
  unsubscribe(topic, max) {
    if (typeof topic === 'string') {
      this.removeAllListeners(topic)
    } else {
      for (const s of this.subscriptions.values()) {
        if (s.id === topic) {
          this.removeListener(s.topic, s.listener)
          break
        }
      }
    }
  }

  /**
   * Flush all pending data to the server.
   * We working in-memory no need to implement this.
   *
   * @param {any} cb
   * @memberof Nats
   */
  flush(cb) {
    if (typeof cb === 'function') {
      cb()
    }
  }
}

module.exports = Nats
