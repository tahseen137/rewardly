module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.property.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/**/__tests__/**'],
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/src/services/__tests__/setup.test.ts'],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/src/services/__mocks__/@react-native-async-storage/async-storage.ts',
    '^react-native$': '<rootDir>/src/services/__mocks__/react-native.ts',
    '^expo-apple-authentication$': '<rootDir>/src/services/__mocks__/expo-apple-authentication.ts',
  },
};
