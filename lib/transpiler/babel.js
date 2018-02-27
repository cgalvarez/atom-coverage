// eslint-disable-next-line security/detect-child-process
const { execSync } = require('child_process');
const { sep } = require('path');
const { readConfig, writeConfig } = require('../util');
const _ = require('lodash');

const cwd = process.cwd();

const configFile = {
  pattern: '.babelrc',
  default: '.babelrc',
};

/**
 * Babel can act as both, transpiler and instrumenter, depending on the
 * coverage framework.
 *
 * @type {Object}
 */
const babel = {
  config: {
    filepath: undefined,
    modified: false,
    settings: undefined,
  },

  readConfig() {
    readConfig.call(this.config, configFile.pattern, 'json');
  },

  saveConfig() {
    writeConfig(this.config.filepath || configFile.default, this.config.settings, 'json');
  },

  /**
   * Ensures the babel configuration file `.babelrc` contains the minimum
   * configuration required for this package to work properly (to some extent).
   *
   * @param {Object}  atomCoverage  AtomCoverage settings.
   * @param {Boolean} saveOnChange  Whether to save the settings to disk (`true`) or not.
   */
  ensureConfig(atomCoverage, saveOnChange = false) {
    if (!this.config.settings) {
      this.readConfig();
    }

    // Use `env`.
    _.update(this.config.settings, 'presets', v => this.enforceUsingEnvPreset(v));

    if (atomCoverage.instrumenter === 'nyc') {
      this.setupForNyc();
    }

    if (this.config.filepath && (!this.config.modified || !saveOnChange)) {
      return;
    }

    this.saveConfig();
    this.config.modified = false;
  },

  enforceUsingEnvPreset(envPresets) {
    const required = 'env';

    if (!_.isArray(envPresets)) {
      this.config.modified = true;
      return [required];
    }

    if (!envPresets.includes(required)) {
      this.config.modified = true;
      envPresets.push(required);
    }

    return envPresets;
  },

  setupForNyc() {
    _.update(this.config.settings, 'env.test.sourceMaps', v => this.enforceSourceMaps(v));
    _.update(this.config.settings, 'env.test.plugins', v => this.enforceIstanbulPlugin(v));
  },

  /**
   * `nyc` needs the source maps to remap from instrumented (transpiled) back
   * to the original source files.
   *
   * @param  {String} [value] The value of babel option "sourceMaps".
   * @return {String}         The value to set ("inline" or "both").
   */
  enforceSourceMaps(value) {
    if (value === 'inline' || value === 'both') return value;
    this.config.modified = true;
    return 'inline'; // Default value.
  },

  /**
   * Enforces `babel-plugin-istanbul` to be present and in the last position of babel plugins.
   * @param  {String[]} [plugins] The list of babel plugins.
   * @return {String[]}           The babel plugins list to set.
   */
  enforceIstanbulPlugin(plugins) {
    const required = 'istanbul';

    // Missing or invalid value.
    if (!_.isArray(plugins)) {
      this.config.modified = true;
      return [required]; // Default value.
    }

    // `babel-plugin-istanbul` is missing.
    if (!plugins.includes(required)) {
      this.config.modified = true;
      plugins.push(required);
      return plugins;
    }

    if (_.last(plugins) === required) {
      return plugins;
    }

    // `babel-plugin-istanbul` is not the last plugin.
    this.config.modified = true;
    _.pull(plugins, required);
    plugins.push(required);
    return plugins;
  },

  /**
   * Babel can only transpile from ES6+ into ES5, so `lang` is irrelevant here.
   * Besides, it can do both tasks, transpile and instrument, if the user has
   * selected `nyc` has coverage tool.
   *
   * @param  {Object} config AtomCoverage settings.
   */
  transpile(atomCoverageConfig) {
    if (atomCoverageConfig.instrumenter === 'nyc') {
      const env = _.pick(process.env, ['COVERAGE', 'NODE_ENV', 'PATH']);
      env.BABEL_ENV = 'test';
      const cmd = `babel -d ${atomCoverageConfig.instrumentedPath} `
        + `-q ${_.trimEnd(atomCoverageConfig.sourcesRoot, sep)}`;
      execSync(cmd, { cwd, env });
    }
  },
};

module.exports = {
  babel,
};
