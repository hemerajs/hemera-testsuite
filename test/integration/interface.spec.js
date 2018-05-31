'use strict'

const Code = require('code')
const HemeraTestsuite = require('./../../')

const expect = Code.expect

describe('Interface', function() {
  it('Should provide all methods', function() {
    expect(HemeraTestsuite.start_server).to.be.function()
    expect(HemeraTestsuite.stop_server).to.be.function()
    expect(HemeraTestsuite.add_member_with_delay).to.be.function()
    expect(HemeraTestsuite.start_cluster).to.be.function()
    expect(HemeraTestsuite.add_member).to.be.function()
  })

  it('Should provide all methods inn camelCase', function() {
    expect(HemeraTestsuite.startServer).to.be.function()
    expect(HemeraTestsuite.stopServer).to.be.function()
    expect(HemeraTestsuite.addMemberWithDelay).to.be.function()
    expect(HemeraTestsuite.startCluster).to.be.function()
    expect(HemeraTestsuite.addMember).to.be.function()
  })
})
