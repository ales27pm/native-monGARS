const NativeModules = require('react-native/Libraries/BatchedBridge/NativeModules');

// Ensure UIManager and NativeUnimoduleProxy exist before jest-expo setup runs
if (!NativeModules.UIManager) {
  NativeModules.UIManager = {};
}
if (!NativeModules.NativeUnimoduleProxy) {
  NativeModules.NativeUnimoduleProxy = { viewManagersMetadata: {} };
}
