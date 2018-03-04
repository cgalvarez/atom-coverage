const { dirname, join, relative } = require('path');
const Joi = require('joi');
const cosmiconfig = require('cosmiconfig');
const glob = require('glob');
const _ = require('lodash');

// Utils.
const { envHas } = require('./util');
// Transpilers.
const { babel } = require('./transpiler/babel');
// Coverage tools (instrumenters).
const { nyc } = require('./instrumenter/nyc');

const map = {
  transpiler: { babel },
  instrumenter: { nyc },
};

const schema = {
  config: Joi.object().keys({
    instrumenter: Joi.string().optional().default('nyc').valid('nyc')
      .description('The coverage tool to use to collect the coverage info'),
    transpiler: Joi.string().optional().default('babel').valid('babel')
      .description('The library/framework to use for transpiling the source files into plain JavaScript'),
    testScript: Joi.string().optional().default('test')
      .description('The NPM script to run the Atom package tests'),
    // Internal initialized if missing WHEN reading config through `cosmiconfig`.
    sourcesRoot: Joi.string().optional()
      .description('The root path for the source files of your project'),
  }).allow(null).required(),
};
const cwd = process.cwd();
const defaults = {
  config: {
    instrumenter: 'nyc',
    testScript: 'test',
    transpiler: 'babel',
  },
  cosmiconfig: {
    cache: true,
    js: false,
    packageProp: 'atomCoverage',
    rc: '.atom-coverage',
    rcExtensions: true,
    rcStrictJson: false,
    stopDir: cwd,
    sync: true,
  },
};
const instrumentedFolder = '.instrumented';
const Env = {
  COVERAGE: 'COVERAGE',
};

const manager = {
  // Members.
  config: undefined,
  requireRoot: undefined,
  transpiler: undefined,
  instrumenter: undefined,

  /**
   * @summary Fetches the configuration from config files and validate it.
   * @param   {Boolean} [saveOnChange=false] Whether to write changes to config file on change.
   * @return  {Object}                       The configuration.
   */
  readConfig(saveOnChange = false) {
    // Search for configuration file and parse its contents.
    const explorer = cosmiconfig('atom-coverage', defaults.cosmiconfig);
    const settings = explorer.load();
    const config = (settings === null) ? null : settings.config;

    // Validate and sanitize.
    this.config = Joi.attempt(config, schema.config);

    // Initialize some internal settings (which may be
    // overriden through config file, of course!).
    this.initConfig(saveOnChange);

    return this.config;
  },

  /**
   * @summary Returns the configuration for AtomCoverage.
   * @return  {Object} The configuration.
   */
  getConfig() {
    return this.config;
  },

  /**
   * Initializes AtomCoverage.
   *
   * NOTE: It's meant to be called after `readConfig()`.
   *
   * @param {Boolean} [saveOnChange=false] Whether to write changes to config file on change.
   */
  initConfig(saveOnChange = false) {
    // Use defaults if no config provided/found.
    this.config = this.config || defaults.config;

    // Source files root.
    this.findSourcesRoot();

    // Configure transpiler/instrumenter.
    /* eslint-disable security/detect-object-injection */
    Object.keys(map).forEach((type) => {
      const supported = map[type];
      if (!_.has(supported, this.config[type])) {
        throw new Error(`Unsupported ${type} "${this.config[type]}"`);
      }
      this[type] = supported[this.config[type]];
      this[type].enforceConfig(this.config, saveOnChange);
    });
    /* eslint-enable security/detect-object-injection */

    // Internal path where save the instrumented files to.
    if (!this.config.instrumentedPath) {
      const instrumenterOutput = this.instrumenter.getOutputFolder();
      this.config.instrumentedPath = join(instrumenterOutput, instrumentedFolder);
    }

    this.findRequireRoot();
  },

  /**
   * @summary Finds the root path where the source files of the Atom package lives.
   */
  findSourcesRoot() {
    if (this.config.sourcesRoot) {
      return;
    }

    const sourcesRoot = glob.sync('@(lib|src)/');
    if (sourcesRoot === undefined) {
      throw new Error('No sources found at common locations (lib|src).');
    }
    this.config.sourcesRoot = sourcesRoot.pop();
  },

  /**
   * @summary Finds the root path to use when requiring sources under test with `testquire()`.
   */
  findRequireRoot() {
    if (this.requireRoot) {
      return;
    }
    this.requireRoot = envHas(Env.COVERAGE)
      ? this.config.instrumentedPath
      : this.config.sourcesRoot;
  },

  /**
   * @summary Runs the tests (with NPM script `test`) collecting coverage.
   */
  runTestsWithCoverage() {
    // Step 1: transpile source files into ES5 JavaScript (if needed).
    // NOTE: Some transpilers pre-instrument source files in the same step.
    this.transpiler.transpile(this.config);

    // Step 2: pre-instrument transpiled files (if needed).
    // babel + nyc ~> babel-plugin-istanbul already instruments the source files.

    // Step 3: run coverage tool.
    this.instrumenter.run(this.config.testScript);
  },

  /**
   * Requires a source file, which may be instrumented (if `process.env.COVERAGE`
   * is a truthy value {true|on|1) or not.
   *
   * Optionally it can return the path to the source file when passing `false` as
   * second parameter. This is useful when you rely on other testing tools (like
   * `proxyquire`) to patch/mock your modules.
   *
   * @param  {String}     srcPath          The source path to re-route.
   * @param  {Boolean}    [requireIt=true] Whether to return the module (`true`) or its path.
   * @return {any|String}                  The required module or its path.
   * @summary Requires a source file, optionally instrumented, depending on the env.
   */
  testquire(srcPath, requireIt = true) {
    const subpath = join(this.requireRoot, srcPath);
    if (requireIt) {
      // eslint-disable-next-line import/no-dynamic-require, security/detect-non-literal-require
      const mod = require(relative(__dirname, subpath));
      return _.has(mod, 'default') ? mod.default : mod;
    }

    const callerSpec = module.parent.parent.filename;
    return relative(dirname(callerSpec), subpath);
  },

  /**
   * @summary Orders the instrumenter to start collecting the coverage info.
   */
  trackCoverage() {
    this.instrumenter.trackCoverage(this);
  },
};

module.exports = {
  manager,
};
