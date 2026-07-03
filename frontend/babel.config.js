module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 (SDK 54): the Worklets Babel plugin is auto-configured by
    // babel-preset-expo. Do NOT add 'react-native-reanimated/plugin' or
    // 'react-native-worklets/plugin' here — a manual entry conflicts with the
    // preset and breaks worklets at runtime (red screen in Expo Go).
  };
};
