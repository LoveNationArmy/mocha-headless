# mocha-headless

cli tool to run mocha tests in chrome headless browser

## Features

- Zero configuration
- Chrome headless
- Tests run as ES6 modules, `import` works and all Web technologies (anything that works in Chrome)
- Chai for assertions (`expect` and `assert` are available)
- Code coverage reporting using `istanbuljs`.
- Runs a temporary static Web server to serve the tests over `https://` and so bypasses browser limitations that are found on `file:///` urls

This setup is useful so that our tests run against a real browser environment and not a mock or limited headless version.

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

## --with-errors

Adding `--with-errors` will also display exceptions and resource errors in the output.

```sh
$ mocha-headless test/integration --with-errors
```

This is useful in integration tests when browser API calls are being made because these don't always generate "catchable" errors for mocha to use, so they are hidden, but otherwise make the console output really messy and they're not necessarily errors in our code - just browser quirks and warnings.

## dotenv (.env)

Add an `.env` file to your working dir like this:

```sh
DEBUG=true
HOST=foo
PORT=1234
```

These will be then accessible as globals in the `window` object. If a variable can be `JSON.parse()`ed then it will be. So in the above `true` will be a `Boolean` and `1234` will be a `Number`.

These variables can be overriden in the cli such as:

```sh
$ HOST=0.0.0.0 PORT=8080 mocha-headless
```

**Note:** _but only if they have been defined in the `.env` file beforehand._

## License

MIT
