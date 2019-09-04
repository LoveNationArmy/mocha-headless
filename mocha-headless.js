#!/usr/bin/env node

const fs = require('fs')
const read = fs.readFileSync
const write = fs.writeFileSync
const unlink = fs.unlinkSync
const stat = fs.statSync
const join = require('path').join
const http = require('http')
const glob = require('glob').sync
const extatic = require('extatic')
const MochaChrome = require('mocha-chrome')

// get filenames from arguments
let args = process.argv.slice(2)
let testFilenames
if (args.length <= 1) {
  let testGlob

  if (args.length === 0) { // no arguments = default test glob
    testGlob = 'test/**/*.js'
  } else if (args[0].includes('*')) { // argument is glob
    testGlob = args[0]
  } else if (stat(args[0]).isDirectory()) { // argument is dir, glob js files in that dir
    testGlob = join(args[0], '**/*.js')
  } else { // argument is specific file
    testGlob = args[0]
  }

  testFilenames = glob(testGlob, {
    ignore: '**/node_modules/**'
  })
} else { // arguments are filenames (usually from shell glob expansion)
  testFilenames = args
}

// generate html
const testScriptTags = testFilenames.map((testFilename) =>
  `<script type="module" src="./${testFilename}"></script>`
).join('\n')
const outHtml = read(`${__dirname}/test.html`, 'utf-8').replace('{test}', testScriptTags)
const outFilename = `${__dirname}/index.html`
write(outFilename, outHtml, 'utf-8')

// setup http server
const name = 'headless-test'
const host = `${name}.localhost`
const port = 7357 // TEST
const url = `http://${host}:${port}`

const staticRunnerHandler = extatic({
  root: __dirname,
  cors: true,
  showDir: false,
  autoIndex: true
})

const staticTestHandler = extatic({
  root: process.cwd(),
  cors: true,
  showDir: false
})

const server = http.createServer((req, res) => {
  staticRunnerHandler(req, res, () => {
    staticTestHandler(req, res)
  })
})

const serverListen = () => new Promise((resolve, reject) => {
  server.listen(port, host, resolve)
})

const serverClose = () => new Promise((resolve, reject) => {
  server.close(resolve)
})

// setup chrome headless
const client = new MochaChrome({ url })

const runTests = () => new Promise(async (resolve, reject) => {
  client.on('ended', resolve)
  client.on('failure', reject)
  await client.connect()
  client.run()
})

// run the tests
async function main() {
  await serverListen()
  try {
    await runTests()
  } catch (e) {
    console.error(e)
  }
  await serverClose()
  unlink(outFilename)
}

main()
