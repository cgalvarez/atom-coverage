const { join } = require('path');
const { existsSync, readJSONSync, writeJSONSync } = require('fs-extra');
const _ = require('lodash');

const setupNpmConfig = () => {
  if (!process.env.INIT_CWD
    || process.env.INIT_CWD === process.cwd()
  ) {
    return;
  }

  const packageJSONPath = join(process.env.INIT_CWD, 'package.json');
  if (!existsSync(packageJSONPath)) return;
  const packageJSON = readJSONSync(packageJSONPath);

  let modified = false;

  const scripts = {
    'test:coverage': 'atom-coverage',
    'check:coverage': 'nyc check-coverage',
  };
  Object.keys(scripts).forEach((name) => {
    _.update(packageJSON, `scripts.${name}`, (v) => {
      if (v) return v;
      modified = true;
      // eslint-disable-next-line security/detect-object-injection
      return scripts[name]; // Fixed keys, not from user.
    });
  });

  if (modified) {
    writeJSONSync(packageJSONPath, packageJSON, { spaces: 2 });
  }
};

setupNpmConfig();
