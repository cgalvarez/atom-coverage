const { join, sep } = require('path');
const { execSync } = require('child_process');
const { readJSONSync, writeJSONSync } = require('fs-extra');
const _ = require('lodash');
const glob = require('glob');

const cwd = process.cwd();

/**
 * Babel can act as both, transpiler and instrumenter, depending on the
 * coverage framework.
 *
 * @type {Object}
 */
const babel = {
  config: {
    filenamePattern: '.babelrc',
    filepath: undefined,
    modified: false,
    settings: undefined,
  },

  findConfigFile() {
    const files = glob.sync(this.config.filenamePattern);

    if (files.length === 0) {
      throw new Error(`No ${this.config.filenamePattern} file found.`);
    }

    this.config.filepath = join(cwd, files[0]);
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
    writeJSONSync(this.config.filepath, this.config.settings, { spaces: 2 });
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
      this.findConfigFile();
      this.readConfig();
    }

    // Use `env`.
    const preset = 'env';
    _.update(this.config.settings, 'presets', (value) => {
      if (!_.isArray(value)) {
        this.config.modified = true;
        return [preset];
      }

      if (!_.includes(value, preset)) {
        this.config.modified = true;
        value.push(preset);
      }

      return value;
    });

    switch (atomCoverage.instrumenter) {
      case 'nyc': {
        // `nyc` needs the source maps to remap from instrumented
        // (transpiled) back to the original source files.
        _.update(this.config.settings, 'env.test.sourceMaps', (value) => {
          if (value === 'inline' || value === 'both') return value;
          this.config.modified = true;
          return 'inline'; // Default value.
        });

        // `babel-plugin-istanbul` must be present and in the last position.
        const plugin = 'istanbul';
        _.update(this.config.settings, 'env.test.plugins', (value) => {
          // Missing or invalid value.
          if (!_.isArray(value)) {
            this.config.modified = true;
            return [plugin]; // Default value.
          }

          // `babel-plugin-istanbul` is missing.
          if (!_.includes(value, plugin)) {
            this.config.modified = true;
            value.push(plugin);
            return value;
          }

          if (_.last(value) === plugin) {
            return value;
          }

          // `babel-plugin-istanbul` is not the last plugin.
          this.config.modified = true;
          _.pull(value, plugin);
          value.push(plugin);
          return value;
        });

        if (this.config.modified && saveOnChange) {
          this.saveConfig();
        }

        break;
      }

      // This block should never be reached, since no unsupported instrumenters allowed by
      // `joi` checking/enforcing and each supported instrumenter should have its own case.
      default:
    }
  },

  /**
   * Babel can only transpile from ES6+ into ES5, so `lang` is irrelevant here.
   * Besides, it can do both tasks, transpile and instrument, if the user has
   * selected `nyc` has coverage tool.
   *
   * @param  {Object} config AtomCoverage settings.
   */
  transpile(atomCoverageConfig) {
    switch (atomCoverageConfig.instrumenter) {
      case 'nyc': {
        const env = _.pick(process.env, ['COVERAGE', 'NODE_ENV', 'PATH']);
        env.BABEL_ENV = 'test';
        const cmd = `babel -d ${atomCoverageConfig.instrumentedPath} `
          + `-q ${_.trimEnd(atomCoverageConfig.sourcesRoot, sep)}`;
        execSync(cmd, { cwd, env });
        break;
      }

      // This block should never be reached, since no unsupported instrumenters allowed
      // by `joi` checking/enforcing and each supported instrumenter should have its own case.
      default:
    }
  },
};

module.exports = {
  babel,
};
