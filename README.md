<link rel="stylesheet" type="text/css" media="all" href="./docs/assets/readme.css" />
<h1 align="center">
  AtomCoverage
</h1>
<h3 align="center">Add code coverage to your ES6 Atom package</h3>
<p align="center">
  <strong>PACKAGE</strong>
  <br />
  <a href="http://semver.org/spec/v2.0.0.html">
    <img src="http://img.shields.io/SemVer/2.0.0.png" alt="Semantic Versioning 2.0.0">
  </a>
  <a href="https://travis-ci.org/cgalvarez/atom-coverage">
    <img src="https://travis-ci.org/cgalvarez/atom-coverage.svg?branch=master" alt="Build Status" />
  </a>
</p>
<p align="center">
  <strong>VCS</strong>
  <br />
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat&logo=github" alt="Pull requests welcome!" />
  </a>
  <a href="http://commitizen.github.io/cz-cli/">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat" alt="Commitizen friendly" />
  </a>
  <a href="https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines">
    <img src="https://img.shields.io/badge/follow-angular%20commit%20convention-blue.svg" alt="Follow angular commit convention" />
  </a>
  <a href="https://semantic-release.gitbooks.io/semantic-release/content/">
    <img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg" alt="Semantic release" />
  </a>
</p>
<p align="center">
  <strong>SECURITY</strong>
  <br />
  <a href="https://greenkeeper.io/">
    <img src="https://badges.greenkeeper.io/cgalvarez/atom-coverage.svg" alt="Greenkeeper enabled" />
  </a>
  <a href="https://snyk.io/test/github/cgalvarez/atom-coverage">
    <img src="https://snyk.io/test/github/cgalvarez/atom-coverage/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/cgalvarez/atom-coverage" style="max-width:100%;"/>
  </a>
  <a href="https://www.bithound.io/github/cgalvarez/atom-coverage/master/dependencies/npm">
    <img src="https://www.bithound.io/github/cgalvarez/atom-coverage/badges/dependencies.svg" alt="bitHound Dependencies">
  </a>
  <a href="https://www.bithound.io/github/cgalvarez/atom-coverage/master/dependencies/npm">
    <img src="https://www.bithound.io/github/cgalvarez/atom-coverage/badges/devDependencies.svg" alt="bitHound Dev Dependencies">
  </a>
</p>
<p align="center">
  <strong>QUALITY</strong>
  <br />
  <a href="https://www.bithound.io/github/cgalvarez/atom-coverage">
    <img src="https://www.bithound.io/github/cgalvarez/atom-coverage/badges/score.svg" alt="bitHound Overall Score">
  </a>
  <a href="https://www.bithound.io/github/cgalvarez/atom-coverage">
    <img src="https://www.bithound.io/github/cgalvarez/atom-coverage/badges/code.svg" alt="bitHound Code">
  </a>
  <a href="https://codecov.io/gh/cgalvarez/atom-coverage">
    <img src="https://codecov.io/gh/cgalvarez/atom-coverage/branch/master/graph/badge.svg" alt="codecov" />
  </a>
  <a href="https://inch-ci.org/github/cgalvarez/atom-coverage">
    <img src="http://inch-ci.org/github/cgalvarez/atom-coverage.svg?branch=master&style=shields" alt="InchCI docs coverage" />
  </a>
</p>
<p align="center">
  <strong>LEGAL</strong>
  <br />
  <a href="https://opensource.org/">
    <img src="https://img.shields.io/badge/Open%20Source-♥-ff69b4.svg?style=flat" alt="Love open source">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat" alt="MIT license">
  </a>
</p>

AtomCoverage allows you to perform code coverage analysis on your Atom package by means of `istanbul/nyc`.

This package aims to be a quick patch to get you up and running with code coverage by addressing some awkward pitfalls when integrating `nyc` with Atom packages.

The requirements (or current limitations, if you prefer) for AtomCoverage to work are:

