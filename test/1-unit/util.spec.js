const { existsSync, readFileSync, readJSONSync } = require('fs-extra');
const yaml = require('js-yaml');

// Testing utils/frameworks.
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
chai.use(sinonChai);

// Testing helpers (mocks/data).
const mock = require('../helpers/mock');

// Variables & constants.
let util;
let spy;
let stub;

const requireUUT = (done, proxyquireStubs = {}) => {
  // 1. Mock same module files required by the UUT with `proxyquire`.
  util = mock.sandbox.setup('../../lib/util', proxyquireStubs);
  // 2. Reset sandbox.
  if (done) done();
};

const restoreSandbox = () => mock.sandbox.restore(spy, stub);

const mockConfigFile = (path, data, format) => {
  const configFiles = {};
  switch (format) {
    case 'json':
      configFiles[path] = JSON.stringify(data, null, 2);
      break;
    case 'yaml':
    case 'yml':
      configFiles[path] = yaml.safeDump(data);
      break;
    default: break;
  }
  mock.fs.localFiles(configFiles);
};

const testFile = './fake/test/file';
const testFileData = { some: { key: 'value' } };

describe('UNIT TESTS: util', () => {
  describe('envHas()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { envHas: sinon.spy(util, 'envHas') };
    });

    afterEach(restoreSandbox);

    it('should throw if no env var provided', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const badCall = () => util.envHas();
      // 6. Assertions.
      expect(badCall).to.throw();
    });

    // Test for truthy values.
    ['true', 'on', '1', true, 1].forEach((truthyValue) => {
      it(`should return \`true\` for env var with truthy value \`${truthyValue}\``, () => {
        const envVar = 'RANDOM_ENV_VAR';
        mock.env.backup(envVar, truthyValue);
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        const envHasVar = util.envHas(envVar);
        // 6. Assertions.
        expect(envHasVar).to.be.a('boolean').that.equals(true);
        expect(spy.envHas).to.have.been.calledOnce
          .and.have.been.calledWith(envVar)
          .and.have.returned(true);
        // Reset sandbox.
        mock.env.restore(envVar);
      });
    });

    // Test for falsy values.
    ['falsy', 'off', '0', 0, [], {}, 3.14, false, () => {}].forEach((falsyValue) => {
      it(`should return \`false\` for env var with falsy value \`${falsyValue}\``, () => {
        const envVar = 'RANDOM_ENV_VAR';
        mock.env.backup(envVar, falsyValue);
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        const envHasVar = util.envHas(envVar);
        // 6. Assertions.
        expect(envHasVar).to.be.a('boolean').that.equals(false);
        expect(spy.envHas).to.have.been.calledOnce
          .and.have.been.calledWith(envVar)
          .and.have.returned(false);
        // Reset sandbox.
        mock.env.restore(envVar);
      });
    });
  });

  describe('readConfig()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { readConfig: sinon.spy(util, 'readConfig') };
    });

    afterEach(restoreSandbox);

    it('should throw if no config filepath provided', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const badCall = () => util.readConfig();
      // 6. Assertions.
      expect(badCall).to.throw();
      expect(spy.readConfig).to.have.been.calledOnce
        .and.calledWith().and.have.thrown();
    });

    it('should throw on unknown file format', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const badCall = () => util.readConfig('fake/test/file');
      // 6. Assertions.
      expect(badCall).to.throw();
      expect(spy.readConfig).to.have.been.calledOnce
        .and.calledWith().and.have.thrown();
    });

    ['json', 'yaml', 'yml'].forEach((format) => {
      it(`should parse contents of .${format} config file`, () => {
        // 4. Mock filesystem (if read/write operations present) ~> config file to read.
        const testFilePath = `${testFile}.${format}`;
        mockConfigFile(testFilePath, testFileData, format);
        // 5. Test!
        const readConfig = util.readConfig(testFilePath, format);
        // 6. Assertions.
        expect(readConfig).to.be.an('object').that.deep.equals(testFileData);
        expect(spy.readConfig).to.have.been.calledOnce.and.have.returned(testFileData);
      });
    });
  });

  describe('writeConfig()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { writeConfig: sinon.spy(util, 'writeConfig') };
    });

    afterEach(restoreSandbox);

    it('should throw if no config filepath provided', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      mock.fs.localFiles();
      // 5. Test!
      const badCall = () => util.writeConfig();
      // 6. Assertions.
      expect(badCall).to.throw();
      expect(spy.writeConfig).to.have.been.calledOnce
        .and.calledWith().and.have.thrown();
    });

    it('should throw if no data provided to write', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      mock.fs.localFiles();
      // 5. Test!
      const badCall = () => util.writeConfig(`${testFile}.json`, undefined, 'json');
      // 6. Assertions.
      expect(badCall).to.throw();
      expect(spy.writeConfig).to.have.been.calledOnce
        .and.calledWith().and.have.thrown();
    });

    it('should parse file with unknown format as JSON', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      const format = 'json';
      mockConfigFile(testFile, testFileData, format);
      // 5. Test!
      util.writeConfig(testFile, testFileData);
      // 6. Assertions.
      expect(existsSync(testFile)).to.be.true;
      const writtenConfig = readJSONSync(testFile);
      expect(writtenConfig).to.be.an('object').that.deep.equals(testFileData);
      expect(spy.writeConfig).to.have.been.calledOnce.and.have.returned();
    });

    ['json', 'yaml', 'yml'].forEach((format) => {
      it(`should write contents of .${format} config file`, () => {
        // 4. Mock filesystem (if read/write operations present) ~> config file to read.
        const testFilePath = `${testFile}.${format}`;
        mockConfigFile(testFilePath, testFileData, format);
        // 5. Test!
        util.writeConfig(testFilePath, testFileData, format);
        // 6. Assertions.
        expect(existsSync(testFilePath)).to.be.true;
        const writtenConfig = (format === 'json')
          ? readJSONSync(testFilePath)
          : yaml.safeLoad(readFileSync(testFilePath, 'utf8'));
        expect(writtenConfig).to.be.an('object').that.deep.equals(testFileData);
        expect(spy.writeConfig).to.have.been.calledOnce.and.have.returned();
      });
    });
  });

  describe('findConfigFile()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { findConfigFile: sinon.spy(util, 'findConfigFile') };
    });

    afterEach(restoreSandbox);

    it('should throw if no glob pattern provided', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const badCall = () => util.findConfigFile();
      // 6. Assertions.
      expect(badCall).to.throw();
      expect(spy.findConfigFile).to.have.been.calledOnce
        .and.calledWith().and.have.thrown();
    });

    it('should return `undefined` if no config file found', () => {
      // 4. Mock filesystem (if read/write operations present) ~> NONE
      // 5. Test!
      const found = util.findConfigFile(testFile);
      // 6. Assertions.
      expect(found).to.be.undefined;
      expect(spy.findConfigFile).to.have.been.calledOnce
        .and.calledWith().and.have.returned(undefined);
    });

    it('should find the provided config file if exists', () => {
      // 4. Mock filesystem (if read/write operations present) ~> config file to read.
      const configFilePath = '.customrc.json';
      mockConfigFile(configFilePath, testFileData, 'json');
      // 5. Test!
      const found = util.findConfigFile(configFilePath);
      // 6. Assertions.
      expect(found).to.be.a('string').that.equals(configFilePath);
      expect(spy.findConfigFile).to.have.been.calledOnce
        .and.have.returned(configFilePath);
    });
  });
});
