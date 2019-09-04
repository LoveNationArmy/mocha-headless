const coffee = require('coffee')

process.chdir(__dirname + '/fixture')

const bin = '../../mocha-headless.js'

describe('headless cli', () => {
  it('no arguments = default test glob', (done) => {
    coffee.fork(bin)
    .expect('stdout', /2 passing/)
    .expect('code', 0)
    .end(done)
  })

  it('argument is glob', (done) => {
    coffee.fork(bin, ['**/*.spec.js'])
    .expect('stdout', /4 passing/)
    .expect('stdout', /1 failing/)
    .expect('code', 0)
    .end(done)
  })

  it('argument is directory', (done) => {
    coffee.fork(bin, ['imports'])
    .expect('stdout', /1 passing/)
    .expect('code', 0)
    .end(done)
  })

  it('argument is specific file', (done) => {
    coffee.fork(bin, ['assert.spec.js'])
    .expect('stdout', /1 passing/)
    .expect('code', 0)
    .end(done)
  })

  it('arguments are filenames', (done) => {
    coffee.fork(bin, ['assert.spec.js', 'imports/imports.spec.js', 'test/first.spec.js'])
    .expect('stdout', /3 passing/)
    .expect('code', 0)
    .end(done)
  })

  it('global assert', (done) => {
    coffee.fork(bin, ['assert.spec.js'])
    .expect('stdout', /1 passing/)
    .expect('code', 0)
    .end(done)
  })

  it('produces diff and reports error file and line', (done) => {
    coffee.fork(bin, ['diff.spec.js'])
    .expect('stdout', /0 passing/)
    .expect('stdout', /expected/)
    .expect('stdout', /actual/)
    .expect('stdout', /diff\.spec\.js:5:11/)
    .expect('code', 0)
    .end(done)
  })
})
