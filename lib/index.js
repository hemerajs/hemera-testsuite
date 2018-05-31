/* eslint-disable camelcase */

'use strict'

let spawn = require('child_process').spawn
let net = require('net')

let SERVER = process.env.TRAVIS ? 'gnatsd/gnatsd' : 'gnatsd'
let DEFAULT_PORT = 4222

function start_server(port, optFlags, done) {
  if (!port) {
    port = DEFAULT_PORT
  }
  if (typeof optFlags === 'function') {
    done = optFlags
    optFlags = null
  }
  let flags = ['-p', port, '-a', '127.0.0.1']

  if (optFlags) {
    flags = flags.concat(optFlags)
  }

  if (process.env.PRINT_LAUNCH_CMD) {
    console.log(flags.join(' '))
  }

  let server = spawn(SERVER, flags)

  let start = new Date()
  let wait = 0
  let maxWait = 5 * 1000 // 5 secs
  let delta = 250
  let socket
  let timer

  let resetSocket = () => {
    if (socket !== undefined) {
      socket.removeAllListeners()
      socket.destroy()
      socket = undefined
    }
  }

  let finish = err => {
    resetSocket()
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
    if (done) {
      done(err)
    }
  }

  // Test for when socket is bound.
  timer = setInterval(() => {
    resetSocket()

    wait = new Date() - start
    if (wait > maxWait) {
      finish(new Error("Can't connect to server on port: " + port))
    }

    // Try to connect to the correct port.
    socket = net.createConnection(port)

    // Success
    socket.on('connect', () => {
      if (server.pid === null) {
        // We connected but not to our server..
        finish(new Error('Server already running on port: ' + port))
      } else {
        finish()
      }
    })

    // Wait for next try..
    socket.on('error', error => {
      finish(
        new Error(
          'Problem connecting to server on port: ' + port + ' (' + error + ')'
        )
      )
    })
  }, delta)

  // Other way to catch another server running.
  server.on('exit', (code, signal) => {
    if (code === 1) {
      finish(
        new Error(
          'Server exited with bad code, already running? (' +
            code +
            ' / ' +
            signal +
            ')'
        )
      )
    }
  })

  // Server does not exist..
  server.stderr.on('data', data => {
    if (/^execvp\(\)/.test(data)) {
      clearInterval(timer)
      finish(new Error("Can't find the " + SERVER))
    }
  })

  return server
}

function waitStop(server, done) {
  if (server.killed) {
    if (done) {
      done()
    }
  } else {
    setTimeout(function() {
      waitStop(server, done)
    })
  }
}

function stop_server(server, done) {
  if (server) {
    server.kill()
    waitStop(server, done)
  } else if (done) {
    done()
  }
}

// starts a number of servers in a cluster at the specified ports.
// must call with at least one port.
function start_cluster(ports, routePort, optFlags, done) {
  if (typeof optFlags === 'function') {
    done = optFlags
    optFlags = null
  }
  let servers = []
  let started = 0
  let server = add_member(ports[0], routePort, routePort, optFlags, () => {
    started++
    servers.push(server)
    if (started === ports.length) {
      done()
    }
  })

  let others = ports.slice(1)
  others.forEach(function(p) {
    let s = add_member(p, routePort, p + 1000, optFlags, () => {
      started++
      servers.push(s)
      if (started === ports.length) {
        done()
      }
    })
  })
  return servers
}

// adds more cluster members, if more than one server is added additional
// servers are added after the specified delay.
function add_member_with_delay(ports, routePort, delay, optFlags, done) {
  if (typeof optFlags === 'function') {
    done = optFlags
    optFlags = null
  }
  let servers = []
  ports.forEach(function(p, i) {
    setTimeout(function() {
      let s = add_member(p, routePort, p + 1000, optFlags, () => {
        servers.push(s)
        if (servers.length === ports.length) {
          done()
        }
      })
    }, i * delay)
  })

  return servers
}

function add_member(port, routePort, clusterPort, optFlags, done) {
  if (typeof optFlags === 'function') {
    done = optFlags
    optFlags = null
  }
  optFlags = optFlags || []
  let opts = JSON.parse(JSON.stringify(optFlags))
  opts.push('--routes', 'nats://localhost:' + routePort)
  opts.push('--cluster', 'nats://localhost:' + clusterPort)

  return start_server(port, opts, done)
}

exports.stop_cluster = function(servers, done) {
  let count = servers.length
  function latch() {
    count--
    if (count === 0) {
      done()
    }
  }
  servers.forEach(s => {
    stop_server(s, latch)
  })
}

exports.find_server = (port, servers) => {
  return servers.find(s => {
    return s.spawnargs[2] === port
  })
}

exports.start_server = start_server
exports.stop_server = stop_server
exports.add_member_with_delay = add_member_with_delay
exports.start_cluster = start_cluster
exports.add_member = add_member

exports.startServer = start_server
exports.stopServer = stop_server
exports.addMemberWithDelay = add_member_with_delay
exports.startCluster = start_cluster
exports.addMember = add_member
