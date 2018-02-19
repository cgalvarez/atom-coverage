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
        process.env[envVar] = truthyValue;
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        const envHasVar = util.envHas(envVar);
        // 6. Assertions.
        expect(envHasVar).to.be.a('boolean').that.equals(true);
        expect(spy.envHas).to.have.been.calledOnce
          .and.have.been.calledWith(envVar)
          .and.have.returned(true);
        // Reset sandbox.
        delete process.env[envVar];
      });
    });

    // Test for falsy values.
    ['falsy', 'off', '0', 0, [], {}, 3.14, false, () => {}].forEach((falsyValue) => {
      it(`should return \`false\` for env var with falsy value \`${falsyValue}\``, () => {
        const envVar = 'RANDOM_ENV_VAR';
        process.env[envVar] = falsyValue;
        // 4. Mock filesystem (if read/write operations present) ~> NONE
        // 5. Test!
        const envHasVar = util.envHas(envVar);
        // 6. Assertions.
        expect(envHasVar).to.be.a('boolean').that.equals(false);
        expect(spy.envHas).to.have.been.calledOnce
          .and.have.been.calledWith(envVar)
          .and.have.returned(false);
        // Reset sandbox.
        delete process.env[envVar];
      });
    });
  });
});
