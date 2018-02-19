const _ = require('lodash');

// Testing utils/frameworks.
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai'); // eslint-disable-line import/newline-after-import
const { expect } = chai;
chai.use(sinonChai);

// Testing helpers (mocks/data).
const mock = require('../helpers/mock');

// Variables & constants.
let manager;
let spy;
let stub;

const requireUUT = (proxyquireStubs = {}) => {
  // 1. Mock same module files required by the UUT with `proxyquire`.
  stub = {
    readConfig: sinon.stub(),
    runTestsWithCoverage: sinon.stub(),
  };
  manager = _.defaultsDeep(proxyquireStubs, {
    readConfig: stub.readConfig,
    runTestsWithCoverage: stub.runTestsWithCoverage,
  });
  mock.sandbox.setup('../../bin/atom-coverage', {
    '../lib/manager': { manager },
  });
};
const envVars = {
  COVERAGE: 'on',
  NODE_ENV: 'test',
};

describe('UNIT TESTS: main binary `atom-coverage`', () => {
  it('should set env vars and run tests with coverage', () => {
    // 3. Stub/spy same module functions/methods called by the UUT.
    // 4. Mock filesystem (if read/write operations present) ~> NONE
    // 5. Test!
    requireUUT();
    // 6. Assertions.
    _.forEach(envVars, (value, envVar) => {
      expect(process.env).to.have.property(envVar, value);
    });
    expect(stub.readConfig).to.have.been.calledOnce
      .and.have.been.calledWith(true).and.have.been.returned();
    expect(stub.runTestsWithCoverage).to.have.been.calledOnce
      .and.have.been.calledWith().and.have.been.returned();
    // Reset sandbox.
    Object.keys(envVars).forEach(envVar => delete process.env[envVar]);
    mock.sandbox.restore(spy, stub);
  });
});
