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
let main;
let manager;
let spy;
let stub;

const requireUUT = (proxyquireStubs = {}) => {
  // 1. Mock same module files required by the UUT with `proxyquire`.
  stub = {
    readConfig: sinon.stub(),
    testquire: sinon.stub(),
    trackCoverage: sinon.stub(),
  };
  manager = _.defaultsDeep(proxyquireStubs, {
    readConfig: stub.readConfig,
    testquire: stub.testquire,
    trackCoverage: stub.trackCoverage,
  });
  main = mock.sandbox.setup('../../lib/index', {
    './manager': { manager },
  });
};

const restoreSandbox = () => mock.sandbox.restore(spy, stub);

describe('UNIT TESTS: library entry point', () => {
  afterEach(() => {
    // Reset sandbox.
    delete global.AtomCoverage;
    restoreSandbox();
  });

  it('should use cached `requireRoot` if `global.AtomCoverage` exists', () => {
    // 3. Stub/spy same module functions/methods called by the UUT.
    const expectedRequireRoot = '.instrumented';
    global.AtomCoverage = { requireRoot: expectedRequireRoot };
    // 4. Mock filesystem (if read/write operations present) ~> NONE
    // 5. Test!
    requireUUT();
    // 6. Assertions.
    expect(manager).to.have.property('requireRoot', expectedRequireRoot);
    expect(main).to.have.property('testquire').that.is.a('function');
    expect(stub.readConfig).to.have.not.been.called;
    expect(stub.trackCoverage).to.have.not.been.called;
  });

  it('should read settings and calc `requireRoot` if `global.AtomCoverage` missing', () => {
    // 3. Stub/spy same module functions/methods called by the UUT.
    const expectedRequireRoot = '.instrumented';
    // 4. Mock filesystem (if read/write operations present) ~> NONE
    // 5. Test!
    requireUUT({ requireRoot: expectedRequireRoot });
    // 6. Assertions.
    expect(main).to.have.property('testquire').that.is.a('function');
    expect(stub.readConfig).to.have.been.calledOnce
      .and.have.been.calledWith().and.have.returned();
    expect(stub.trackCoverage).to.have.been.calledOnce
      .and.have.been.calledWith().and.have.returned();
    expect(global.AtomCoverage).to.have.property('requireRoot', expectedRequireRoot);
  });
});
