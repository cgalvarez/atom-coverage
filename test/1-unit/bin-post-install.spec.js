const { existsSync, readJSONSync, writeJSONSync } = require('fs-extra');
const { join } = require('path');
const _ = require('lodash');

// Testing utils/frameworks.
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
chai.use(sinonChai);

// Testing helpers (mocks/data).
const mock = require('../helpers/mock');

const cwd = process.cwd();
const initCwd = process.env.INIT_CWD;
const fakeCwd = join(cwd, 'fake');
const npmConfigPath = join(fakeCwd, 'package.json');
const uutAbspath = join(cwd, '..', 'bin', 'post-install.js');
const requireUUT = () => {
  require('../../bin/post-install');
};
const expectedNpmConfig = {
  scripts: {
    'test:coverage': 'atom-coverage',
    'check:coverage': 'nyc check-coverage',
  },
};

describe('UNIT TESTS: post-install script', () => {
  // beforeEach(requireUUT);
  afterEach(() => {
    process.env.INIT_CWD = initCwd;
    writeJSONSync(npmConfigPath, {});
    // We have to remove the UUT from the `require()` cache, or it will only be exec once.
    delete require.cache[uutAbspath];
  });

  it("should do nothing if it's post-install hook of `atom-coverage` itself", () => {
    process.env.INIT_CWD = cwd;
    // 3. Stub/spy same module functions/methods called by the UUT.
    // 4. Mock filesystem (if read/write operations present) ~> NONE.
    // 5. Test!
    requireUUT();
    // 6. Assertions.
    expect(existsSync(npmConfigPath)).to.be.true;
    const npmConfig = readJSONSync(npmConfigPath);
    expect(npmConfig).to.be.an('object').that.deep.equals({});
  });

  it('should do nothing if no package.json found', () => {
    process.env.INIT_CWD = join(cwd, 'custom', 'fake', 'folder');
    // 3. Stub/spy same module functions/methods called by the UUT.
    // 4. Mock filesystem (if read/write operations present) ~> NONE.
    // 5. Test!
    requireUUT();
    // 6. Assertions.
    expect(existsSync(join(process.env.INIT_CWD, 'package.json'))).to.be.false;
  });

  it('should add two new NPM scripts to package.json if not present: "test:coverage" and "check:coverage"', () => {
    process.env.INIT_CWD = fakeCwd;
    // 3. Stub/spy same module functions/methods called by the UUT.
    // 4. Mock filesystem (if read/write operations present) ~> NONE.
    // 5. Test!
    requireUUT();
    // 6. Assertions.
    expect(existsSync(npmConfigPath)).to.be.a('boolean').to.be.true;
    const npmConfig = readJSONSync(npmConfigPath);
    expect(npmConfig).to.be.an('object').that.deep.equals(expectedNpmConfig);
  });

  const existingScript = {
    'test:coverage': 'another-cmd',
    'check:coverage': 'another-check',
  };
  _.forEach(existingScript, (cmd, script) => {
    it(`should not add the NPM script "${script}" to package.json if present`, () => {
      process.env.INIT_CWD = fakeCwd;
      // 3. Stub/spy same module functions/methods called by the UUT.
      // 4. Mock filesystem (if read/write operations present) ~> NONE.
      const existingNpmConfig = { scripts: {} };
      existingNpmConfig.scripts[script] = cmd;
      writeJSONSync(npmConfigPath, existingNpmConfig, { spaces: 2 });
      const partiallyChangedNpmConfig = _.defaultsDeep({}, existingNpmConfig, expectedNpmConfig);
      // 5. Test!
      requireUUT();
      // 6. Assertions.
      expect(existsSync(npmConfigPath)).to.be.a('boolean').to.be.true;
      const npmConfig = readJSONSync(npmConfigPath);
      expect(npmConfig).to.be.an('object').that.deep.equals(partiallyChangedNpmConfig);
    });
  });

  it('should not modify package.json if all scripts present', () => {
    process.env.INIT_CWD = fakeCwd;
    // 3. Stub/spy same module functions/methods called by the UUT.
    // 4. Mock filesystem (if read/write operations present) ~> NONE.
    writeJSONSync(npmConfigPath, expectedNpmConfig, { spaces: 2 });
    // 5. Test!
    requireUUT();
    // 6. Assertions.
    expect(existsSync(npmConfigPath)).to.be.a('boolean').to.be.true;
    const npmConfig = readJSONSync(npmConfigPath);
    expect(npmConfig).to.be.an('object').that.deep.equals(expectedNpmConfig);
  });
});
