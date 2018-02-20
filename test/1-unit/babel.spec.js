// System modules & package deps.
const { existsSync, readJSONSync } = require('fs-extra');
const { join, sep } = require('path');
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
const defaultConfigFile = '.babelrc';
const expectedFilepath = join(cwd, defaultConfigFile);
const noop = () => {};
let babel;
let spy;
let stub;

const requireUUT = (done, proxyquireStubs) => {
  // 1. Mock same module files required by the UUT with `proxyquire`.
  babel = mock.sandbox.setup('../../lib/transpiler/babel', proxyquireStubs);
  // 2. Reset sandbox.
  babel.config.filepath = undefined;
  babel.config.modified = false;
  babel.config.settings = undefined;
  if (done) done();
};

const restoreSandbox = () => mock.sandbox.restore(spy, stub);

describe('UNIT TESTS: babel transpiler', () => {
  describe('readConfig()', () => {
    afterEach(restoreSandbox);

    it('should parse contents of config file', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const utilStubs = {
        readConfig: () => _.cloneDeep(data.config.babel.defaults),
        findConfigFile: () => defaultConfigFile,
      };
      spy = {
        util: {
          readConfig: sinon.spy(utilStubs.readConfig),
          findConfigFile: sinon.spy(utilStubs.findConfigFile),
        },
      };
      requireUUT(undefined, { '../util': spy.util });
      spy.babel = { readConfig: sinon.spy(babel, 'readConfig') };
      // 4. Mock filesystem (if read/write operations present) ~> .babelrc
      // 5. Test!
      babel.readConfig();
      // 6. Assertions.
      expect(babel.config).to.have.property('settings')
        .that.is.an('object').and.deep.equal(data.config.babel.defaults);
      expect(spy.babel.readConfig).to.have.been.calledOnce
        .and.have.been.calledWith()
        .and.have.returned()
        .and.have.not.thrown();
      expect(spy.util.findConfigFile).to.have.been.calledOnce;
      expect(spy.util.readConfig).to.have.been.calledOnce;
    });

    it('should set empty settings if no config file found', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const utilStubs = {
        readConfig: () => undefined,
        findConfigFile: () => undefined,
      };
      spy = {
        util: {
          readConfig: sinon.spy(utilStubs.readConfig),
          findConfigFile: sinon.spy(utilStubs.findConfigFile),
        },
      };
      requireUUT(undefined, { '../util': spy.util });
      spy.babel = { readConfig: sinon.spy(babel, 'readConfig') };
      // 4. Mock filesystem (if read/write operations present) ~> .babelrc
      // 5. Test!
      babel.readConfig();
      // 6. Assertions.
      expect(babel.config).to.have.deep.property('settings', {});
      expect(spy.babel.readConfig).to.have.been.calledOnce
        .and.have.been.calledWith()
        .and.have.returned()
        .and.have.not.thrown();
      expect(spy.util.findConfigFile).to.have.been.calledOnce;
      expect(spy.util.readConfig).to.have.not.been.called;
    });
  });

  describe('saveConfig()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { saveConfig: sinon.spy(babel, 'saveConfig') };
    });

    afterEach(restoreSandbox);

    it('should save config file', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      mock.fs.localFiles({});
      babel.config.filepath = expectedFilepath;
      babel.config.settings = _.cloneDeep(data.config.babel.defaults);
      // 5. Test!
      babel.saveConfig();
      // 6. Assertions.
      expect(spy.saveConfig).to.have.been.calledOnce
        .and.returned().and.calledWith().and.have.not.thrown();
      expect(existsSync(expectedFilepath)).to.be.a('boolean').that.equals(true);
      expect(readJSONSync(expectedFilepath)).to.be.an('object')
        .that.deep.equals(data.config.babel.defaults);
    });

    it('should create default config file if none present', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      mock.fs.localFiles({});
      babel.config.settings = _.cloneDeep(data.config.babel.defaults);
      // 5. Test!
      babel.saveConfig();
      // 6. Assertions.
      expect(spy.saveConfig).to.have.been.calledOnce
        .and.returned().and.calledWith().and.have.not.thrown();
      expect(existsSync(expectedFilepath)).to.be.a('boolean').that.equals(true);
      expect(readJSONSync(expectedFilepath)).to.be.an('object')
        .that.deep.equals(data.config.babel.defaults);
    });
  });

  describe('ensureConfig()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { ensureConfig: sinon.spy(babel, 'ensureConfig') };
      stub = { saveConfig: sinon.stub(babel, 'saveConfig').callsFake(noop) };
    });

    afterEach(restoreSandbox);

    it('should find config file and fetch config if not settings set', () => {
      stub.readConfig = sinon.stub(babel, 'readConfig').callsFake(() => {
        babel.config.filepath = expectedFilepath;
        babel.config.settings = _.cloneDeep(data.config.babel.defaults);
        return babel.config.settings; // data.config.babel.defaults;
      });
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      babel.ensureConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.ensureConfig).to.have.been.calledOnce
        .and.have.been.calledWith(data.config.atomCoverage.defaults)
        .and.have.returned()
        .and.have.not.thrown();
      expect(stub.readConfig).to.have.been.calledOnce
        .and.have.been.calledWith()
        .and.have.returned(data.config.babel.defaults)
        .and.have.not.thrown();
    });

    it('should use existing settings if previously fetched', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy.readConfig = sinon.spy(babel, 'readConfig');
      babel.config.filepath = expectedFilepath;
      babel.config.settings = _.cloneDeep(data.config.babel.defaults);
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      babel.ensureConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.ensureConfig).to.have.been.calledOnce
        .and.have.been.calledWith(data.config.atomCoverage.defaults)
        .and.have.returned()
        .and.have.not.thrown();
      expect(spy.readConfig).to.have.not.been.called;
    });

    it('should set option `presets` if missing', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      babel.config.filepath = expectedFilepath;
      babel.config.settings = _.cloneDeep(data.config.babel.defaults);
      delete babel.config.settings.presets;
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      expect(babel.config.settings).to.be.an('object').and.not.have.property('presets');
      babel.ensureConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.ensureConfig).to.have.been.calledOnce
        .and.have.been.calledWith(data.config.atomCoverage.defaults)
        .and.have.returned()
        .and.have.not.thrown();
      expect(babel.config.settings).to.be.an('object')
        .that.has.deep.property('presets', ['env']);
      expect(babel.config.modified).to.be.a('boolean').that.equals(true);
      expect(stub.saveConfig).to.have.not.been.called;
    });

    it('should set option `presets` if it has an invalid value', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      babel.config.filepath = expectedFilepath;
      babel.config.settings = _.cloneDeep(data.config.babel.defaults);
      babel.config.settings.presets = { invalidObj: 'value' };
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      babel.ensureConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.ensureConfig).to.have.been.calledOnce
        .and.have.been.calledWith(data.config.atomCoverage.defaults)
        .and.have.returned()
        .and.have.not.thrown();
      expect(babel.config.settings).to.be.an('object')
        .that.has.deep.property('presets', ['env']);
      expect(babel.config.modified).to.be.a('boolean').that.equals(true);
      expect(stub.saveConfig).to.have.not.been.called;
    });

    it('should not modify option `presets` if it contains the "env" preset', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      babel.config.filepath = expectedFilepath;
      babel.config.settings = _.cloneDeep(data.config.babel.defaults);
      babel.config.settings.presets = ['env'];
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      babel.ensureConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.ensureConfig).to.have.been.calledOnce
        .and.have.been.calledWith(data.config.atomCoverage.defaults)
        .and.have.returned()
        .and.have.not.thrown();
      expect(babel.config.settings).to.be.an('object')
        .that.has.deep.property('presets', ['env']);
      expect(babel.config.modified).to.be.a('boolean').that.equals(false);
      expect(stub.saveConfig).to.have.not.been.called;
    });

    it('should modify option `presets` by adding the "env" preset if missing', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      babel.config.filepath = expectedFilepath;
      babel.config.settings = _.cloneDeep(data.config.babel.defaults);
      babel.config.settings.presets = ['es2017'];
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      babel.ensureConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.ensureConfig).to.have.been.calledOnce
        .and.have.been.calledWith(data.config.atomCoverage.defaults)
        .and.have.returned()
        .and.have.not.thrown();
      expect(babel.config.settings).to.be.an('object')
        .that.has.deep.property('presets', ['es2017', 'env']);
      expect(babel.config.modified).to.be.a('boolean').that.equals(true);
      expect(stub.saveConfig).to.have.not.been.called;
    });

    context('using `nyc` as coverage tool', () => {
      it('should not modify option `env.test.sourceMaps` if equals "inline" or "both"', () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        babel.config.filepath = expectedFilepath;
        babel.config.settings = _.cloneDeep(data.config.babel.defaults);
        ['inline', 'both'].forEach((value) => {
          babel.config.modified = false;
          babel.config.settings.env.test.sourceMaps = value;
          // 4. Mock filesystem (if read/write operations present) ~> NONE
          // 5. Test!
          babel.ensureConfig(data.config.atomCoverage.defaults);
          // 6. Assertions.
          expect(babel.config.settings).to.be.an('object')
            .that.has.nested.property('env.test.sourceMaps', value);
          expect(babel.config.modified).to.be.a('boolean').that.equals(false);
          expect(stub.saveConfig).to.have.not.been.called;
        });
        expect(spy.ensureConfig).to.have.been.calledTwice
          .and.have.been.calledWith(data.config.atomCoverage.defaults)
          .and.have.always.returned()
          .and.have.not.always.thrown();
      });

      it('should set option `env.test.sourceMaps` to equal "inline" if missing or ', () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        babel.config.filepath = expectedFilepath;
        babel.config.settings = _.cloneDeep(data.config.babel.defaults);
        delete babel.config.settings.env.test.sourceMaps;
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        babel.ensureConfig(data.config.atomCoverage.defaults);
        // 6. Assertions.
        expect(babel.config.settings).to.be.an('object')
          .that.has.nested.property('env.test.sourceMaps', 'inline');
        expect(babel.config.modified).to.be.a('boolean').that.equals(true);
        expect(stub.saveConfig).to.have.not.been.called;
      });

      it('should set option `env.test.sourceMaps` to equal "inline" if it has an invalid value', () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        babel.config.filepath = expectedFilepath;
        babel.config.settings = _.cloneDeep(data.config.babel.defaults);
        babel.config.settings.env.test.sourceMaps = false;
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        babel.ensureConfig(data.config.atomCoverage.defaults);
        // 6. Assertions.
        expect(babel.config.settings).to.be.an('object')
          .that.has.nested.property('env.test.sourceMaps', 'inline');
        expect(babel.config.modified).to.be.a('boolean').that.equals(true);
        expect(stub.saveConfig).to.have.not.been.called;
      });

      it('should set option `env.test.plugins` if missing', () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        babel.config.filepath = expectedFilepath;
        babel.config.settings = _.cloneDeep(data.config.babel.defaults);
        delete babel.config.settings.env.test.plugins;
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        babel.ensureConfig(data.config.atomCoverage.defaults);
        // 6. Assertions.
        expect(babel.config.settings).to.be.an('object')
          .that.has.deep.nested.property('env.test.plugins', ['istanbul']);
        expect(babel.config.modified).to.be.a('boolean').that.equals(true);
        expect(stub.saveConfig).to.have.not.been.called;
      });

      it('should modify option `env.test.plugins` if it has an invalid value', () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        babel.config.filepath = expectedFilepath;
        babel.config.settings = _.cloneDeep(data.config.babel.defaults);
        babel.config.settings.env.test.plugins = '';
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        babel.ensureConfig(data.config.atomCoverage.defaults);
        // 6. Assertions.
        expect(babel.config.settings).to.be.an('object')
          .that.has.deep.nested.property('env.test.plugins', ['istanbul']);
        expect(babel.config.modified).to.be.a('boolean').that.equals(true);
        expect(stub.saveConfig).to.have.not.been.called;
      });

      it('should modify option `env.test.plugins` if it does not include the "istanbul" plugin', () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        babel.config.filepath = expectedFilepath;
        babel.config.settings = _.cloneDeep(data.config.babel.defaults);
        babel.config.settings.env.test.plugins = ['es2015-arrow-functions'];
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        babel.ensureConfig(data.config.atomCoverage.defaults);
        // 6. Assertions.
        expect(babel.config.settings).to.be.an('object')
          .that.has.deep.nested.property('env.test.plugins', ['es2015-arrow-functions', 'istanbul']);
        expect(babel.config.modified).to.be.a('boolean').that.equals(true);
        expect(stub.saveConfig).to.have.not.been.called;
      });

      it('should not modify option `env.test.plugins` if it contains "istanbul" as last plugin', () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        babel.config.filepath = expectedFilepath;
        babel.config.settings = _.cloneDeep(data.config.babel.defaults);
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        babel.ensureConfig(data.config.atomCoverage.defaults);
        // 6. Assertions.
        expect(babel.config.settings).to.be.an('object')
          .that.has.deep.nested.property('env.test.plugins', ['istanbul']);
        expect(babel.config.modified).to.be.a('boolean').that.equals(false);
        expect(stub.saveConfig).to.have.not.been.called;
      });

      it('should modify option `env.test.plugins` if "istanbul" is not in the last position', () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        babel.config.filepath = expectedFilepath;
        babel.config.settings = _.cloneDeep(data.config.babel.defaults);
        babel.config.settings.env.test.plugins = ['istanbul', 'es2015-arrow-functions'];
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        babel.ensureConfig(data.config.atomCoverage.defaults);
        // 6. Assertions.
        expect(babel.config.settings).to.be.an('object')
          .that.has.deep.nested.property('env.test.plugins', ['es2015-arrow-functions', 'istanbul']);
        expect(babel.config.modified).to.be.a('boolean').that.equals(true);
        expect(stub.saveConfig).to.have.not.been.called;
      });
    });

    it('should not save config to disk if requested but not modified', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      babel.config.filepath = expectedFilepath;
      babel.config.settings = _.cloneDeep(data.config.babel.defaults);
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      babel.ensureConfig(data.config.atomCoverage.defaults, true);
      // 6. Assertions.
      expect(babel.config.modified).to.be.a('boolean').that.equals(false);
      expect(stub.saveConfig).to.have.not.been.called;
    });

    it('should save config to disk if requested and modified', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      babel.config.filepath = expectedFilepath;
      babel.config.settings = _.cloneDeep(data.config.babel.defaults);
      delete babel.config.settings.env;
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      babel.ensureConfig(data.config.atomCoverage.defaults, true);
      // 6. Assertions.
      expect(babel.config.modified).to.be.a('boolean').that.equals(false);
      expect(stub.saveConfig).to.have.been.calledOnce
        .and.have.been.calledWith()
        .and.have.returned()
        .and.have.not.thrown();
    });

    it('should handle default case where the instrumenter does not need advanced checks (its own case)', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      babel.config.filepath = expectedFilepath;
      babel.config.settings = _.cloneDeep(data.config.babel.defaults);
      delete babel.config.settings.env;
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const atomCoverageConfig = _.cloneDeep(data.config.atomCoverage.defaults);
      atomCoverageConfig.instrumenter = 'blanket';
      babel.ensureConfig(atomCoverageConfig);
      // 6. Assertions.
      expect(babel.config.modified).to.be.a('boolean').that.equals(false);
      expect(stub.saveConfig).to.have.not.been.called;
    });
  });

  describe('transpile()', () => {
    beforeEach(() => {
      stub = { execSync: sinon.stub() };
      requireUUT(null, {
        child_process: {
          execSync: stub.execSync,
        },
      });
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { transpile: sinon.spy(babel, 'transpile') };
    });

    afterEach(restoreSandbox);

    context('using `nyc` as coverage tool', () => {
      it('should invoke babel-cli', () => {
        // 3. Stub/spy same module functions/methods called by the UUT ~> NONE.
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        const envVars = {
          COVERAGE: 'true',
          NODE_ENV: 'dev',
        };
        _.forEach(envVars, (value, envVar) => mock.env.backup(envVar, value));
        const atomCoverageConfig = _.cloneDeep(data.config.atomCoverage.defaults);
        atomCoverageConfig.instrumentedPath = join('.reports', '.instrumented');
        atomCoverageConfig.sourcesRoot = `lib${sep}`;
        babel.transpile(atomCoverageConfig);
        // 6. Assertions.
        expect(spy.transpile).to.have.been.calledOnce
          .and.returned().and.calledWith().and.have.not.thrown();
        expect(stub.execSync).to.have.been.calledOnce
          .and.calledWith(`babel -d ${atomCoverageConfig.instrumentedPath} -q lib`)
          .and.returned().and.have.not.thrown();
        expect(stub.execSync.args[0][1]).to.be.an('object');
        expect(stub.execSync.args[0][1]).to.have.property('cwd', cwd);
        expect(stub.execSync.args[0][1]).to.have.property('env')
          .that.has.all.keys('BABEL_ENV', 'COVERAGE', 'NODE_ENV', 'PATH');
        // Reset sandbox.
        _.forEach(envVars, (value, envVar) => mock.env.restore(envVar));
      });
    });

    it('should handle default case where instrumenter does not need transpilation (pre-instrumentation)', () => {
      // 3. Stub/spy same module functions/methods called by the UUT ~> NONE.
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const atomCoverageConfig = _.cloneDeep(data.config.atomCoverage.defaults);
      atomCoverageConfig.instrumenter = 'blanket';
      babel.transpile(atomCoverageConfig);
      // 6. Assertions.
      expect(spy.transpile).to.have.been.calledOnce.and.returned()
        .and.calledWith(atomCoverageConfig).and.have.not.thrown();
      expect(stub.execSync).to.have.not.been.called;
    });
  });
});
