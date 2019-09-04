import lib from './some-lib.js'

describe('imports', () => {
  it('should succeed', () => {
    expect(lib).to.equal('import fixture')
  })
})
