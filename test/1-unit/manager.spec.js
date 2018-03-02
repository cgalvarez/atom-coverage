// System modules & package deps.
const { join, sep } = require('path');
const { safeDump } = require('js-yaml');
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
let manager;
let spy;
let stub;

const requireUUT = (done, proxyquireStubs = {}) => {
  // 1. Mock same module files required by the UUT with `proxyquire`.
  stub = {
    util: {
      envHas: sinon.stub(),
    },
    babel: {
      findConfigFile: sinon.stub(),
      ensureConfig: sinon.stub(),
      transpile: sinon.stub(),
    },
    nyc: {
      findConfigFile: sinon.stub(),
      ensureConfig: sinon.stub(),
      getOutputFolder: sinon.stub().returns('coverage'),
      trackCoverage: sinon.stub(),
      run: sinon.stub(),
    },
  };
  _.defaultsDeep(proxyquireStubs, {
    './instrumenter/nyc': { nyc: stub.nyc },
    './transpiler/babel': {
      babel: _.defaultsDeep({}, stub.babel, {
        config: {
          filepath: join(cwd, data.config.babel.filenames.default),
          settings: data.config.babel.defaults,
        },
      }),
    },
    './util': stub.util,
  });
  manager = mock.sandbox.setup('../../lib/manager', proxyquireStubs);
  // 2. Reset sandbox.
  manager.config = undefined;
  manager.requireRoot = undefined;
  manager.transpiler = undefined;
  manager.instrumenter = undefined;
  if (done) done();
};

const restoreSandbox = () => mock.sandbox.restore(spy, stub);

const mockConfigFile = (
  file = data.config.atomCoverage.filenames.default,
  format = 'JSON',
  customOptions = _.cloneDeep(data.config.atomCoverage.defaults)
) => {
  const configFiles = {};
  const options = _.defaultsDeep({}, customOptions);
  switch (format) {
    case 'JSON': configFiles[file] = JSON.stringify(options, null, 2); break;
    case 'YAML': configFiles[file] = safeDump(options); break;
    default: break;
  }
  mock.fs.localFiles(configFiles);
};

