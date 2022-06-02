const { defaults } = require("jest-config");
module.exports = {
  // ...
  moduleFileExtensions: [...defaults.moduleFileExtensions],
  testTimeout: 500000,
  // testResultsProcessor: "./node_modules/jest-html-reporter",
  // ...
};
