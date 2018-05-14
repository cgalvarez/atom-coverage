<h1 align="center">AtomCoverage</h1>
<h3 align="center">Add code coverage to your Atom package</h3>
<p align="center">
  <a href="https://nodei.co/npm/atom-coverage/">
    <img src="https://nodei.co/npm/atom-coverage.png">
  </a>
</p>
<p align="center">
  <strong>PACKAGE</strong>
  <br />
  <a href="">
    <img src="https://img.shields.io/npm/v/atom-coverage.svg" alt="NPM package version" />
  </a>
  <a href="http://semver.org/spec/v2.0.0.html">
    <img src="http://img.shields.io/SemVer/2.0.0.png"
      alt="Semantic Versioning 2.0.0" />
  </a>
  <a href="https://travis-ci.org/cgalvarez/atom-coverage">
    <img src="https://img.shields.io/travis/cgalvarez/atom-coverage/master.svg?label=TravisCI%20build&logo=travis"
      alt="Build Status" />
  </a>
</p>
<p align="center">
  <strong>VCS</strong>
  <br />
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat&logo=github"
      alt="Pull requests welcome!" />
  </a>
  <a href="http://commitizen.github.io/cz-cli/">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat"
      alt="Commitizen friendly" />
  </a>
  <a href="https://semantic-release.gitbooks.io/semantic-release/content/">
    <img
      src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg"
      alt="Semantic release" />
  </a>
  <br />
  <a href="https://github.com/cgalvarez/atom-coverage/blob/master/CODE_OF_CONDUCT.md">
    <img src="https://img.shields.io/badge/%E2%9D%A4-code%20of%20conduct-blue.svg?style=flat"
      alt="Code of conduct" />
  </a>
  <a href="https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines">
    <img src="https://img.shields.io/badge/follow-angular%20commit%20convention-blue.svg"
      alt="Follow angular commit convention" />
  </a>
</p>
<p align="center">
  <strong>SECURITY</strong>
  <br />
  <a href="https://greenkeeper.io/">
    <img src="https://badges.greenkeeper.io/cgalvarez/atom-coverage.svg" alt="Greenkeeper enabled" />
  </a>
  <a href="https://snyk.io/test/github/cgalvarez/atom-coverage">
    <img src="https://snyk.io/test/github/cgalvarez/atom-coverage/badge.svg"
      alt="Known Vulnerabilities"
      data-canonical-src="https://snyk.io/test/github/cgalvarez/atom-coverage"
      style="max-width:100%;" />
  </a>
  <a href="https://nodesecurity.io/orgs/cgalvarez/projects/66ddebfd-8788-43ae-ae77-171c8414c74a">
    <img src="https://nodesecurity.io/orgs/cgalvarez/projects/66ddebfd-8788-43ae-ae77-171c8414c74a/badge"
      alt="NSP Status" />
  </a>
  <br />
  <a href="https://www.bithound.io/github/cgalvarez/atom-coverage/master/dependencies/npm">
    <img src="https://www.bithound.io/github/cgalvarez/atom-coverage/badges/dependencies.svg"
      alt="bitHound Dependencies" />
  </a>
  <a href="https://www.bithound.io/github/cgalvarez/atom-coverage/master/dependencies/npm">
    <img src="https://www.bithound.io/github/cgalvarez/atom-coverage/badges/devDependencies.svg"
      alt="bitHound Dev Dependencies" />
  </a>
</p>
<p align="center">
  <strong>QUALITY</strong>
  <br />
  <a href="https://www.bithound.io/github/cgalvarez/atom-coverage">
    <img src="https://www.bithound.io/github/cgalvarez/atom-coverage/badges/score.svg"
      alt="bitHound Overall Score" />
  </a>
  <a href="https://www.bithound.io/github/cgalvarez/atom-coverage">
    <img src="https://www.bithound.io/github/cgalvarez/atom-coverage/badges/code.svg"
      alt="bitHound Code" />
  </a>
  <br />
  <a href="https://codeclimate.com/github/cgalvarez/atom-coverage/maintainability">
    <img src="https://api.codeclimate.com/v1/badges/dd177b97982f224495c4/maintainability"
      alt="CodeClimate maintainability score" />
  </a>
  <a href="https://codeclimate.com/github/cgalvarez/atom-coverage/test_coverage">
    <img src="https://api.codeclimate.com/v1/badges/dd177b97982f224495c4/test_coverage"
      alt="CodeClimate test coverage " />
  </a>
  <br />
  <a href="https://codeclimate.com/github/cgalvarez/atom-coverage/issues">
    <img src ="https://img.shields.io/codeclimate/issues/github/cgalvarez/atom-coverage.svg?label=Code%20Climate%20issues"
      alt="Code Climate issues" />
  </a>
  <a href="https://codecov.io/gh/cgalvarez/atom-coverage">
    <img src="https://codecov.io/gh/cgalvarez/atom-coverage/branch/master/graph/badge.svg"
      alt="codecov" />
  </a>
  <a href="https://inch-ci.org/github/cgalvarez/atom-coverage">
    <img src="http://inch-ci.org/github/cgalvarez/atom-coverage.svg?branch=master&style=shields"
      alt="InchCI docs coverage" />
  </a>
