// eslint-disable-next-line security/detect-child-process
const { execSync } = require('child_process'); // Fixed command, no user input.
const { join, relative, sep } = require('path');
const { outputJSONSync } = require('fs-extra');
const { readConfig, writeConfig } = require('../util');
const _ = require('lodash');
const glob = require('glob');
const isGlob = require('is-glob');

const cwd = process.cwd();
const defaults = {
  config: {
    'exclude-after-remap': false,
    instrument: false,
    'source-map': false,
  },
  options: {
    'report-dir': 'coverage',
    'temp-directory': '.nyc_output',
  },
};
const configFile = {
  pattern: '.nycrc?(.json)',
  default: '.nycrc.json',
};


const nyc = {
  // Members.
  config: {
    filepath: undefined,
    modified: false,
    settings: undefined,
  },

  /**
   * @summary Fetches configuration for `nyc` from any config file found.
   */
  readConfig() {
    readConfig.call(this.config, configFile.pattern, 'json');
  },

  /**
   * @summary Saves `nyc` configuration to config file.
   */
  saveConfig() {
    writeConfig(this.config.filepath || configFile.default, this.config.settings, 'json');
  },

  /**
   * @summary Ensures the required minimum config for `nyc` to work with Atom package coverage.
   * @param   {Object}  atomCoverage         AtomCoverage settings.
   * @param   {Boolean} [saveOnChange=false] Whether to write changes to config file on change.
   */
  ensureConfig(atomCoverage, saveOnChange = false) {
    if (!this.config.settings) {
      this.readConfig();
    }

    // Option values required to get `nyc` coverage working.
    /* eslint-disable security/detect-object-injection */
    Object.keys(defaults.config).forEach((key) => {
      const value = defaults.config[key];
      if (this.config.settings[key] === value) {
        return;
      }
      this.config.modified = true;
      this.config.settings[key] = value;
    });
    /* eslint-enable security/detect-object-injection */

    if (!this.config.filepath || (this.config.modified && saveOnChange)) {
      this.saveConfig();
    }

    // Initialize some options (if missing) to their default values to use them internally.
    _.defaultsDeep(this.config.settings, defaults.options);
  },

  /**
   * @summary Returns the output folder for `nyc` reports.
   * @return  {String} The output folder for `nyc` reports.
   * @throws  {Error}  If `nyc` instrumenter not initialized.
   */
  getOutputFolder() {
    if (!this.config.settings) {
      throw new Error('`nyc` instrumenter not initialized!');
    }

    return this.config.settings['report-dir'];
  },

  /**
   * @summary Wraps the NPM `test` script of the Atom package with `nyc`.
   * @return {[type]} [description]
   */
  run() {
    // We pass all env vars, because `atom --test` needs some ones for this
    // cmd to succeed (otherwise it takes `root` as user running the specs).
    execSync('nyc npm test', { cwd, env: process.env, stdio: 'inherit' });
  },

  /**
   * Hooks into the first available hook of the mocha instance `beforeAll()` in
   * order to subscribe to the mocha runner `'end'` event within (to collect the
   * coverage info and dump it to where `nyc` expect to find it).
   *
   * Regarding on when and how to hook, requiring a module doesn't work with `nyc`
   * or `mocha`, since all my tests have proven that `global.AtomMocha` isn't
   * available for those required modules, so our best choice is hooking when the
   * user requires `atom-coverage` inside their specs.
   *
   * @see {@link https://github.com/istanbuljs/nyc#require-additional-modules|Requiring additional modules with `nyc`}
   * @see {@link https://mochajs.org/#usage|Requiring modules with `mocha`}
   */
  trackCoverage(manager) {
    const { config: atomCoverageConfig, requireRoot } = manager;

    /**
     * At this moment, the mocha instance is available at `global.AtomMocha.mocha`,
     * so we can hook our code invoking `global.AtomMocha.mocha.suite.beforeAll()`,
     * which will run only once before the runner starts all tests from all files.
     *
     * @see {@link https://stackoverflow.com/questions/18660916/#answer-18702655|mocha hooks and runner events}
     * @see {@link https://github.com/Alhadis/Atom-Mocha/pull/4|AtomMocha API}
     */
    global.AtomMocha.mocha.suite.beforeAll(this.subscribeToMochaRunnerEnd.bind(this));

    if (!this.config.settings.include && !this.config.settings.all) {
      return;
    }

    // Require configured files only when coverage has been requested.
    const globs = this.getGlobsToCover(
      atomCoverageConfig.sourcesRoot,
      atomCoverageConfig.instrumentedPath,
      requireRoot // eslint-disable-line comma-dangle
    );

    /**
     * Require the requested source files to report missing coverage on them.
     * The `nyc` options `--all`/`--include` don't work when instrumenting files manually.
     *
     * @see {@link https://github.com/istanbuljs/nyc/issues/594|`--all` doesn't work for pre-instrumented files}
     */
    globs.forEach((pattern) => {
      const files = glob.sync(pattern, { cwd: requireRoot });
      files.forEach((filepath) => {
        // eslint-disable-next-line no-empty,smells/no-complex-chaining
        try { manager.testquire(filepath); } catch (e) {}
      });
    });
  },

  /**
   * Once this callback is invoked on mocha's `beforeAll()`, we will have the mocha test
   * runner instance available to hook on any available event we wish to subscribe.
   *
   * @see {@link https://stackoverflow.com/questions/18660916/#answer-18702655|mocha hooks and runner events}
   * @see {@link https://github.com/Alhadis/Atom-Mocha/pull/4|AtomMocha API}
   */
  subscribeToMochaRunnerEnd() {
    global.AtomMocha.runner.on('end', this.collectCoverage.bind(this));
  },

  /**
   * [getGlobsToCover description]
   * @param  {String}   sourcesRoot      The absolute path to the root of the Atom package sources.
   * @param  {String}   instrumentedPath The path where save the instrumented files to.
   * @param  {String}   requireRoot      The root for `testquire()`ing the sources under test.
   * @return {String[]}                  Array of globs to search and analyze for coverage.
   */
  getGlobsToCover(sourcesRoot, instrumentedPath, requireRoot) {
    const globs = [];

    if (this.config.settings.all === true) {
      globs.push('**/*.js');
    }

    if (!_.isArray(this.config.settings.include)) {
      return globs;
    }

    // `nycrc.include` refers to paths of source files (starting at
    // project root), not instrumented ones, so we must remap them.
    const mapIncludedPaths = (includePath) => {
      const remapPath = includePath.replace(sourcesRoot, instrumentedPath + sep);
      const globReplacement = isGlob(remapPath)
        ? remapPath
        : join(remapPath, '**/*.js');
      return relative(requireRoot, globReplacement);
    };
    const includeGlobs = this.config.settings.include.map(mapIncludedPaths);
    globs.push(...includeGlobs);

    return globs;
  },

  /**
   * At this moment, the mocha instance is available at `global.AtomMocha.mocha`,
   * so we can hook our code invoking `global.AtomMocha.mocha.suite.beforeAll()`,
   * which will run only once before the runner starts all tests from all files.
   *
   * Once our callback is invoked on `beforeAll()`, we will have the mocha test
   * runner instance available to hook on any available event we wish to subscribe.
   *
   * @see {@link https://stackoverflow.com/questions/18660916/#answer-18702655|mocha hooks and runner events}
   * @see {@link https://github.com/Alhadis/Atom-Mocha/pull/4|AtomMocha API}
   */
  collectCoverage() {
    // eslint-disable-next-line no-underscore-dangle
    const c = global.__coverage__;
    const { hash } = c[Object.keys(c)[0]];
    const coveragePath = join(cwd, this.config.settings['temp-directory'], `${hash}.json`);
    outputJSONSync(coveragePath, c);
  },
};

module.exports = {
  nyc,
};