describe('UNIT TESTS: manager', () => {
  describe('readConfig()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { readConfig: sinon.spy(manager, 'readConfig') };
      stub.initConfig = sinon.stub(manager, 'initConfig').callsFake(_.noop);
    });

    afterEach(restoreSandbox);

    // Allowed config files.
    Object.keys(data.config.atomCoverage.filenames.good).forEach((format) => {
      data.config.atomCoverage.filenames.good[format].forEach((file) => {
        it(`should read settings from ${file} in ${format} format`, () => {
          // 4. Mock filesystem (if read/write operations present) ~> .atom-coverage
          mockConfigFile(file, format);
          // 5. Test!
          const readConfig = manager.readConfig();
          // 6. Assertions.
          expect(readConfig).to.be.an('object')
            .that.deep.equals(data.config.atomCoverage.defaults);
          expect(spy.readConfig).to.have.been.calledOnce;
          expect(stub.initConfig).to.have.been.calledOnce
            .and.calledWith().and.returned();
        });
      });
    });

    it('should read settings from entry "atomCoverage" in package.json', () => {
      // 4. Mock filesystem (if read/write operations present) ~> package.json
      mockConfigFile('package.json', 'JSON', {
        atomCoverage: data.config.atomCoverage.defaults,
      });
      // 5. Test!
      const readConfig = manager.readConfig();
      // 6. Assertions.
      expect(readConfig).to.be.an('object')
        .that.deep.equals(data.config.atomCoverage.defaults);
      expect(spy.readConfig).to.have.been.calledOnce;
      expect(stub.initConfig).to.have.been.calledOnce
        .and.calledWith().and.returned();
    });

    // Forbidden (and thus ignored) config files.
    Object.keys(data.config.atomCoverage.filenames.bad).forEach((format) => {
      data.config.atomCoverage.filenames.bad[format].forEach((file) => {
        it(`should NOT read settings from ${file} in ${format} format`, () => {
          // 4. Mock filesystem (if read/write operations present) ~> .atom-coverage
          mockConfigFile(file, format);
          // 5. Test!
          const readConfig = manager.readConfig();
          // 6. Assertions.
          expect(readConfig).to.be.null;
          expect(spy.readConfig).to.have.been.calledOnce;
          expect(stub.initConfig).to.have.been.calledOnce
            .and.calledWith().and.returned();
        });
      });
    });

    // Check that recursive searching upwards is disabled.
    it('should search only in current directory (not upwards)', () => {
      // 4. Mock filesystem (if read/write operations present) ~> ../.atom-coverage
      mockConfigFile(join('..', data.config.atomCoverage.filenames.default));
      // 5. Test!
      const readConfig = manager.readConfig();
      // 6. Assertions.
      expect(readConfig).to.be.null;
      expect(spy.readConfig).to.have.been.calledOnce;
      expect(stub.initConfig).to.have.been.calledOnce
        .and.calledWith().and.returned();
    });

    const valid = {
      transpiler: ['babel'],
      instrumenter: ['nyc'],
    };
    Object.keys(valid).forEach((type) => {
      valid[type].forEach((toTest) => {
        it(`should accept ${toTest} as a supported ${type}`, () => {
          // 4. Mock filesystem (if read/write operations present) ~> .atom-coverage
          const atomCoverageConfig = _.cloneDeep(data.config.atomCoverage.defaults);
          atomCoverageConfig[type] = toTest;
          mockConfigFile(undefined, undefined, atomCoverageConfig);
          // 5. Test!
          const readConfig = manager.readConfig();
          // 6. Assertions.
          expect(readConfig).to.be.an('object').that.deep.equals(atomCoverageConfig);
          expect(spy.readConfig).to.have.been.calledOnce;
          expect(stub.initConfig).to.have.been.calledOnce
            .and.calledWith().and.returned();
        });
      });
    });

    const invalid = {
      transpiler: ['typescript'],
      instrumenter: ['blanket'],
    };
    Object.keys(invalid).forEach((type) => {
      invalid[type].forEach((toTest) => {
        it(`should throw for unsupported ${type} ${toTest}`, () => {
          // 4. Mock filesystem (if read/write operations present) ~> .atom-coverage
          const atomCoverageConfig = _.cloneDeep(data.config.atomCoverage.defaults);
          atomCoverageConfig[type] = toTest;
          mockConfigFile(undefined, undefined, atomCoverageConfig);
          // 5. Test!
          const unsupported = () => manager.readConfig();
          // 6. Assertions.
          expect(unsupported).to.throw();
          expect(spy.readConfig).to.have.been.called;
          expect(stub.initConfig).to.have.not.been.called.and.have.thrown();
        });
      });
    });

    it('should throw on unsupported options', () => {
      // 4. Mock filesystem (if read/write operations present) ~> .atom-coverage
      const atomCoverageConfig = _.cloneDeep(data.config.atomCoverage.defaults);
      atomCoverageConfig.nonApiOption = 'unsupported';
      mockConfigFile(undefined, undefined, atomCoverageConfig);
      // 5. Test!
      const badOption = () => manager.readConfig();
      // 6. Assertions.
      expect(badOption).to.throw();
      expect(spy.readConfig).to.have.been.calledOnce;
      expect(stub.initConfig).to.have.not.been.called;
    });
  });

  describe('getConfig()', () => {
    it('should return the current config on demand', () => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { getConfig: sinon.spy(manager, 'getConfig') };
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      mockConfigFile();
      // 5. Test!
      manager.config = _.cloneDeep(data.config.atomCoverage.defaults);
      const returnedConfig = manager.getConfig();
      // 6. Assertions.
      expect(returnedConfig).to.be.an('object')
        .that.deep.equals(data.config.atomCoverage.defaults);
      expect(spy.getConfig).to.have.been.calledOnce;
      // Restore sandbox.
      restoreSandbox();
    });
  });

  describe('initConfig()', () => {
    beforeEach(() => {
      const stubGlobSync = sinon.stub();
      requireUUT(undefined, {
        glob: { sync: stubGlobSync },
      });
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { initConfig: sinon.spy(manager, 'initConfig') };
      stub.globSync = stubGlobSync;
    });

    afterEach(restoreSandbox);

    it('should use defaults if no settings found in config file or package.json', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const sourcesRoot = 'lib';
      const expectedSourcesRoot = sourcesRoot + sep;
      stub.globSync.onFirstCall().returns([expectedSourcesRoot]);
      const expectedSettings = _.defaultsDeep(
        { sourcesRoot: expectedSourcesRoot },
        data.config.atomCoverage.defaults
      );
      // 4. Mock filesystem (if read/write operations present) ~> sources root.
      mock.fs.localFiles(_.set({}, join(cwd, sourcesRoot), {}));
      // 5. Test!
      manager.initConfig();
      // 6. Assertions.
      expect(manager).to.have.property('config').that.includes(expectedSettings);
      expect(spy.initConfig).to.have.been.calledOnce;
      expect(stub.globSync).to.have.been.calledOnce;
    });

    it('should throw if no sources found at common locations (`lib/` or `src/`)', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const badCall = () => manager.initConfig();
      // 6. Assertions.
      expect(badCall).to.throw();
      expect(spy.initConfig).to.have.been.calledOnce.and.have.thrown();
    });

    ['lib', 'src'].forEach((sourcesRoot) => {
      it(`should fetch the root for source files of the project if placed under \`${sourcesRoot}/\``, () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        const expectedSourcesRoot = sourcesRoot + sep;
        stub.globSync.onFirstCall().returns([expectedSourcesRoot]);
        // 4. Mock filesystem (if read/write operations present) ~> sources root.
        const sourcesPath = join(cwd, sourcesRoot);
        mock.fs.localFiles(_.set({}, sourcesPath, {}));
        // 5. Test!
        manager.config = _.cloneDeep(data.config.atomCoverage.defaults);
        manager.initConfig();
        // 6. Assertions.
        expect(manager).to.have.nested.property('config.sourcesRoot', expectedSourcesRoot);
        expect(spy.initConfig).to.have.been.calledOnce.and.calledWith().and.returned();
        expect(stub.globSync).to.have.been.calledOnce.and.calledWith('@(lib|src)/');
      });
    });

    it('should reuse the root for source files when provided through config file', () => {
      // 4. Mock filesystem (if read/write operations present) ~> sources root.
      // 5. Test!
      const customSourcesRoot = 'other/';
      manager.config = _.defaultsDeep(
        { sourcesRoot: customSourcesRoot },
        data.config.atomCoverage.defaults
      );
      expect(manager).to.have.nested.property('config.sourcesRoot', customSourcesRoot);
      manager.initConfig();
      // 6. Assertions.
      expect(manager).to.have.nested.property('config.sourcesRoot', customSourcesRoot);
      expect(spy.initConfig).to.have.been.calledOnce.and.calledWith().and.returned();
      expect(stub.globSync).to.have.not.been.called;
    });

    const unsupported = {
      transpiler: {
        supported: 'babel',
        unsupported: 'coffeescript',
      },
      instrumenter: {
        supported: 'nyc',
        unsupported: 'blanket',
      },
    };
    Object.keys(unsupported).forEach((type) => {
      const toTest = unsupported[type];
      it(`should throw on unsupported ${type}`, () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        const expectedConfig = _.defaultsDeep(
          { sourcesRoot: 'lib/' },
          data.config.atomCoverage.defaults
        );
        expectedConfig[type] = toTest.unsupported;
        manager.config = expectedConfig;
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        const badCall = () => manager.initConfig();
        // 6. Assertions.
        expect(badCall).to.throw(`Unsupported ${type}`);
        expect(spy.initConfig).to.have.been.calledOnce.and.have.thrown();
        expect(stub.globSync).to.have.not.been.called;
      });

      it(`should use the ${toTest.supported} ${type} and inherit option "saveOnChange" on initialization`, () => {
        [undefined, false, true].forEach((saveOnChange) => {
          // 3. Stub/spy same module functions/methods called by the UUT.
          const expectedConfig = _.defaultsDeep(
            { sourcesRoot: 'lib/' },
            data.config.atomCoverage.defaults
          );
          manager.config = expectedConfig;
          // 4. Mock filesystem (if read/write operations present) ~> NONE
          // 5. Test!
          manager.initConfig(saveOnChange);
          // 6. Assertions.
          expect(stub.globSync).to.have.not.been.called;
          if (saveOnChange === undefined) {
            expect(stub[toTest.supported].ensureConfig).to.have.been.called
              .and.been.calledWith(expectedConfig, false).and.have.returned();
          } else {
            expect(stub[toTest.supported].ensureConfig).to.have.been.called
              .and.been.calledWith(expectedConfig, saveOnChange).and.have.returned();
          }
        });
        expect(spy.initConfig).to.have.been.calledThrice;
      });
    });

    it('should calc the folder for instrumented files if not provided', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const defaultNycOutputFolder = 'coverage';
      const expectedInstrumentedPath = join(defaultNycOutputFolder, '.instrumented');
      manager.config = _.defaultsDeep(
        { sourcesRoot: 'lib/' },
        data.config.atomCoverage.defaults
      );
      // 4. Mock filesystem (if read/write operations present) ~> sources root.
      // 5. Test!
      manager.initConfig();
      // 6. Assertions.
      expect(manager).to.have.nested.property('config.instrumentedPath', expectedInstrumentedPath);
      expect(spy.initConfig).to.have.been.calledOnce.and.calledWith().and.returned();
      expect(stub.globSync).to.have.not.been.called;
      expect(stub.nyc.getOutputFolder).to.have.been.calledOnce.and.have.calledWith();
    });

    it('should calc the folder for instrumented files based on custom output folder', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const defaultNycOutputFolder = '.reports';
      const expectedInstrumentedPath = join(defaultNycOutputFolder, '.instrumented');
      stub.nyc.getOutputFolder.onFirstCall().returns(defaultNycOutputFolder);
      manager.config = _.defaultsDeep(
        { sourcesRoot: 'lib/' },
        data.config.atomCoverage.defaults
      );
      // 4. Mock filesystem (if read/write operations present) ~> sources root.
      // 5. Test!
      manager.initConfig();
      // 6. Assertions.
      expect(manager).to.have.nested.property('config.instrumentedPath', expectedInstrumentedPath);
      expect(spy.initConfig).to.have.been.calledOnce.and.calledWith().and.returned();
      expect(stub.globSync).to.have.not.been.called;
      expect(stub.nyc.getOutputFolder).to.have.been.calledOnce.and.have.calledWith();
    });

    it('should use the instrumented path when provided', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const expectedConfig = _.defaultsDeep(
        {
          sourcesRoot: 'lib/',
          instrumentedPath: '.instrumented',
        },
        data.config.atomCoverage.defaults
      );
      manager.config = _.cloneDeep(expectedConfig);
      // 4. Mock filesystem (if read/write operations present) ~> sources root.
      // 5. Test!
      manager.initConfig();
      // 6. Assertions.
      expect(manager).to.have.nested.property('config.instrumentedPath', expectedConfig.instrumentedPath);
      expect(spy.initConfig).to.have.been.calledOnce.and.calledWith().and.returned();
      expect(stub.globSync).to.have.not.been.called;
      expect(stub.nyc.getOutputFolder).to.have.not.been.called;
    });

    it('should use the instrumented path as root for local `require()`s if coverage requested', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      stub.util.envHas.onFirstCall().returns(true);
      const expectedConfig = _.defaultsDeep(
        {
          sourcesRoot: 'lib/',
          instrumentedPath: '.instrumented',
        },
        data.config.atomCoverage.defaults
      );
      manager.config = _.cloneDeep(expectedConfig);
      // 4. Mock filesystem (if read/write operations present) ~> sources root.
      // 5. Test!
      manager.initConfig();
      // 6. Assertions.
      expect(manager).to.have.property('requireRoot', expectedConfig.instrumentedPath);
      expect(spy.initConfig).to.have.been.calledOnce.and.calledWith().and.returned();
      expect(stub.globSync).to.have.not.been.called;
      expect(stub.nyc.getOutputFolder).to.have.not.been.called;
      expect(stub.util.envHas).to.have.been.calledOnce.and.calledWith('COVERAGE');
    });

    it('should use the sources root as root for local `require()`s if no coverage requested', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      stub.util.envHas.onFirstCall().returns(false);
      const expectedConfig = _.defaultsDeep(
        {
          sourcesRoot: 'lib/',
          instrumentedPath: '.instrumented',
        },
        data.config.atomCoverage.defaults
      );
      manager.config = _.cloneDeep(expectedConfig);
      // 4. Mock filesystem (if read/write operations present) ~> sources root.
      // 5. Test!
      manager.initConfig();
      // 6. Assertions.
      expect(manager).to.have.property('requireRoot', expectedConfig.sourcesRoot);
      expect(spy.initConfig).to.have.been.calledOnce.and.calledWith().and.returned();
      expect(stub.globSync).to.have.not.been.called;
      expect(stub.nyc.getOutputFolder).to.have.not.been.called;
      expect(stub.util.envHas).to.have.been.calledOnce.and.calledWith('COVERAGE');
    });
  });

  describe('testquire()', () => {
    it('should return filepath if coverage requested but file not required', () => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { testquire: sinon.spy(manager, 'testquire') };
      manager.requireRoot = '.instrumented';
      // 4. Mock filesystem (if read/write operations present) ~> sources root.
      const fakeModules = {};
      fakeModules[join(cwd, manager.requireRoot, 'fake.js')] = '';
      mock.fs.localFiles(fakeModules);
      // 5. Test!
      const filepath = manager.testquire('./fake', false);
      // 6. Assertions.
      expect(spy.testquire).to.have.been.calledOnce;
      expect(filepath).to.be.a('string').that.equals(join('..', manager.requireRoot, 'fake'));
      // Restore sandbox.
      restoreSandbox();
    });
  });

  describe('trackCoverage()', () => {
    it('should invoke the registered instrumenter\'s `trackCoverage`', () => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { trackCoverage: sinon.spy(manager, 'trackCoverage') };
      manager.instrumenter = stub.nyc;
      manager.config = _.cloneDeep(data.config.atomCoverage.defaults);
      // 4. Mock filesystem (if read/write operations present) ~> NONE.
      // 5. Test!
      manager.trackCoverage();
      // 6. Assertions.
      expect(spy.trackCoverage).to.have.been.calledOnce;
      expect(stub.nyc.trackCoverage).to.have.been.calledOnce
        .and.have.returned().and.have.been.calledWith();
      // Restore sandbox.
      restoreSandbox();
    });
  });

  describe('runTestsWithCoverage()', () => {
    // eslint-disable-next-line mocha/no-hooks-for-single-case
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { runTestsWithCoverage: sinon.spy(manager, 'runTestsWithCoverage') };
    });

    // eslint-disable-next-line mocha/no-hooks-for-single-case
    afterEach(restoreSandbox);

    // Test a variety of combos: transpiler ~> instrumenter.
    const validCombo = {
      babel: ['nyc'],
    };
    Object.keys(validCombo).forEach((transpiler) => {
      validCombo[transpiler].forEach((instrumenter) => {
        it(`should transpile (${transpiler}) ~> instrument/cover tests with \`${instrumenter}\``, () => {
          // 3. Stub/spy same module functions/methods called by the UUT.
          const testScript = 'custom-script';
          manager.transpiler = stub[transpiler];
          manager.instrumenter = stub[instrumenter];
          manager.config = _.cloneDeep(data.config.atomCoverage.defaults);
          manager.config.transpiler = transpiler;
          manager.config.testScript = testScript;
          // 5. Test!
          manager.runTestsWithCoverage();
          // 6. Assertions.
          expect(stub.babel.transpile).to.have.been.calledOnce
            .and.have.been.calledWith().and.have.returned();
          expect(stub.nyc.run).to.have.been.calledOnce
            .and.have.been.calledWith(testScript).and.have.returned();
        });
      });
    });
  });
});