</p>
<p align="center">
  <strong>LEGAL</strong>
  <br />
  <a href="https://opensource.org/">
    <img src="https://img.shields.io/badge/Open%20Source-♥-ff69b4.svg?style=flat"
      alt="Love open source" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat"
      alt="MIT license" />
  </a>
</p>

Currently **only** the following languages/frameworks are supported:

- Languages:
  - ES6 (ECMAScript2015)
- Testing frameworks:
  - [`mocha`](https://mochajs.org/)
  (through [`atom-mocha`](https://www.npmjs.com/package/atom-mocha))
- Coverage frameworks:
  - [`nyc`](https://istanbul.js.org/)

[Feel free (and encouraged!) to contribute](#faq) and improve this package to
work with other languages/frameworks!

## Quickstart

```shell
$ cd your-atom-pkg
$ npm install babel-cli babel-core babel-plugin-istanbul \
  babel-preset-env nyc atom-mocha atom-coverage --save-dev
$ npm run test:coverage
```

After installing, you'll have two new NPM scripts (won't be overwritten if
already present):

- `test:coverage`: runs your specs and generates code coverage reports on
  finish.
- `check:coverage`: checks if your coverage is above your thresholds. Read
  [how to configure thresholds with `nyc`](https://github.com/istanbuljs/nyc#checking-coverage).

I strongly recommend you to define your tests script as
`cross-env NODE_ENV=test atom --test spec/*.spec.js spec/**/*.spec.js`.
`apm test` does not allow for subdirectories, as opposed to `atom --test`.
Having subfolders allows a clearer, properly scoped structure for your
tests/specs.

> **NOTE**: `atom --test spec/*.js` will fail if no `.js` files present at
`spec/`, and `atom --test spec/**/*.js` will fail if no `.js` files present in
any subfolder under `spec/`. This has nothing to do with AtomMocha, but Atom
itself, so define your `test` script congruently/coherently with your project
structure.

## Configuration files

`atom-coverage` uses the config files of the involved frameworks if present.
If any of them is missing or has an incorrect configuration, it will
automatically create them or solve the conflicts for you (*to some extent, of
course*).

Assuming `atom-pkg/` is the root folder of your Atom package, let's dig into
each config file...

### `atom-pkg/.atom-coverage(.(json|yaml|yml))?`

This is the configuration file for `atom-coverage` itself. You can also provide
this configuration through the property `atomCoverage` inside your Atom
package's `package.json`.

The list of currently supported options are:

Option|Type|Description|Default|Valid
-|-|-|-|-
`instrumenter`|String|The coverage framework to use|`nyc`|`nyc`
`transpiler`|String|The transpiler to use|`babel`|`babel`
`sourcesRoot`|String|The relative path to the root of your Atom package's source files|`lib/`<br />`src/`|-
`testScript`|Script|The NPM script to execute your tests and get them covered with the configured `instrumenter`|`test`|-

### [`atom-pkg/.babelrc`](https://babeljs.io/docs/usage/babelrc/)

This is the configuration file for [`babel`](http://babeljs.io/), which
`atom-coverage` uses to transpile your ES6 code into ES5 that `nyc` understands.
The minimum required configuration is:

```javascript
{
  "env": {
    "test": {
      "plugins": [
        // You must install as devDep any babel plugin that your Atom package
        // requires to get successfully transpiled, and include it here
        "...",
        "istanbul"
      ],
      "sourceMaps": "inline"
    }
  },
  "presets": ["env"]
}
```

Helpful links:

- [`.babelrc` reference](https://babeljs.io/docs/usage/babelrc/)
- [Babel plugins reference](https://babeljs.io/docs/plugins/)

> **NOTE 1**: The order of the Babel plugins **matters**, so you must find the
> correct order for your code to get transpiled, **being `istanbul` always the
> last one** (AtomCoverage enforces this).
>
> **NOTE 2**: `atom-coverage` does **NOT** currently support Babel config in
> `package.json`.

### `atom-pkg/.nycrc(.json)?`

This is the configuration file for [`nyc`](https://istanbul.js.org/), which
`atom-coverage` uses to analyze the code coverage of your pre-instrumented files.

Some `nyc` options don't work when pre-instrumenting source files. You don't
need to care about this, since `atom-coverage` fixes them for you! The list of
fixed options includes (but is not limited to, since I haven't thoroughly tested
all options):

- `include: String[]`: array of
  [`glob`-compliant](https://www.npmjs.com/package/glob#glob-primer) strings.
  If you provide a folder instead of a glob (i.e., `lib` or `lib/`), it
  will be extended to recursively get all JavaScript files in that folder
  (previous example would be extended to `lib/**/*.js`).
- `all: boolean`: set `all=true` inside your `nyc` config file to recursively,
  automagically get all your source files under `sourcesRoot` folder included
  and covered.

Helpful links:

- [`nyc` official site](https://istanbul.js.org/)
- [`nyc` code](https://github.com/istanbuljs/nyc/blob/master/lib/config-util.js)
  for its settings API

> **NOTE**: `atom-coverage` does **NOT** currently support `nyc` config in
> `package.json`.

## `testquire(uutPath: string, requireIt: boolean = true)`

We will refer to you files/modules as *UUT* (*Units Under Test*) from here on.

AtomCoverage wraps your NPM test command to analyze the code coverage based on
your package tests. It doesn't make any magic to infer how to test your specs.
You must define that in an NPM script, given by the option `testScript` (which
defaults to `test` script if not provided).

You need to `require()` your pre-instrumented files instead your source files
inside your tests/specs for the code coverage to work, but this would break your
tests when running without coverage (in that case you should only request your
source files). That's why this package exports an alternative `require()` called
`testquire()`, which loads your source files or the pre-instrumented ones,
depending if you request code coverage (thus loading pre-instrumented files) or
not (thus loading source files). You don't need to configure anything. It
resolves both cases automatically for you. The only thing you need inside your
tests/specs is:

```javascript
const { testquire } = require('atom-coverage');
const uut = testquire('path/relative/to/sources/root/for/uut');
```

> **NOTE**: You don't need to care about the depth level of your source/test
> files! `atom-coverage` automatically takes charge of that for you too!

### Example

Let's assume you keep your source files under `lib/`, and you want
to load a file placed at `lib/folder1/folder2/file.js`. Then you require it
inside your test/spec as:

```javascript
const { testquire } = require('atom-coverage');
const uut = testquire('folder1/folder2/file');
```

If you run `npm test`, `testquire()` will require your source file at
`lib/folder1/folder2/file.js`.

If you run `npm run test:coverage`, `testquire()` will require your instrumented
file at `coverage/.instrumented/folder1/folder2/file.js` (assuming that you're
using the default options for `nyc` and `atom-coverage`).

### Stubbing your UUT's dependencies

What if you want to stub some of your files/modules inside your instrumented
files? You can do that with the awesome
[`proxyquire`](https://www.npmjs.com/package/proxyquire) package.

You need to feed `proxyquire()` with the path to your instrumented files to
inject your stubs, but hardcoding the paths would be unmaintainable (and it
would break running only your specs, in addition). That's why you can pass a
second parameter `requireIt` to `testquire()`, which manages whether (1) to
require the file and return it (`requireIt=true`) or (2) not (`requireIt=false`).
So you could use `proxyquire` as follows:

```javascript
const { testquire } = require('atom-coverage');
const proxyquire = require('proxyquire');
const uutPath = testquire('folder1/folder2/file', false);
const uutDepStub = {};
const uut = proxyquire(uutPath, {
  'path/to/dep/exactly/as/required/inside/uut': uutDepStub,
});
```

> **NOTE**: Requiring NodeJS core modules or external dependencies is done
as usual (i.e., `require('fs')` or `require('npmPackage')`).

## Contributing

If you would like to contribute to `projects`, please, read carefully the
[`semantic-release` contributing guidelines](https://github.com/semantic-release/semantic-release/blob/caribou/CONTRIBUTING.md),
which I adhere to, and do the following:

```shell
# 01. Clone your fork of this repository into a local folder.
$ git clone git@github.com:your-user/atom-coverage.git
# 02. Enter the cloned package.
$ cd ./atom-coverage
# 03. Assign the original repo to a remote called "upstream".
$ git remote add upstream https://github.com/cgalvarez/atom-coverage
# 04. Create a new topic branch off the master branch that describe
#     what your PR does and use it.
$ git checkout -b 'your-pr-topic'
# 05. Choose on command to install the package dependencies based on
#     your package manager.
$ (yarn|npm) install
# 06. Make your changes and write specs to test them.
# 07. Ensure that your changes pass the project requirements
#     (linting, tests, coverage...).
$ (yarn|npm) run check
# 08. Once you've finished, commit your changes with commitizen.
$ (yarn|npm) run semantic-commit
# 09. Send a pull request describing what you have done.
```

## FAQ

### Does/will this package support my desired testing/coverage framework?

If you want to support a different testing/coverage framework, please, help
other developers with the same needs/preferences/desires as you :blush:, help
the open source community :heart: and contribute to the project by making an
awesome pull request! :sparkles:

## Author

&#169; 2018 Carlos García ([@cgalvarez](https://github.com/cgalvarez)),
All rights reserved.

## License

AtomCoverage is released under the [MIT License](./LICENSE).
