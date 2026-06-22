module.exports = {
  project: {
    ios: {
      project: 'ios/CashnTech SCF.xcworkspace',
    },
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
