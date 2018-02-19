const glob = require('glob');
const yaml = require('js-yaml');
const _ = require('lodash');
const {
  outputJSONSync,
  readFileSync,
  readJSONSync,
  writeFileSync,
} = require('fs-extra');

const TRUTHY = ['true', 'on', '1'];
const rgxExt = /\.([^.\\/]+)$/;

/**
 * @summary Checks if an environment variable is set (has a truthy value).
 * @param  {String}  envVar The environment variable to check.
 * @return {Boolean}        Whether the env var is defined and is truthy (`true`) or not.
 */
function envHas(envVar) {
  if (!envVar) {
    throw new Error('You must provide an env var to check');
  }

  return _.has(process.env, envVar) && _.includes(TRUTHY, process.env[envVar]);
}

/**
 * Parses the content of the config file at `filePath`.
 * Only supports YAML or JSON formats.
 * Defaults to JSON if format not provided and cannot be inferred from file extension.
 *
 * @param  {String} filePath      The path where the config file is placed.
 * @param  {String} [fileFormat]  One of "yaml", "yml", "json".
 * @return {Object}               The parsed contents of the requested config file.
 */
function readConfig(filePath, fileFormat) {
  if (!filePath) {
    throw new Error('No file to read!');
  }

  const ext = rgxExt.exec(filePath) || [];
  const format = fileFormat || ext[1];

  if (format === 'yaml' || format === 'yml') {
    return yaml.safeLoad(readFileSync(filePath, 'utf8'));
  }

  return readJSONSync(filePath);
}

/**
 * Writes a given JSON object `data` to a `filePath` with the requested `format`.
 *
 * @param  {String} filePath   The path where to write the file.
 * @param  {Object} data       The object to write into the file contents.
 * @param  {String} fileFormat One of "yaml", "yml", "json".
 */
function writeConfig(filePath, data, fileFormat) {
  if (!filePath || !data) {
    throw new Error('No file/data to save!');
  }

  const ext = rgxExt.exec(filePath) || [];
  const format = fileFormat || ext[1];

  if (format === 'yaml' || format === 'yml') {
    return writeFileSync(filePath, yaml.safeDump(data), { encoding: 'utf8' });
  }

  return outputJSONSync(filePath, data, { spaces: 2 });
}

/**
 * Performs a glob search for the given `pattern` and returns the first match.
 *
 * @param  {String} globPattern The glob pattern to search.
 * @return {String}             The the first found, matched file.
 */
function findConfigFile(globPattern) {
  if (!globPattern) {
    throw new Error('No glob pattern provided to search for!');
  }

  return glob.sync(globPattern)[0];
}

module.exports = {
  envHas,
  findConfigFile,
  readConfig,
  writeConfig,
};
