const { isAbsolute, join, sep } = require('path');
const fsMock = require('mock-fs');
const proxyquire = require('proxyquire');
const _ = require('lodash');

const cwd = process.cwd();

// Filesystem.
const localFiles = (files = {}) => {
  const fakeFS = {};
  _.forEach(files, (contents, filename) => {
    const filepath = isAbsolute(filename) ? filename : join(cwd, filename);
    fakeFS[filepath] = contents;
  });
  fsMock(fakeFS);
};

const restore = () => fsMock.restore();

const setupSandbox = (uutPath, proxyquireStubs, key) => {
  let uut;
  if (proxyquireStubs) {
    uut = proxyquire(uutPath, proxyquireStubs);
  } else {
    uut = require(uutPath);
  }
  if (_.isObject(uut) && !key) {
    const autoKey = uutPath.split(sep).pop();
    if (_.has(uut, autoKey)) return uut[autoKey];
  }
  return key ? uut[key] : uut;
};

const restoreSandbox = (spy, stub) => {
  // Restore filesystem.
  restore();
  // Restore spies.
  if (spy && Object.keys(spy).length) {
    Object.keys(spy).forEach((spied) => {
      if (_.isPlainObject(spy[spied])) {
        restoreSandbox(spy[spied]);
      } else if (spy[spied].restore) {
        spy[spied].restore();
      }
    });
    // eslint-disable-next-line no-param-reassign
    spy = undefined;
  }
  // Restore spies.
  if (stub && Object.keys(stub).length) {
    Object.keys(stub).forEach((stubbed) => {
      if (_.isPlainObject(stub[stubbed])) {
        restoreSandbox(undefined, stub[stubbed]);
      } else if (stub[stubbed].restore) {
        stub[stubbed].restore();
      }
    });
    // eslint-disable-next-line no-param-reassign
    stub = undefined;
  }
};

const backupEnvVar = {};
const doEnvBackup = (envVar, value) => {
  if (_.has(process.env, envVar)) {
    backupEnvVar[envVar] = process.env[envVar];
  }
  process.env[envVar] = value;
};
const restoreEnvBackup = (envVar) => {
  delete process.env[envVar];
  if (!_.has(backupEnvVar, envVar)) return;
  process.env[envVar] = backupEnvVar[envVar];
};

module.exports = {
  env: {
    backup: doEnvBackup,
    restore: restoreEnvBackup,
  },
  fs: {
    localFiles,
    restore,
  },
  sandbox: {
    setup: setupSandbox,
    restore: restoreSandbox,
  },
};
