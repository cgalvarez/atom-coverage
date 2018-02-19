const Joi = require('joi');

// `hapi/joi` conflicts with `mock-fs` if no validation executed before
// (at least one),because `hapi/joi` loads other files on validation.
Joi.attempt({ foo: 'bar' }, Joi.object().keys({ foo: Joi.string().valid('bar') }));
