// Google ML Kit has no arm64-simulator slice; skip on Appetize CI (arm64 simulator).
const isAppetizeSimulatorBuild = process.env.APPETIZE_BUILD === 'true';

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
    ...(isAppetizeSimulatorBuild
      ? {
          '@react-native-ml-kit/text-recognition': {
            platforms: {
              ios: null,
            },
          },
        }
      : {}),
  },
};
