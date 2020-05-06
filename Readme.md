# mocha-headless

cli tool to run mocha tests in chrome headless browser

## Features

- Zero configuration
- Chrome headless
- Tests run as ES6 modules, `import` works and all Web technologies (anything that works in Chrome)
- Chai for assertions (`expect` and `assert` are available)
- Code coverage reporting using `istanbuljs`.
- Runs a temporary static Web server to serve the tests over `https://` and so bypasses browser limitations that are found on `file:///` urls

## Usage

Create some mocha tests and place them in `my-project/test` directory.

Then:

```sh
$ npm install -g mocha-headless
$ cd my-project/
$ mocha-headless
```

You can also point to a folder, a file, or a glob pattern.

```sh
$ mocha-headless test/unit/login
$ mocha-headless some-file.js
$ mocha-headless test/**/*.spec.js
```

## Code coverage

Simply add `--coverage` to the cli arguments.

```sh
$ mocha-headless test/unit --coverage
```

## License

MIT
