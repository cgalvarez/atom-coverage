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

const requireUUT = (done, proxyquireStubs = {}) => {
  // 1. Mock same module files required by the UUT with `proxyquire`.
  manager = mock.sandbox.setup('../../lib/manager', proxyquireStubs);
  // 2. Reset sandbox.
  manager.config = undefined;
  manager.requireRoot = undefined;
  manager.transpiler = undefined;
  manager.instrumenter = undefined;
  if (done) done();
};

const restoreSandbox = () => mock.sandbox.restore(spy, stub);

describe('FUNCTIONAL TESTS: manager', () => {
  describe('testquire()', () => {
    beforeEach(() => {
      requireUUT();
      // 3. Stub/spy same module functions/methods called by the UUT.
      spy = { testquire: sinon.spy(manager, 'testquire') };
    });

    afterEach(restoreSandbox);

    it('should require file if coverage requested and file required, and return its content', () => {
      const requireRoot = 'fake/.instrumented';
      const fakeModule = require(`../${requireRoot}/index`);
      // 3. Stub/spy same module functions/methods called by the UUT.
      manager.requireRoot = requireRoot;
      // 4. Mock filesystem (if read/write operations present) ~> sources root.
      // 5. Test!
      const filepath = manager.testquire('./index');
      // 6. Assertions.
      expect(spy.testquire).to.have.been.calledOnce;
      expect(filepath).to.be.an('object').that.deep.equals(fakeModule);
    });

    it('should require file if coverage requested and file required, and return "default" if present', () => {
      const requireRoot = 'fake/lib';
      const fakeModule = require(`../${requireRoot}/with-default`);
      // 3. Spy same module functions/methods called by the UUT.
      manager.requireRoot = requireRoot;
      // 4. Mock filesystem (if read/write operations present) ~> sources root.
      // 5. Test!
      const mod = manager.testquire('./with-default');
      // 6. Assertions.
      expect(spy.testquire).to.have.been.calledOnce;
      expect(mod).to.be.an('object').that.deep.equals(fakeModule.default);
    });

    it('should return filepath if no coverage requested and file required', () => {
      const requireRoot = 'fake/.instrumented';
      const fakeModulePath = `../${requireRoot}/index`;
      // 3. Stub/spy same module functions/methods called by the UUT.
      manager.requireRoot = requireRoot;
      // 4. Mock filesystem (if read/write operations present) ~> sources root.
      // 5. Test!
      const filepath = manager.testquire('./index', false);
      // 6. Assertions.
      expect(spy.testquire).to.have.been.calledOnce;
      expect(filepath).to.be.a('string').that.equals(fakeModulePath);
    });
  });
});
