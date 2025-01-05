module.exports = {
    rootDir: './',
    testEnvironment: 'node',
    testMatch: [
      '**/tests/unit/**/*.test.js',
      '**/tests/integration/**/*.test.js'
    ],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/index.js'
    ],
    moduleDirectories: ['node_modules', 'src'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testPathIgnorePatterns: ['/node_modules/'],
    verbose: true,
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1'
    }
  };