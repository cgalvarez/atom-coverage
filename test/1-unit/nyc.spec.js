// System modules & package deps.
const { existsSync, readJSONSync } = require('fs-extra');
const { join, sep } = require('path');
const crypto = require('crypto');
const glob = require('glob');
const _ = require('lodash');

// Testing utils/frameworks.
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
chai.use(sinonChai);

// Testing helpers (mocks/data).
const mock = require('../helpers/mock');
const data = require('../helpers/data');

// Variables & constants.
const cwd = process.cwd();
const expectedFilepath = join(cwd, '.nycrc.json');
let nyc;
let manager;
let spy;
let stub;

const requireUUT = (done, proxyquireStubs) => {
  // 1. Mock same module files required by the UUT with `proxyquire`.
  nyc = mock.sandbox.setup('../../lib/instrumenter/nyc', proxyquireStubs);
  // 2. Reset sandbox.
  nyc.config.filepath = undefined;
  nyc.config.modified = false;
  nyc.config.settings = undefined;
  if (done) done();
};

const restoreSandbox = () => mock.sandbox.restore(spy, stub);

const mockNycConfigFile = (customOptions = {}) => {
  const configFiles = {};
  configFiles[data.config.nyc.filenames.default] =
    JSON.stringify(_.defaultsDeep(customOptions, data.config.nyc.defaults), null, 2);
  mock.fs.localFiles(configFiles);
};

const setupAtomMochaSandbox = (done, proxyquireStubs) => {
  requireUUT(done, proxyquireStubs);

  // 3. Stub/spy same module functions/methods called by the UUT.
  const triggerMochaSuiteHook = cb => cb();
  const triggerMochaRunnerEvent = (evt, cb) => cb();
  spy = {
    mochaRunnerOn: sinon.spy(triggerMochaRunnerEvent),
    mochaSuiteBeforeAll: sinon.spy(triggerMochaSuiteHook),
  };
  global.AtomMocha = {
    mocha: {
      suite: {
        beforeAll: spy.mochaSuiteBeforeAll,
      },
    },
    runner: {
      on: spy.mochaRunnerOn,
    },
  };
  const sourcesRoot = join(cwd, 'lib') + sep;
  const instrumentedPath = join(cwd, '.instrumented');
  manager = {
    config: {
      sourcesRoot,
      instrumentedPath,
    },
    requireRoot: instrumentedPath,
  };
  nyc.config.settings = data.config.nyc.defaults;
  nyc.config.settings['temp-directory'] = '.nyc_output';

  // 4. Mock filesystem (if read/write operations present).
  const testFS = {};
  testFS[join(instrumentedPath, 'file1.js')] = 'module.exports = { do1: () => console.log("nothing1!"), }';
  testFS[join(instrumentedPath, 'subfolder', 'file2.js')] = 'module.exports = { do2: () => console.log("nothing2!"), }';
  mock.fs.localFiles(testFS);
};

