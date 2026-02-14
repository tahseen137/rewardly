// Mock for react-native in Jest (Node.js environment)
export const Platform = {
  OS: 'ios',
  select: (specifics: any) => specifics.ios ?? specifics.default,
};

export const NativeModules = {
  SettingsManager: {
    settings: {
      AppleLocale: 'en_CA',
      AppleLanguages: ['en-CA'],
    },
  },
};

export default {
  Platform,
  NativeModules,
};
