#!/usr/bin/env node

const { manager } = require('../lib/manager');

// Since user is invoking `atom-coverage`, s/he explicitly requests code
// coverage. Set up and configure environment variables properly.
process.env.COVERAGE = 'on';
process.env.NODE_ENV = 'test';

manager.readConfig(true);
manager.runTestsWithCoverage();
