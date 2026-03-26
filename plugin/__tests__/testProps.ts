import { ExpoConfig } from 'expo/config';
import { JPushPluginProps } from '../src/types';

export const TEST_EXPO_CONFIG: ExpoConfig = {
  name: 'app',
  slug: 'app',
  version: '1.0.0',
};

export const TEST_PLUGIN_PROPS: JPushPluginProps = {
  appKey: 'tp-key',
  channel: 'tp-chan',
  packageName: 'com.example.test',
};

export function createExpoConfig(): ExpoConfig {
  return { ...TEST_EXPO_CONFIG };
}

export function createPluginProps(
  overrides: Partial<JPushPluginProps> = {}
): JPushPluginProps {
  return {
    ...TEST_PLUGIN_PROPS,
    ...overrides,
  };
}
