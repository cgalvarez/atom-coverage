// Helpers for configuration file.
// NOTE All mocked files will be located at ./test/ to avoid messing with this
//      package files, that's why the test command is executed from test/ folder,
//      but the user is meant to execute atom-coverage from its project root.
const configFilename = '.atom-coverage';
const defaultConfig = {
  instrumenter: 'nyc',
  transpiler: 'babel',
};
const goodConfigFiles = {
  JSON: [`${configFilename}.json`, configFilename],
  YAML: [`${configFilename}.yaml`, `${configFilename}.yml`],
};
const badConfigFiles = {
  JS: [`${configFilename}.js`, `${configFilename}rc.js`],
  JSON: [`${configFilename}rc`, `${configFilename}rc.json`],
  YAML: [`${configFilename}rc.yaml`, `${configFilename}rc.yml`],
};

// Babel mocks.
const babelDefaults = {
  env: {
    test: {
      plugins: ['istanbul'],
      sourceMaps: 'inline',
    },
  },
  presets: ['env'],
};

// nyc mocks.
const nycDefaults = {
  'exclude-after-remap': false,
  instrument: false,
  'source-map': false,
};

module.exports = {
  config: {
    atomCoverage: {
      commonOptions: ['instrumenter', 'transpiler'],
      defaults: defaultConfig,
      filenames: {
        default: configFilename,
        good: goodConfigFiles,
        bad: badConfigFiles,
      },
    },
    babel: {
      defaults: babelDefaults,
      filenames: {
        default: '.babelrc',
      },
    },
    nyc: {
      defaults: nycDefaults,
      filenames: {
        default: '.nycrc.json',
      },
      options: {
        bad: {
          'exclude-after-remap': true,
          instrument: true,
          'source-map': true,
        },
      },
    },
  },
};
