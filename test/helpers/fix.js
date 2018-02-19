// Some `require()`s conflict with `mock-fs`, so require all files/libs once here.
// require('../../lib/transpiler/babel');

const glob = require('glob');
const Joi = require('joi');

// `hapi/joi` conflicts with `mock-fs` if not executed at least one validation before,
// because `hapi/joi` loads other files on validation. This is a hackity hack!!
Joi.attempt({ foo: 'bar' }, Joi.object().keys({ foo: Joi.string().valid('bar') }));
