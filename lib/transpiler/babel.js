// eslint-disable-next-line security/detect-child-process
const { execSync } = require('child_process');
const { sep } = require('path');
const { readConfig, writeConfig } = require('../util');
const _ = require('lodash');

const cwd = process.cwd();
const NOT_FOUND = -1;
const PREFIX_LENGTH = 'env.test.'.length;

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

  /**
   * @summary Fetches configuration for `babel` from any config file found.
   */
  readConfig() {
    readConfig.call(this.config, configFile.pattern, 'json');
  },

  /**
   * @summary Saves `babel` configuration to config file.
   */
  saveConfig() {
    writeConfig(this.config.filepath || configFile.default, this.config.settings, 'json');
  },

  /**
   * Ensures the babel configuration file `.babelrc` contains the minimum
   * configuration required for this package to work properly (to some extent).
   *
   * @param {Object}  atomCoverage         AtomCoverage settings.
   * @param {Boolean} [saveOnChange=false] Whether to write changes to config file on change.
   */
  enforceConfig(atomCoverage, saveOnChange = false) {
    if (!this.config.settings) {
      this.readConfig();
    }

    this.enforcePresetEnv();

    if (atomCoverage.instrumenter === 'nyc') {
      this.setupForNyc();
    }

    if (this.config.filepath && (!this.config.modified || !saveOnChange)) {
      return;
    }

    this.saveConfig();
    this.config.modified = false;
  },

  /**
   * @summary Sets a Babel option
   * @param   {String}  path  The path to the option to set.
   * @param   {any}     value The value to set.
   */
  setOption(path, value) {
    this.config.modified = true;
    _.set(this.config.settings, path, value);
  },

  /**
   * @summary Enforces using the `env` preset with Babel.
   */
  enforcePresetEnv() { // eslint-disable-line consistent-return
    const required = 'env';
    const path = 'presets';
    const presets = _.get(this.config.settings, path);

    // Invalid/unexpected value.
    if (!_.isArray(presets)) return this.setOption(path, [required]);

    const found = this.findAddon(presets, 'preset', required);

    // Malformed presets.
    if (found === undefined) return this.setOption(path, [required]);

    // Preset is missing.
    if (found.index === NOT_FOUND) return this.setOption(path, presets.concat(required));
  },

  /**
   * @summary Sets `babel` up to work properly with `nyc`.
   */
  setupForNyc() {
    this.enforceSourceMaps();
    this.enforcePluginIstanbul();
  },

  /**
   * `nyc` needs the source maps to remap from instrumented (transpiled) back
   * to the original source files.
   *
   * @param  {String} [sourceMaps] The value of babel option "sourceMaps".
   * @return {String}              The value to set ("inline" or "both").
   */
  enforceSourceMaps() {
    const path = 'env.test.sourceMaps';
    const babelConfig = this.config.settings;
    let sourceMaps = _.get(babelConfig, path);

    // Valid config.
    if (sourceMaps === 'inline' || sourceMaps === 'both') return;

    this.config.modified = true;
    // eslint-disable-next-line no-param-reassign
    sourceMaps = this.inheritGeneralConfig(path);
    if (sourceMaps === 'inline' || sourceMaps === 'both') {
      _.set(babelConfig, path, sourceMaps);
      return;
    }

    _.set(babelConfig, path, 'inline'); // Default value.
  },

  /**
   * @summary Inherits the Babel global config if present.
   * @param   {String} path The path to globalize and fetch.
   * @return  {any}         The found value (`undefined` if missing).
   */
  inheritGeneralConfig(path) {
    // Remove prefix "env.test." and fetch general config if present.
    return _.get(this.config.settings, path.substr(PREFIX_LENGTH));
  },

  /**
   * @summary Enforces `babel-plugin-istanbul` to be present and in the last position.
   */
  enforcePluginIstanbul() { // eslint-disable-line consistent-return
    const pluginShortName = 'istanbul';
    const path = 'env.test.plugins';
    let plugins = _.get(this.config.settings, path);
    const isInvalid = collection => (_.isNil(collection) || !_.isArray(collection));

    // If not specified, try to inherit global config.
    plugins = isInvalid(plugins) ? this.inheritGeneralConfig(path) : plugins;

    // Invalid/unexpected value.
    if (isInvalid(plugins)) return this.setOption(path, [pluginShortName]);

    const found = this.findAddon(plugins, 'plugin', pluginShortName);

    // Malformed option.
    if (found === undefined) {
      return this.setOption(path, [pluginShortName]);
    }

    // Plugin is missing.
    if (found.index === NOT_FOUND) {
      return this.setOption(path, plugins.concat(pluginShortName));
    }

    // Plugin is not in last position.
    if (found.index < plugins.length - 1) {
      const plugin = _.pullAt(plugins, found.index);
      return this.setOption(path, plugins.concat(plugin));
    }
  },

  /**
   * @summary Finds the addon of `type` with `name` in the provided `collection`.
   * @param  {Object[]|String[]} collection The collection to iterate.
   * @param  {String}            type       The addon type (`plugin` or `preset`).
   * @param  {String}            name       The addon name.
   * @return {Object}                       Keys: `index` and `shorthand` (boolean).
   * @see https://babeljs.io/docs/plugins/#pluginpreset-shorthand
   * @see https://babeljs.io/docs/plugins/#pluginpreset-options
   */
  findAddon(collection, type, name) {
    const longName = `babel-${type}-${name}`;
    let found = { index: -1 };

    // eslint-disable-next-line you-dont-need-lodash-underscore/for-each, consistent-return
    _.forEach(collection, (addon, index) => {
      // eslint-disable-next-line security/detect-object-injection
      const isArray = _.isArray(addon);
      const isValid = _.isString(addon) || isArray;

      if (!isValid) {
        found = undefined;
        return false;
      }

      if (isArray) [addon] = addon; // eslint-disable-line no-param-reassign
      if (addon === name || addon === longName) {
        found = { index, shorthand: (addon === name) };
        return false;
      }
    });

    return found;
  },

  /**
   * Babel can only transpile from ES6+ into ES5.
   * Besides, it can do both tasks, transpile and instrument, if the user has
   * selected `nyc` has coverage tool through the plugin `babel-plugin-istanbul`.
   *
   * @param {Object} config AtomCoverage settings.
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
