#!/usr/bin/env node

const fs = require('fs')
const read = fs.readFileSync
const write = fs.writeFileSync
const unlink = fs.unlinkSync
const stat = fs.statSync
const join = require('path').join
const glob = require('glob').sync
const https = require('https')
const live = require('live-server')
const keys = require('live-server-https')
const extatic = require('extatic')
const coverage = require('istanbul-middleware')
const FileWriter = require('istanbul-lib-report/lib/file-writer')
const istanbulLibReport = require('istanbul-lib-report')
const istanbulLibCoverage = require('istanbul-lib-coverage')
const TextReport = require('istanbul-reports/lib/text')
const MochaChrome = require('mocha-chrome')

let env = { WATCH: false }
try {
  const parse = s => { try { return JSON.parse(s) } catch { return s } }
  env = Object.fromEntries(read(join(process.cwd(), '.env'), 'utf-8')
    .split(/\r\n|\n/g).filter(Boolean)
    .map(line => line.split('='))
    .map(([key, ...value]) => [key, parse(process.env[key] ?? value.join('='))]))
} catch {}

let enableCoverage = false
let withErrors = true
let fullTrace = false

// get filenames from arguments
let args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
usage: mocha-headless [path] [options]

options:
  --coverage  Run coverage (slow)
  --quiet     More quiet (ignore exceptions)
  --watch     Watch files and repeat tests on save
  --trace     Enable full stack traces
`)
  return process.exit(0)
}
if (args.includes('--coverage')) {
  enableCoverage = true
  args.splice(args.indexOf('--coverage'), 1)
}
if (args.includes('--quiet')) {
  withErrors = false
  args.splice(args.indexOf('--quiet'), 1)
}
if (args.includes('--keep-alive')) {
  console.log('--keep-alive is DEPRECATED!!! use: --watch')
  env.WATCH = true
  args.splice(args.indexOf('--keep-alive'), 1)
}
if (args.includes('--watch')) {
  env.WATCH = true
  args.splice(args.indexOf('--watch'), 1)
}
if (args.includes('--trace')) {
  fullTrace = true
  args.splice(args.indexOf('--trace'), 1)
}
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
const outHtml = read(`${__dirname}/test-page.html`, 'utf-8')
  .replace('{test}', testScriptTags)
  .replace('{env}', JSON.stringify(env, null, 2))
const outFilename = `${__dirname}/test.html`
write(outFilename, outHtml, 'utf-8')

// setup http server
const name = 'headless-test'
const host = `${name}.localhost`
const port = 7357 // TEST
const url = `https://${host}:${port}/test.html`

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

let coverageOutput, coverageHandler

if (enableCoverage) {
  coverage.hookLoader(process.cwd(), { esModules: true })
  coverageHandler = coverage.createClientHandler(process.cwd(), {
    matcher: req => (
      !req.url.includes('mocha.') &&
      !req.url.includes('chai.js') &&
      !(stat(join(process.cwd(), req.url)).isDirectory())
    )
  })
}

let server

if (!env.WATCH) {
  server = https.createServer(keys, (req, res) => {
    if (req.url === '/coverage') {
      let data = ''
      req.setEncoding('utf8')
      req.on('data', d => data += d)
      req.on('end', () => {
        const coverageData = JSON.parse(data)
        FileWriter.startCapture()
        const context = istanbulLibReport.createContext({
          dir: process.cwd(),
          coverageMap: istanbulLibCoverage.createCoverageMap(coverageData)
        })
        const tree = context.getTree('pkg')
        const report = new TextReport()
        tree.visit(report, context)
        coverageOutput = FileWriter.getOutput()
        FileWriter.stopCapture()
      })
      return
    }
    if (enableCoverage) {
      coverageHandler(req, res, () => {
        staticRunnerHandler(req, res, () => {
          staticTestHandler(req, res)
        })
      })
    } else {
      staticRunnerHandler(req, res, () => {
        staticTestHandler(req, res)
      })
    }
  })
} else {
  let _server
  server = {
    listen (port, host, resolve) {
      _server = live.start({
        https: keys,
        port,
        host,
        open: false,
        file: __dirname + '/test.html',
        root: __dirname,
        mount: [['/', process.cwd()]],
        watch: [process.cwd() + '/**/*.{js,wasm}'],
      })
      _server.once('listening', resolve)
      return _server
    },
    on () {},
    close (resolve) {
      _server.close(resolve)
    }
  }
}

const serverListen = () => new Promise((resolve) => {
  server.listen(port, host, resolve)
  server.on('error', () => {})
})

const serverClose = () => new Promise((resolve) => {
  server.close(resolve)
})

// setup chrome headless
const client = new MochaChrome({
  url,
  ignoreExceptions: !withErrors,
  ignoreResourceErrors: !withErrors,
  mocha: { fullTrace, color: true },
  chromeFlags: [
    '--ignore-certificate-errors',
    '--allow-insecure-localhost',
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
  ]
})

const runTests = () => new Promise(async (resolve, reject) => {
  client.on('ended', resolve)
  client.on('failure', reject)
  await client.connect()
  client.run()
})

// run the tests
async function main() {
  await serverListen()
  if (env.WATCH) {
    client.exit = () => {
      console.log(`test server: https://${host}:${port}/test.html`)
    }
  }
  try {
    await runTests()
  } catch (e) {
    console.error(e)
  }
  if (enableCoverage) {
    console.log(coverageOutput)
  }
  if (!env.WATCH) {
    await serverClose()
    unlink(outFilename)
  }
}

main()
