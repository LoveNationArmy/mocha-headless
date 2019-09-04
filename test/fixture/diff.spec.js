describe('diff', () => {
  it('should fail', () => {
    expect({
      foo: 'bar'
    }).to.equal({
      foo: 'bar',
      another: 'too'
    })
  })
})
