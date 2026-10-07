module.exports = {
  preset: 'react-native',
  // Redux Toolkit / redux-saga ship ESM builds that Jest must transpile.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|immer|@reduxjs|redux-saga|@redux-saga|reselect|redux)/)',
  ],
};