describe('UNIT TESTS: nyc instrumenter', () => {
  describe('readConfig()', () => {
    afterEach(restoreSandbox);

    it('should parse contents of config file', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const utilStubs = {
        readConfig: () => {
          nyc.config.settings = _.cloneDeep(data.config.nyc.defaults);
        },
      };
      spy = {
        util: {
          readConfig: sinon.spy(utilStubs.readConfig),
        },
      };
      requireUUT(undefined, { '../util': spy.util });
      spy.nyc = { readConfig: sinon.spy(nyc, 'readConfig') };
      // 4. Mock filesystem (if read/write operations present) ~> .babelrc
      mockNycConfigFile();
      // 5. Test!
      nyc.config.filepath = join(cwd, data.config.nyc.filenames.default);
      nyc.readConfig();
      // 6. Assertions.
      expect(nyc.config).to.have.deep.property('settings', data.config.nyc.defaults);
      expect(spy.nyc.readConfig).to.have.been.calledOnce
        .and.have.been.calledWith()
        .and.have.returned()
        .and.have.not.thrown();
      expect(spy.util.readConfig).to.have.been.calledOnce;
    });

    it('should set empty settings if no config file found', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const utilStubs = {
        readConfig: () => {
          nyc.config.settings = {};
        },
      };
      spy = {
        util: {
          readConfig: sinon.spy(utilStubs.readConfig),
        },
      };
      requireUUT(undefined, { '../util': spy.util });
      spy.nyc = { readConfig: sinon.spy(nyc, 'readConfig') };
      // 4. Mock filesystem (if read/write operations present) ~> .babelrc
      // 5. Test!
      nyc.readConfig();
      // 6. Assertions.
      expect(nyc.config).to.have.deep.property('settings', {});
      expect(spy.nyc.readConfig).to.have.been.calledOnce
        .and.have.been.calledWith()
        .and.have.returned()
        .and.have.not.thrown();
      expect(spy.util.readConfig).to.have.been.calledOnce;
    });
  });

  describe('saveConfig()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { saveConfig: sinon.spy(nyc, 'saveConfig') };
    });

    afterEach(restoreSandbox);

    it('should save config file', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      mock.fs.localFiles({});
      nyc.config.filepath = expectedFilepath;
      nyc.config.settings = _.cloneDeep(data.config.nyc.defaults);
      // 5. Test!
      nyc.saveConfig();
      // 6. Assertions.
      expect(spy.saveConfig).to.have.been.calledOnce
        .and.returned().and.calledWith().and.have.not.thrown();
      expect(existsSync(expectedFilepath)).to.be.a('boolean').that.equals(true);
      expect(readJSONSync(expectedFilepath)).to.be.an('object')
        .that.deep.equals(data.config.nyc.defaults);
    });

    it('should create default config file if none present', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      mock.fs.localFiles({});
      nyc.config.settings = _.cloneDeep(data.config.nyc.defaults);
      // 5. Test!
      nyc.saveConfig();
      // 6. Assertions.
      expect(spy.saveConfig).to.have.been.calledOnce
        .and.returned().and.calledWith().and.have.not.thrown();
      expect(existsSync(expectedFilepath)).to.be.a('boolean').that.equals(true);
      expect(readJSONSync(expectedFilepath)).to.be.an('object')
        .that.deep.equals(data.config.nyc.defaults);
    });
  });

  describe('getOutputFolder()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { getOutputFolder: sinon.spy(nyc, 'getOutputFolder') };
    });

    afterEach(restoreSandbox);

    it('should throw if not initialized (with `ensureConfig()`)', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const badCall = () => nyc.getOutputFolder();
      // 6. Assertions.
      expect(badCall).to.throw();
      expect(spy.getOutputFolder).to.have.been.calledOnce
        .and.calledWith().and.have.thrown();
    });

    it('should return the `nyc` report dir', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const nycDefaultReportsDir = 'coverage';
      nyc.config.filepath = expectedFilepath;
      nyc.config.settings = _.cloneDeep(data.config.nyc.defaults);
      nyc.config.settings['report-dir'] = nycDefaultReportsDir;
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const outputFolder = nyc.getOutputFolder();
      // 6. Assertions.
      expect(spy.getOutputFolder).to.have.been.calledOnce
        .and.returned(nycDefaultReportsDir).and.calledWith().and.have.not.thrown();
      expect(outputFolder).to.be.a('string').that.equals(nycDefaultReportsDir);
    });
  });

  describe('run()', () => {
    beforeEach(() => {
      stub = { execSync: sinon.stub() };
      requireUUT(null, {
        child_process: {
          execSync: stub.execSync,
        },
      });
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { run: sinon.spy(nyc, 'run') };
    });

    afterEach(restoreSandbox);

    it('should invoke `nyc` cli', () => {
      // 3. Stub/spy same module functions/methods called by the UUT ~> NONE.
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      nyc.run();
      // 6. Assertions.
      expect(spy.run).to.have.been.calledOnce
        .and.returned().and.calledWith().and.have.not.thrown();
      expect(stub.execSync).to.have.been.calledOnce
        .and.calledWith('nyc npm test')
        .and.returned().and.have.not.thrown();
      const execSyncOpts = stub.execSync.args[0][1];
      expect(execSyncOpts).to.be.an('object').that.has.all.keys('cwd', 'env', 'stdio');
      expect(execSyncOpts).to.have.property('cwd', cwd);
      expect(execSyncOpts).to.have.property('stdio', 'inherit');
    });
  });

  describe('ensureConfig()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { ensureConfig: sinon.spy(nyc, 'ensureConfig') };
      stub = { saveConfig: sinon.stub(nyc, 'saveConfig').callsFake(_.noop) };
    });

    afterEach(restoreSandbox);

    it('should find config file and fetch config if not settings set', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      stub.readConfig = sinon.stub(nyc, 'readConfig').callsFake(() => {
        nyc.config.filepath = expectedFilepath;
        nyc.config.settings = _.cloneDeep(data.config.nyc.defaults);
        return data.config.nyc.defaults;
      });
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      nyc.ensureConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.ensureConfig).to.have.been.calledOnce
        .and.have.been.calledWith(data.config.atomCoverage.defaults)
        .and.have.returned()
        .and.have.not.thrown();
      expect(stub.readConfig).to.have.been.calledOnce
        .and.have.been.calledWith()
        .and.have.returned(data.config.nyc.defaults)
        .and.have.not.thrown();
    });

    it('should use existing settings if previously fetched', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy.readConfig = sinon.spy(nyc, 'readConfig');
      nyc.config.filepath = expectedFilepath;
      nyc.config.settings = _.cloneDeep(data.config.nyc.defaults);
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      nyc.ensureConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.ensureConfig).to.have.been.calledOnce
        .and.have.been.calledWith(data.config.atomCoverage.defaults)
        .and.have.returned()
        .and.have.not.thrown();
      expect(spy.readConfig).to.have.not.been.called;
    });

    ['exclude-after-remap', 'instrument', 'source-map'].forEach((option) => {
      it(`should set option \`${option}\` if missing`, () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        nyc.config.filepath = expectedFilepath;
        nyc.config.settings = _.cloneDeep(data.config.nyc.defaults);
        delete nyc.config.settings[option];
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        expect(nyc.config.settings).to.be.an('object').and.not.have.property(option);
        nyc.ensureConfig(data.config.atomCoverage.defaults);
        // 6. Assertions.
        expect(spy.ensureConfig).to.have.been.calledOnce
          .and.have.been.calledWith(data.config.atomCoverage.defaults)
          .and.have.returned()
          .and.have.not.thrown();
        expect(nyc.config.settings).to.be.an('object')
          .that.has.property(option, false);
        expect(nyc.config.modified).to.be.a('boolean').that.equals(true);
        expect(stub.saveConfig).to.have.not.been.called;
      });

      it(`should set option \`${option}\` if it does not have the required value`, () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        nyc.config.filepath = expectedFilepath;
        nyc.config.settings = _.cloneDeep(data.config.nyc.defaults);
        nyc.config.settings[option] = true;
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        nyc.ensureConfig(data.config.atomCoverage.defaults);
        // 6. Assertions.
        expect(spy.ensureConfig).to.have.been.calledOnce
          .and.have.been.calledWith(data.config.atomCoverage.defaults)
          .and.have.returned()
          .and.have.not.thrown();
        expect(nyc.config.settings).to.be.an('object')
          .that.has.property(option, false);
        expect(nyc.config.modified).to.be.a('boolean').that.equals(true);
        expect(stub.saveConfig).to.have.not.been.called;
      });

      it(`should not modify option \`${option}\` if it has the required value`, () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        nyc.config.filepath = expectedFilepath;
        nyc.config.settings = _.cloneDeep(data.config.nyc.defaults);
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        nyc.ensureConfig(data.config.atomCoverage.defaults);
        // 6. Assertions.
        expect(spy.ensureConfig).to.have.been.calledOnce
          .and.have.been.calledWith(data.config.atomCoverage.defaults)
          .and.have.returned()
          .and.have.not.thrown();
        expect(nyc.config.settings).to.be.an('object')
          .that.has.property(option, false);
        expect(nyc.config.modified).to.be.a('boolean').that.equals(false);
        expect(stub.saveConfig).to.have.not.been.called;
      });
    });

    it('should not save config to disk if requested but not modified', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      nyc.config.filepath = expectedFilepath;
      nyc.config.settings = _.cloneDeep(data.config.nyc.defaults);
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      nyc.ensureConfig(data.config.atomCoverage.defaults, true);
      // 6. Assertions.
      expect(nyc.config.modified).to.be.a('boolean').that.equals(false);
      expect(stub.saveConfig).to.have.not.been.called;
    });

    it('should save config to disk if requested and modified', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      nyc.config.filepath = expectedFilepath;
      nyc.config.settings = _.cloneDeep(data.config.nyc.defaults);
      delete nyc.config.settings.instrument;
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      nyc.ensureConfig(data.config.atomCoverage.defaults, true);
      // 6. Assertions.
      expect(nyc.config.modified).to.be.a('boolean').that.equals(true);
      expect(stub.saveConfig).to.have.been.calledOnce
        .and.have.been.calledWith()
        .and.have.returned()
        .and.have.not.thrown();
    });

    ['report-dir', 'temp-directory'].forEach((option) => {
      it(`should set default value for option \`${option}\` (if missing) only for internal use (not saved to disk)`, () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        nyc.config.filepath = expectedFilepath;
        nyc.config.settings = _.cloneDeep(data.config.nyc.defaults);
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        nyc.ensureConfig(data.config.atomCoverage.defaults, true);
        // 6. Assertions.
        expect(nyc.config.modified).to.be.a('boolean').that.equals(false);
        expect(stub.saveConfig).to.have.not.been.called;
        expect(nyc.config.settings).to.have.property('report-dir', 'coverage');
        expect(nyc.config.settings).to.have.property('temp-directory', '.nyc_output');
      });

      it(`should not set default value for option \`${option}\` if provided`, () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        const nycConfig = _.cloneDeep(data.config.nyc.defaults);
        nycConfig['report-dir'] = '.reports';
        nycConfig['temp-directory'] = '.reports/.nyc_output';
        nyc.config.filepath = expectedFilepath;
        nyc.config.settings = nycConfig;
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        nyc.ensureConfig(data.config.atomCoverage.defaults, true);
        // 6. Assertions.
        expect(nyc.config.modified).to.be.a('boolean').that.equals(false);
        expect(stub.saveConfig).to.have.not.been.called;
        expect(nyc.config.settings).to.deep.equal(nycConfig);
      });
    });
  });

  describe('trackCoverage()', () => {
    beforeEach(() => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      setupAtomMochaSandbox();
      spy.trackCoverage = sinon.spy(nyc, 'trackCoverage');
      stub = {
        getGlobsToCover: sinon.stub(nyc, 'getGlobsToCover'),
        subscribeToMochaRunnerEnd: sinon.stub(nyc, 'subscribeToMochaRunnerEnd'),
        testquire: sinon.stub(),
      };
      manager.testquire = stub.testquire;
    });

    afterEach(() => {
      restoreSandbox();
      delete global.AtomMocha;
    });

    it("should leverage mocha instance's hook method `beforeAll()` to hook into its runner's \"end\" event", () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      nyc.trackCoverage(manager);
      // 6. Assertions.
      expect(spy.mochaSuiteBeforeAll).to.have.been.calledOnce.and.returned();
      expect(spy.mochaSuiteBeforeAll.args[0][0]).to.be.a('function');
      expect(stub.subscribeToMochaRunnerEnd).to.have.been.calledOnce.and.returned();
      expect(stub.getGlobsToCover).to.have.not.been.called;
    });

    it('should cover only files inferred from `nyc`\'s "include" option', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const includedPath = join(cwd, '.instrumented', 'subfolder');
      nyc.config.settings.include = [includedPath];
      const globsToCover = ['subfolder/**/*.js'];
      stub.getGlobsToCover.callsFake(() => globsToCover);
      // 4. Mock filesystem (if read/write operations present) ~> done by `setupAtomMochaSandbox()`.
      // 5. Test!
      nyc.trackCoverage(manager);
      // 6. Assertions.
      expect(spy.mochaSuiteBeforeAll).to.have.been.calledOnce.and.returned();
      expect(spy.mochaSuiteBeforeAll.args[0][0]).to.be.a('function');
      expect(stub.subscribeToMochaRunnerEnd).to.have.been.calledOnce.and.returned();
      expect(stub.getGlobsToCover).to.have.been.calledOnce
        .and.have.been.calledWith(
          manager.config.sourcesRoot,
          manager.config.instrumentedPath,
          manager.requireRoot
        )
        .and.have.returned(globsToCover);
      expect(stub.testquire).to.have.been.calledOnce
        .and.have.been.calledWith(join('subfolder', 'file2.js'))
        .and.have.returned();
    });
  });

  describe('subscribeToMochaRunnerEnd()', () => {
    beforeEach(() => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      setupAtomMochaSandbox();
      spy.subscribeToMochaRunnerEnd = sinon.spy(nyc, 'subscribeToMochaRunnerEnd');
      stub = { collectCoverage: sinon.stub(nyc, 'collectCoverage').callsFake(_.noop) };
    });

    afterEach(() => {
      restoreSandbox();
      delete global.AtomMocha;
    });

    it('should subscribe to the mocha runner\'s "end" event', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      // 4. Mock filesystem (if read/write operations present) ~> done by `setupAtomMochaSandbox()`.
      // 5. Test!
      nyc.subscribeToMochaRunnerEnd();
      // 6. Assertions.
      expect(spy.mochaRunnerOn).to.have.been.calledOnce
        .and.have.been.calledWith('end').and.returned();
      expect(spy.mochaRunnerOn.args[0][1]).to.be.a('function');
      expect(stub.collectCoverage).to.have.been.calledOnce.and.calledWith().and.returned();
    });
  });

  describe('collectCoverage()', () => {
    beforeEach(() => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      setupAtomMochaSandbox();
      spy.collectCoverage = sinon.spy(nyc, 'collectCoverage');
    });

    afterEach(() => {
      restoreSandbox();
      delete global.AtomMocha;
    });

    it('should write to disk the collected coverage', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      if (!_.has(process.env, 'COVERAGE')) {
        // Running tests without coverage... we have to mock up the global coverage object!
        const fakeCoveredPath = './fake/covered/file/path.js';
        const coverageInfo = {};
        coverageInfo[fakeCoveredPath] = {
          path: fakeCoveredPath,
          hash: crypto.randomBytes(20).toString('hex'),
        };
        global.__coverage__ = coverageInfo; // eslint-disable-line no-underscore-dangle
      }
      // 4. Mock filesystem (if read/write operations present) ~> done by `setupAtomMochaSandbox()`.
      // 5. Test! Will use this package coverage...
      nyc.collectCoverage();
      // 6. Assertions.
      expect(spy.collectCoverage).to.have.been.calledOnce.and.calledWith().and.returned();
      const coverageTempDir = join(cwd, nyc.config.settings['temp-directory']);
      const coverageFiles = glob.sync(`${coverageTempDir}/**/*.json`);
      expect(coverageFiles).to.be.an('array').that.has.lengthOf(1);
      const coverageFileContent = readJSONSync(coverageFiles[0]);
      // eslint-disable-next-line no-underscore-dangle
      expect(coverageFileContent).to.be.an('object').that.deep.equals(global.__coverage__);
      // Reset sandbox.
      if (!_.has(process.env, 'COVERAGE')) {
        delete global.__coverage__; // eslint-disable-line no-underscore-dangle
      }
    });
  });

  describe('getGlobsToCover()', () => {
    beforeEach(() => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      setupAtomMochaSandbox();
      spy.getGlobsToCover = sinon.spy(nyc, 'getGlobsToCover');
    });

    afterEach(() => {
      restoreSandbox();
      delete global.AtomMocha;
    });

    it('should cover only files inferred from `nyc`\'s "include" option', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const includedPath = join(cwd, '.instrumented', 'subfolder');
      nyc.config.settings.include = [includedPath];
      const expectedGlobsToCover = ['subfolder/**/*.js'];
      // 4. Mock filesystem (if read/write operations present) ~> done by `setupAtomMochaSandbox()`.
      // 5. Test! Will use this package coverage...
      const globs = nyc.getGlobsToCover(
        manager.config.sourcesRoot,
        manager.config.instrumentedPath,
        manager.requireRoot // eslint-disable-line comma-dangle
      );
      // 6. Assertions.
      expect(spy.getGlobsToCover).to.have.been.calledOnce;
      expect(globs).to.be.an('array').that.deep.equals(expectedGlobsToCover);
      // Reset sandbox.
      delete nyc.config.settings.include;
    });

    it('should cover all files when `nyc`\'s "all" option equals `true`', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      nyc.config.settings.all = true;
      const expectedGlobsToCover = ['**/*.js'];
      // 4. Mock filesystem (if read/write operations present) ~> done by `setupAtomMochaSandbox()`.
      // 5. Test! Will use this package coverage...
      const globs = nyc.getGlobsToCover(
        manager.config.sourcesRoot,
        manager.config.instrumentedPath,
        manager.requireRoot // eslint-disable-line comma-dangle
      );
      // 6. Assertions.
      expect(spy.getGlobsToCover).to.have.been.calledOnce;
      expect(globs).to.be.an('array').that.deep.equals(expectedGlobsToCover);
      // Reset sandbox.
      delete nyc.config.settings.all;
    });

    it('should not transform glob patterns provided in `nyc`\'s "include" option', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const includedPath = join(cwd, '.instrumented', 'subfolder', '*.js');
      nyc.config.settings.include = [includedPath];
      const expectedGlobsToCover = ['subfolder/*.js'];
      // 4. Mock filesystem (if read/write operations present) ~> done by `setupAtomMochaSandbox()`.
      // 5. Test! Will use this package coverage...
      const globs = nyc.getGlobsToCover(
        manager.config.sourcesRoot,
        manager.config.instrumentedPath,
        manager.requireRoot // eslint-disable-line comma-dangle
      );
      // 6. Assertions.
      expect(spy.getGlobsToCover).to.have.been.calledOnce;
      expect(globs).to.be.an('array').that.deep.equals(expectedGlobsToCover);
      // Reset sandbox.
      delete nyc.config.settings.include;
    });
  });
});
