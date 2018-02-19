const _ = require('lodash');

const TRUTHY = ['true', 'on', '1'];

/**
 * @summary Checks if an environment variable is set (has a truthy value).
 * @param  {String}  envVar The environment variable to check.
 * @return {Boolean}        Whether the env var is defined and is truthy (`true`) or not.
 */
function envHas(envVar) {
  if (envVar === undefined) {
    throw new Error('You must provide an env var to check');
  }

  return _.has(process.env, envVar)
    && _.includes(TRUTHY, process.env[envVar]);
}


module.exports = {
  envHas,
};
