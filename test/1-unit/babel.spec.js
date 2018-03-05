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
        readConfig: () => {
          babel.config.settings = _.cloneDeep(data.config.babel.defaults);
        },
      };
      spy = {
        util: {
          readConfig: sinon.spy(utilStubs.readConfig),
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
      expect(spy.util.readConfig).to.have.been.calledOnce;
    });

    it('should set empty settings if no config file found', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const utilStubs = {
        readConfig: () => {
          babel.config.settings = {};
        },
      };
      spy = {
        util: {
          readConfig: sinon.spy(utilStubs.readConfig),
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
      expect(spy.util.readConfig).to.have.been.calledOnce;
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

  describe('enforcePresetEnv()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { enforcePresetEnv: sinon.spy(babel, 'enforcePresetEnv') };
    });

    afterEach(restoreSandbox);

    [3, [3, 'react']].forEach((presets) => {
      it('should set env preset if malformed config found', () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        const preset = 'env';
        babel.config.settings = { presets };
        spy.findAddon = sinon.spy(babel, 'findAddon');
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        babel.enforcePresetEnv();
        // 6. Assertions.
        expect(spy.enforcePresetEnv).to.have.been.calledOnce
          .and.have.been.calledWith().and.have.returned().and.have.not.thrown();
        if (_.isArray(presets)) {
          expect(spy.findAddon).to.have.been.calledOnce
            .and.have.been.calledWith(presets, 'preset', preset)
            .and.have.returned().and.not.have.thrown();
        } else {
          expect(spy.findAddon).to.not.have.been.called;
        }
        expect(babel.config).to.have.property('modified', true);
        expect(babel.config.settings).to.have.deep.property('presets', [preset]);
      });
    });

    it('should append `babel-preset-env` if not present', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const preset = 'env';
      const presets = ['react'];
      babel.config.settings = { presets };
      spy.findAddon = sinon.spy(babel, 'findAddon');
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      babel.enforcePresetEnv();
      // 6. Assertions.
      expect(spy.enforcePresetEnv).to.have.been.calledOnce
        .and.have.been.calledWith().and.have.returned().and.have.not.thrown();
      expect(spy.findAddon).to.have.been.calledOnce
        .and.have.been.calledWith(presets, 'preset', preset)
        .and.have.returned({ index: -1 }).and.not.have.thrown();
      expect(babel.config).to.have.property('modified', true);
      expect(babel.config.settings).to.have.deep.property('presets', presets.concat(preset));
    });

    ['env', 'babel-preset-env'].forEach((name) => {
      it(`should detect if "${name}" preset present`, () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        const preset = 'env';
        const presets = ['react', name];
        babel.config.settings = { presets };
        spy.findAddon = sinon.spy(babel, 'findAddon');
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        babel.enforcePresetEnv();
        // 6. Assertions.
        expect(spy.enforcePresetEnv).to.have.been.calledOnce
          .and.have.been.calledWith().and.have.returned().and.have.not.thrown();
        expect(spy.findAddon).to.have.been.calledOnce
          .and.have.been.calledWith(presets, 'preset', preset)
          .and.have.returned({ index: 1, shorthand: (name === preset) })
          .and.not.have.thrown();
        expect(babel.config).to.have.property('modified', false);
        expect(babel.config.settings).to.have.deep.property('presets', presets);
      });
    });
  });

  describe('enforcePluginIstanbul()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { enforcePluginIstanbul: sinon.spy(babel, 'enforcePluginIstanbul') };
    });

    afterEach(restoreSandbox);

    it('should inherit global babel config if no env.test config provided', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const globalPlugins = ['babel-transform-decorators-legacy'];
      spy.findAddon = sinon.spy(babel, 'findAddon');
      stub = {
        inheritGeneralConfig: sinon.stub(babel, 'inheritGeneralConfig')
          .callsFake(() => globalPlugins),
      };
      babel.config.settings = {};
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      babel.enforcePluginIstanbul();
      // 6. Assertions.
      expect(spy.enforcePluginIstanbul).to.have.been.calledOnce
        .and.have.been.calledWith().and.have.returned().and.have.not.thrown();
      expect(spy.findAddon).to.have.been.calledOnce
        .and.have.been.calledWith(globalPlugins, 'plugin', 'istanbul')
        .and.have.returned({ index: -1 })
        .and.not.have.thrown();
      expect(stub.inheritGeneralConfig).to.have.been.calledOnce
        .and.have.been.calledWith('env.test.plugins')
        .and.have.returned(globalPlugins)
        .and.not.have.thrown();
      expect(babel.config).to.have.property('modified', true);
      expect(babel.config.settings).to.have.nested.property('env.test.plugins')
        .that.deep.equals(globalPlugins.concat('istanbul'));
    });

    it('should set default plugins if malformed config found', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const plugins = [3, 'babel-transform-decorators-legacy'];
      babel.config.settings = { env: { test: { plugins } } };
      spy.findAddon = sinon.spy(babel, 'findAddon');
      spy.inheritGeneralConfig = sinon.spy(babel, 'inheritGeneralConfig');
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      babel.enforcePluginIstanbul();
      // 6. Assertions.
      expect(spy.enforcePluginIstanbul).to.have.been.calledOnce
        .and.have.been.calledWith().and.have.returned().and.have.not.thrown();
      expect(spy.inheritGeneralConfig).to.not.have.been.called;
      expect(spy.findAddon).to.have.been.calledOnce
        .and.have.been.calledWith(plugins, 'plugin', 'istanbul')
        .and.have.returned().and.not.have.thrown();
      expect(babel.config).to.have.property('modified', true);
      expect(babel.config.settings).to.have.nested.property('env.test.plugins')
        .that.deep.equals(['istanbul']);
    });

    it('should append `babel-plugin-istanbul` if not present', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const plugins = ['babel-transform-decorators-legacy'];
      babel.config.settings = { env: { test: { plugins } } };
      spy.findAddon = sinon.spy(babel, 'findAddon');
      spy.inheritGeneralConfig = sinon.spy(babel, 'inheritGeneralConfig');
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      babel.enforcePluginIstanbul();
      // 6. Assertions.
      expect(spy.enforcePluginIstanbul).to.have.been.calledOnce
        .and.have.been.calledWith().and.have.returned().and.have.not.thrown();
      expect(spy.inheritGeneralConfig).to.not.have.been.called;
      expect(spy.findAddon).to.have.been.calledOnce
        .and.have.been.calledWith(plugins, 'plugin', 'istanbul')
        .and.have.returned({ index: -1 }).and.not.have.thrown();
      expect(babel.config).to.have.property('modified', true);
      expect(babel.config.settings).to.have.nested.property('env.test.plugins')
        .that.deep.equals(plugins.concat('istanbul'));
    });

    ['istanbul', 'babel-plugin-istanbul'].forEach((name) => {
      it(`should detect if "${name}" plugin present`, () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        const plugins = ['babel-transform-decorators-legacy', name];
        babel.config.settings = { env: { test: { plugins } } };
        spy.findAddon = sinon.spy(babel, 'findAddon');
        spy.inheritGeneralConfig = sinon.spy(babel, 'inheritGeneralConfig');
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        babel.enforcePluginIstanbul();
        // 6. Assertions.
        expect(spy.enforcePluginIstanbul).to.have.been.calledOnce
          .and.have.been.calledWith().and.have.returned().and.have.not.thrown();
        expect(spy.inheritGeneralConfig).to.not.have.been.called;
        expect(spy.findAddon).to.have.been.calledOnce
          .and.have.been.calledWith(plugins, 'plugin', 'istanbul')
          .and.have.returned({ index: 1, shorthand: (name === 'istanbul') })
          .and.not.have.thrown();
        expect(babel.config).to.have.property('modified', false);
        expect(babel.config.settings).to.have.nested.property('env.test.plugins')
          .that.deep.equals(plugins);
      });

      it(`should move "${name}" if present but not in last position`, () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        const plugins = [name, 'babel-transform-decorators-legacy'];
        babel.config.settings = { env: { test: { plugins } } };
        spy.findAddon = sinon.spy(babel, 'findAddon');
        spy.inheritGeneralConfig = sinon.spy(babel, 'inheritGeneralConfig');
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        babel.enforcePluginIstanbul();
        // 6. Assertions.
        expect(spy.enforcePluginIstanbul).to.have.been.calledOnce
          .and.have.been.calledWith().and.have.returned().and.have.not.thrown();
        expect(spy.inheritGeneralConfig).to.not.have.been.called;
        expect(spy.findAddon).to.have.been.calledOnce
          .and.have.been.calledWith(plugins, 'plugin', 'istanbul')
          .and.have.returned({ index: 0, shorthand: (name === 'istanbul') })
          .and.not.have.thrown();
        expect(babel.config).to.have.property('modified', true);
        expect(babel.config.settings).to.have.nested.property('env.test.plugins')
          .that.deep.equals(['babel-transform-decorators-legacy', name]);
      });
    });
  });

  describe('setupForNyc()', () => {
    it('should call all internal methods that configure project with `nyc`', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      requireUUT();
      spy = { setupForNyc: sinon.spy(babel, 'setupForNyc') };
      stub = {
        enforceSourceMaps: sinon.stub(babel, 'enforceSourceMaps').callsFake(_.noop),
        enforcePluginIstanbul: sinon.stub(babel, 'enforcePluginIstanbul').callsFake(_.noop),
      };
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      babel.setupForNyc();
      // 6. Assertions.
      expect(spy.setupForNyc).to.have.been.calledOnce
        .and.have.been.calledWith().and.have.returned().and.have.not.thrown();
      expect(stub.enforcePluginIstanbul).to.have.been.calledOnce.and.have.been.calledWith();
      // 7. Restore sandbox.
      restoreSandbox();
    });
  });

  describe('enforceSourceMaps()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { enforceSourceMaps: sinon.spy(babel, 'enforceSourceMaps') };
    });

    afterEach(restoreSandbox);

    ['inline', 'both'].forEach((validValue) => {
      it(`should not change babel config if sourceMaps option present and valid (${validValue})`, () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        babel.config.settings = { env: { test: { sourceMaps: validValue } } };
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        expect(babel.config.modified).to.be.a('boolean').that.equals(false);
        babel.enforceSourceMaps();
        // 6. Assertions.
        expect(babel.config.settings).to.be.an('object')
          .that.nested.includes({ 'env.test.sourceMaps': validValue });
        expect(babel.config.modified).to.be.a('boolean').that.equals(false);
        expect(spy.enforceSourceMaps).to.have.been.calledOnce
          .and.have.been.calledWith().and.have.returned().and.have.not.thrown();
      });

      it(`should inherit global babel config if present and valid (${validValue}) when env.test missing`, () => {
        // 3. Stub/spy same module functions/methods called by the UUT.
        babel.config.settings = { sourceMaps: validValue };
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        expect(babel.config.modified).to.be.a('boolean').that.equals(false);
        babel.enforceSourceMaps();
        // 6. Assertions.
        expect(babel.config.settings).to.be.an('object')
          .that.nested.includes({ 'env.test.sourceMaps': validValue });
        expect(babel.config.modified).to.be.a('boolean').that.equals(true);
        expect(spy.enforceSourceMaps).to.have.been.calledOnce
          .and.have.been.calledWith().and.have.returned().and.have.not.thrown();
      });
    });

    it('should set default value if no test/global value found', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      babel.config.settings = {};
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      expect(babel.config.modified).to.be.a('boolean').that.equals(false);
      babel.enforceSourceMaps();
      // 6. Assertions.
      expect(babel.config.settings).to.be.an('object')
        .that.nested.includes({ 'env.test.sourceMaps': 'inline' });
      expect(babel.config.modified).to.be.a('boolean').that.equals(true);
      expect(spy.enforceSourceMaps).to.have.been.calledOnce
        .and.have.been.calledWith().and.have.returned().and.have.not.thrown();
    });
  });

  describe('findAddon()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { findAddon: sinon.spy(babel, 'findAddon') };
    });

    afterEach(restoreSandbox);

    const toTest = {
      preset: { short: 'env', long: 'babel-preset-env' },
      plugin: { short: 'istanbul', long: 'babel-plugin-istanbul' },
    };
    const collections = {
      preset: ['react'],
      plugin: [['transform-decorators-legacy', {}]],
    };
    [false, true].forEach((withOptions) => {
      Object.keys(toTest).forEach((addonType) => {
        Object.keys(toTest[addonType]).forEach((nameType) => {
          it(`should find ${addonType} ${withOptions ? 'with options' : 'without options'} in ${nameType} form`, () => {
            // 3. Stub/spy same module functions/methods called by the UUT.
            const addon = toTest[addonType][nameType];
            const collection = collections[addonType].concat(withOptions ? [[addon, {}]] : addon);
            // 4. Mock filesystem (if read/write operations present) ~> NONE
            // 5. Test!
            const found = babel.findAddon(collection, addonType, toTest[addonType].short);
            // 6. Assertions.
            expect(found).to.be.an('object').that.deep.equals({
              index: 1,
              shorthand: (nameType === 'short'),
            });
            expect(spy.findAddon).to.have.been.calledOnce.and.have.not.thrown();
          });
        });
      });
    });

    it('should return `undefined` if malformed option', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const found = babel.findAddon([true, 'transform-decorators-legacy'], 'plugin', 'istanbul');
      // 6. Assertions.
      expect(found).to.be.undefined;
      expect(spy.findAddon).to.have.been.calledOnce.and.have.not.thrown();
    });

    it('should return `index = -1` if not found', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const found = babel.findAddon(['transform-decorators-legacy'], 'plugin', 'istanbul');
      // 6. Assertions.
      expect(found).to.be.an('object').that.deep.equals({ index: -1 });
      expect(spy.findAddon).to.have.been.calledOnce.and.have.not.thrown();
    });
  });

  describe('inheritGeneralConfig()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { inheritGeneralConfig: sinon.spy(babel, 'inheritGeneralConfig') };
    });

    afterEach(restoreSandbox);

    it('should fetch general babel configuration for simple option', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const sourceMaps = 'both';
      babel.config.settings = { sourceMaps };
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const inherited = babel.inheritGeneralConfig('env.test.sourceMaps');
      // 6. Assertions.
      expect(inherited).to.be.a('string').that.equals(sourceMaps);
      expect(spy.inheritGeneralConfig).to.have.been.calledOnce.and.have.not.thrown();
    });

    it('should fetch general babel configuration for complex option', () => {
      // 3. Stub/spy same module functions/methods called by the UUT.
      const plugins = ['transform-decorators-legacy', 'istanbul'];
      babel.config.settings = { plugins };
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const inherited = babel.inheritGeneralConfig('env.test.plugins');
      // 6. Assertions.
      expect(inherited).to.be.an('array').that.deep.equals(plugins);
      expect(spy.inheritGeneralConfig).to.have.been.calledOnce.and.have.not.thrown();
    });
  });

  describe('enforceConfig()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { enforceConfig: sinon.spy(babel, 'enforceConfig') };
      stub = { saveConfig: sinon.stub(babel, 'saveConfig').callsFake(_.noop) };
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
      babel.enforceConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.enforceConfig).to.have.been.calledOnce
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
      babel.enforceConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.enforceConfig).to.have.been.calledOnce
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
      babel.enforceConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.enforceConfig).to.have.been.calledOnce
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
      babel.enforceConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.enforceConfig).to.have.been.calledOnce
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
      babel.enforceConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.enforceConfig).to.have.been.calledOnce
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
      babel.enforceConfig(data.config.atomCoverage.defaults);
      // 6. Assertions.
      expect(spy.enforceConfig).to.have.been.calledOnce
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
          babel.enforceConfig(data.config.atomCoverage.defaults);
          // 6. Assertions.
          expect(babel.config.settings).to.be.an('object')
            .that.has.nested.property('env.test.sourceMaps', value);
          expect(babel.config.modified).to.be.a('boolean').that.equals(false);
          expect(stub.saveConfig).to.have.not.been.called;
        });
        expect(spy.enforceConfig).to.have.been.calledTwice
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
        babel.enforceConfig(data.config.atomCoverage.defaults);
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
        babel.enforceConfig(data.config.atomCoverage.defaults);
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
        babel.enforceConfig(data.config.atomCoverage.defaults);
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
        babel.enforceConfig(data.config.atomCoverage.defaults);
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
        babel.enforceConfig(data.config.atomCoverage.defaults);
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
        babel.enforceConfig(data.config.atomCoverage.defaults);
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
        babel.enforceConfig(data.config.atomCoverage.defaults);
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
      babel.enforceConfig(data.config.atomCoverage.defaults, true);
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
      babel.enforceConfig(data.config.atomCoverage.defaults, true);
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
      babel.enforceConfig(atomCoverageConfig);
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
        Object.keys(envVars).forEach(envVar => mock.env.backup(envVar, envVars[envVar]));
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
        Object.keys(envVars).forEach(envVar => mock.env.restore(envVar));
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
