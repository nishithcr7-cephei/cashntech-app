module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['././assets/fonts'],
  dependencies: {
    'react-native-config': {
      platforms: {
        android: null, // Exclude from native autolinking (CMake codegen not available)
      },
    },
  },
};
