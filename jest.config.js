// Test configuration for Jest
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleFileExtensions: ['js', 'json'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/firebase-config.js',
    '!**/node_modules/**'
  ],
  coverageReporters: ['html', 'text', 'lcov'],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 10000
};
