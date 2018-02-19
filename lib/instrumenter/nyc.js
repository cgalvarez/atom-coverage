const { execSync } = require('child_process');
const { join, relative, sep } = require('path');
const { readJSONSync, outputJSONSync } = require('fs-extra');
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

const nyc = {
  // Members.
  config: {
    filenamePattern: '.nycrc?(.json)',
    filepath: undefined,
    modified: false,
    settings: undefined,
  },

  findConfigFile() {
    const files = glob.sync(this.config.filenamePattern);

    if (files.length === 0) {
      throw new Error(`No ${this.config.filenamePattern} file found.`);
    }

    this.config.filepath = join(cwd, files.pop());
    return this.config.filepath;
  },

  readConfig() {
    if (!this.config.filepath) {
      throw new Error('No filepath to read!');
    }

    this.config.settings = readJSONSync(this.config.filepath);
    return this.config.settings;
  },

  saveConfig() {
    outputJSONSync(this.config.filepath, this.config.settings, { spaces: 2 });
  },

  ensureConfig(atomCoverage, saveOnChange = false) {
    if (!this.config.settings) {
      this.findConfigFile();
      this.readConfig();
    }

    _.forEach(defaults.config, (value, key) => {
      if (this.config.settings[key] === value) {
        return;
      }
      this.config.modified = true;
      this.config.settings[key] = value;
    });

    if (this.config.modified && saveOnChange) {
      this.saveConfig();
    }

    // Initialize some options to their default values to use them internally.
    _.forEach(defaults.options, (folder, option) => {
      if (this.config.settings[option]) {
        return;
      }
      this.config.settings[option] = folder;
    });
  },

  getOutputFolder() {
    if (!this.config.settings) {
      throw new Error('`nyc` instrumenter not initialized!');
    }

    return this.config.settings['report-dir'];
  },

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
     * Require all source files to report missing coverage on ALL files.
     * The `nyc` option `--all` does not work when instrumenting files manually,
     * so we use this hackity hack to include all instrumented files
     * (even if not directly required by our tests).
     *
     * @see {@link https://github.com/istanbuljs/nyc/issues/594|`--all` doesn't work for pre-instrumented files}
     */
    globs.forEach((pattern) => {
      const files = glob.sync(pattern, { cwd: requireRoot });
      files.forEach((filepath) => {
        // eslint-disable-next-line no-empty
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