- Your Atom package must be coded in JavaScript ES6.
- Your Atom package specs must use [`mocha`](https://mochajs.org/) (by means of [`atom-mocha`](https://www.npmjs.com/package/atom-mocha)).
- You are limited to the [`istanbul/nyc`](https://istanbul.js.org/) coverage framework.

Why? Because those are the frameworks I'm actively testing due to my own needs. [Feel free to contribute](#faq) and improve this package to work with other testing/coverage frameworks. It is designed to be easily extended.

## Quickstart

```shell
           $ cd your-atom-pkg
           # Choose one of the following depending on your package manager.
[CHOICE 1] $ npm install babel-cli babel-core babel-plugin-istanbul babel-preset-env nyc atom-mocha atom-coverage --save-dev
[CHOICE 2] $ yarn add babel-cli babel-core babel-plugin-istanbul babel-preset-env nyc atom-mocha atom-coverage --dev
           $ (npm|yarn) run test:coverage
```

That easy? **Yes**, seriously. AtomCoverage...

- makes NPM warning you about missing peer dependencies (the ones you've just installed with the quickstart commands above!).
- leverages the `postinstall` hook by adding (if not exists) next NPM scripts to the `package.json` of your Atom package automagically for you:
    - `test:coverage`: runs your specs and generates code coverage reports on finish.
    - `check:coverage`: checks if your coverage is above your thresholds. Read [here](https://github.com/istanbuljs/nyc#checking-coverage) how to configure them in your `.nycrc(.json)?`.
- checks automagically the existence and correct settings for both, `babel` and `nyc` in their respective config files (`.babelrc`, `.nycrc(.json)?`); if any of them is missing or has an incorrect configuration, it will automatically create them or solve the conflicts for you (*to some extent, of course*; read the caveats at [Configuration files section](#configuration-files) below).

I recommend you that you define your NPM `test` script as `"test": "cross-env NODE_ENV=test atom --test spec/*.spec.js spec/**/*.spec.js"`. `apm test` does not allow for subdirectories, as opposed to `atom --test`, but it needs the two patterns, as `**/*` only takes charge of any subfolder(s), but not the files on the root folder.

I prefer having subfolders because I can classify my tests into unit, functional, integration or acceptance tests.

> **NOTE**: `atom --test spec/*.js` will fail if no `.js` files present at `spec/`, and `atom --test spec/**/*.js` will fail if no `.js` files present in any subfolder under `spec/`. This has nothing to do with AtomMocha, but Atom itself, so define your `test` script congruently/coherently with your project structure.

## How to require your *modules under test* (`mut` from here on)

AtomCoverage wraps your `npm test` command to get the code coverage. It doesn't make any magic to infer how to test your specs. You must define that in your NPM `test` script.

You need to `require()` your pre-instrumented files instead your source files inside your tests/specs for the code coverage to work, but this would break your tests when running without coverage (in that case you should only request your source files). That's why this package exports an alternative `require()` called `testquire()`, which loads your source files or the pre-instrumented ones, depending if you request code coverage (loads pre-instrumented) or or not (loads source files). You don't need to configure anything. It resolves both cases automatically for you. The only thing you need inside your tests/specs is:

```javascript
const { testquire } = require('atom-coverage');
const mut = testquire('path/relative/to/sources/root/for/mut');
```

---

**Example**: Let's assume you keep your source files under `lib/`, and you want to load a module placed at `lib/folder1/folder2/mod.js`. Then you require it as follows:

```javascript
const { testquire } = require('atom-coverage');
const mut = testquire('folder1/folder2/mod');
```

If you run `npm test`, `testquire` will require your source file at `lib/folder1/folder2/mod.js`.

If you run `npm run test:coverage`, `testquire` will require your instrumented file at `coverage/.instrumented/folder1/folder2/mod.js` (assuming that you're using the default options).

---

What if you want to stub some of your modules inside your instrumented files with the awesome [`proxyquire`](https://www.npmjs.com/package/proxyquire) package? Then you'll need the path to your instrumented files to inject the stubs, but hardcoding the paths would be unmaintainable (and it would break running only your specs, in addition). That's why you can pass a second parameter `requireIt` to `testquire()`, which manages whether 1) to require the file and return it (`true`) or 2) not (`false`). So you could use proxyquire as follows:

```javascript
const { testquire } = require('atom-coverage');
const proxyquire = require('proxyquire');
const mutPath = testquire('folder1/folder2/mod', false);
const anotherModStub = {};
const mut = proxyquire(mutPath, {
  './anotherMod': anotherModStub,
});
```

> **NOTE**: Requiring NodeJS core modules or project NPM dependencies is done as usual (i.e., `require('fs')` or `require('npmPackage')`).

## Configuration files

This package leverages some other awesome projects to perform the code coverage, and uses their configuration files:

- [`babel`](http://babeljs.io/) ~> AtomCoverage inherits the config in  [`${your-atom-pkg}/.babelrc`](https://babeljs.io/docs/usage/babelrc/) to transpile your Atom ES6 project into ES5 JavaScript.
- [`nyc`](https://istanbul.js.org/) ~> AtomCoverage inherits the config in [`${your-atom-pkg}/.nycrc(.json)?`](https://github.com/istanbuljs/nyc/blob/master/lib/config-util.js)
- [`atom-mocha`](https://www.npmjs.com/package/atom-mocha).

Let's dig into each config file...

### `.babelrc`

You can learn about how `babel` looks up `.babelrc` (or even setting the config inside your `package.json`) [here](https://babeljs.io/docs/usage/babelrc/#lookup-behavior). I strongly recommend you to keep `babel` config it its own `.babelrc` at your project root.

The minimum required configuration in your `.babelrc` is:

```json
{
  "env": {
    "test": {
      "plugins": ["istanbul"],
      "sourceMaps": "inline"
    }
  },
  "presets": ["env"]
}
```

Please, note that if you need any extra plugin(s) to support the ES6 features of your Atom project, you will need to install/add those plugins to your project `devDependencies` and modify the `env.test.plugins` entry to make it successfully transpiling your code.

**Example**: if your package uses decorators, you will need the babel plugin `babel-plugin-transform-decorators-legacy`, so you will execute one of:

```shell
[CHOICE 1] npm install --save-dev babel-plugin-transform-decorators-legacy
[CHOICE 2] yarn add babel-plugin-transform-decorators-legacy --dev
```

And you will modify `.babelrc` as follows:

```json
{
  "env": {
    "test": {
      "plugins": [
        "transform-decorators-legacy",
        "istanbul"
      ],
      "sourceMaps": "inline"
    }
  },
  "presets": ["env"]
}
```

> **NOTE 1**: In case you need help with this, please, refer to the [plugins section](https://babeljs.io/docs/plugins/) on the babel site to learn how to use them, as that is not a problem related with this package.

> **NOTE 2**: Notice that the order of the plugins **matters**, so you must find the correct order for your Atom package, **being `"istanbul"` always the last one** (AtomCoverage ensures this last one).

### `.nycrc(.json)?`

Didn't get `babel-plugin-istanbul` to work with on-the-fly instrumentation, so all source files are pre-instrumented.

AtomCoverage inherits your `nyc` settings. If you want to learn about them, please, [dig into the relevant piece of its code](https://github.com/istanbuljs/nyc/blob/master/lib/config-util.js), read [the official docs at its site](https://istanbul.js.org/) or get command line help with `./node_modules/.bin/nyc --help`.

That said, some `nyc` options doesn't work when pre-instrumenting source files (which this package does), including but not limited (haven't thoroughly tested all of them) to:

#### `include`

The **GOOD NEWS** are that AtomCoverage fixes this functionality. Now you can provide **an array of [`glob`-compliant](https://www.npmjs.com/package/glob#glob-primer) globs**. If you provide a folder instead a glob (i.e., `'lib'` or `'lib/'`), it will be extended to get all JavaScript files in that folder (following the same example, it would be extended to `'lib/**/*.js'`).

#### `all`

When pre-instrumenting your source files, the `all` option becomes [useless](https://github.com/istanbuljs/nyc/issues/594).

Again, the **GOOD NEWS** are that AtomCoverage fixes it for you too! If you set `all=true` inside your `.nycrc` file, you will get automagically **all** your JavaScript source files under `(lib|src)/` folder (recursively) added and covered.

## FAQ

### Does/will this package support ***MY_CHOICE*** testing/coverage framework?

Currently only supports `mocha` test runner by means of `atom-mocha` (with the assertion library of your choice), and `istanbul` coverage through `nyc`.

If you want to support a different testing/coverage framework, please, help other developers with the same needs/preferences as you :blush:, help the open source community :heart: and contribute to the project by making an awesome pull request! :sparkles:

I think it should not be very cumbersome to include support for other transpiled languages, like CoffeScript (which Atom supports right out-of-the-box) or TypeScript (this one would need some extra work, since [it isn't supported directly by Atom](https://discuss.atom.io/t/support-run-package-wrote-in-typescript/50333/7)), by transpiling them with their own compilers in the transpilation stage.

Regarding other coverage frameworks, the only one I have experience with is the one currently implemented, so you will likely be on your own.

Regarding other testing frameworks, I know Atom ships with `jasmine` support, but like I've just said above, I have no direct experience with it, so my help will be very limited.

### Is this package stable?

I've set its initial version as `0.1.0` because its API may change, depending on people needs and PRs. Right now it focuses on two specific frameworks (`mocha` by means of `atom-mocha`, and `nyc`), but it could be improved to support other languages and/or testing/coverage frameworks.

I think it's improbable that the API change **a lot**, because it only exposes the binary `atom-mocha` (which is meant to be invoked without parameters) and the function (`testquire()`, which shouldn't change), and already uses its own config file `.atom-coverage(.yml|.yaml|.json)?`) or some config inside `package.json`.

AtomCoverage works for me. I don't have issues with it right now. If you find any bug, please, [open/file an issue](https://github.com/cgalvarez/atom-coverage/issues/new)!

## Some ideas for future development

- [ ] Use [`greenkeeper-lockfile`](https://github.com/greenkeeperio/greenkeeper-lockfile) on CI.
- [ ] Implement CD (Continuous Development) feedback through NPM script `test:coverage:watch` by instrumenting/covering on-the-fly only modified source files and re-running `nyc`.
- [ ] Create a NPM script to open HTML coverage reports in the browser after being generated.
- [ ] Inject code to leverage from [`browsersync`](https://browsersync.io/) into the HTML coverage reports to refresh automatically on re-generation.
- [ ] Maybe other languages?
- [ ] Use [Benbria CoffeeCoverage](https://github.com/benbria/coffee-coverage) to cover Atom projects written in CoffeeScript.
- [ ] Use [`codependency`](https://www.npmjs.com/package/codependency) or [`optional`](https://www.npmjs.com/package/optional) to manage optional peer dependencies (when extending to other frameworks; i.e. `babel`, `nyc`, `coffeescript`, `typescript`,...).

## Contributing

If you would like to contribute to `projects`, please, read carefully the [`semantic-release` contributing guidelines](https://github.com/semantic-release/semantic-release/blob/caribou/CONTRIBUTING.md), which I adhere to, and do the following:

```shell
# 01. Clone your fork of this repository into a local folder.
$ git clone git@github.com:your-user/atom-coverage.git
# 02. Enter the cloned package.
$ cd ./atom-coverage
# 03. Assign the original repo to a remote called "upstream".
$ git remote add upstream https://github.com/cgalvarez/atom-coverage
# 04. Create a new topic branch off the master branch that describe
#     what your PR does and use it.
$ git checkout -m 'your-pr-topic'
# 05. Choose on command to install the package dependencies based on
#     your package manager.
$ yarn / npm install
# 06. Make your changes and write specs to test them.
# 07. Ensure that your changes pass the project requirements
#     (linting, tests, coverage...).
$ npm run prepush
# 08. Once you've finished, commit your changes with commitizen.
$ npm run semantic-commit
# 09. If any of the required checks fails, fix it and run next command to
#     avoid re-filling commitizen details; otherwise jump to 10.
$ npm run semantic-commit-retry
# 10. Send a pull request describing what you have done.
```

## Author

&#169; 2018 Carlos García ([@cgalvarez](https://github.com/cgalvarez)), All right reserved.

## License

AtomCoverage is released under the [MIT License](./LICENSE).
