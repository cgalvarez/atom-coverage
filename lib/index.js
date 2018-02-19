const { manager } = require('./manager');

function cacheOrInit() {
  if (global.AtomCoverage) {
    // Leverage global (cache) object and hook collector.
    manager.requireRoot = global.AtomCoverage.requireRoot;
    return;
  }

  // AtomCoverage uninitialized.
  manager.readConfig();
  global.AtomCoverage = { requireRoot: manager.requireRoot };
  manager.trackCoverage();
}

cacheOrInit();

module.exports = {
  testquire: manager.testquire.bind(manager),
};
