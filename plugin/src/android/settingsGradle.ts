/**
 * Android settings.gradle 配置
 * 添加 JPush 模块引用
 */

import { ConfigPlugin, withSettingsGradle } from 'expo/config-plugins';
import { syncGeneratedContents } from '../utils/generateCode';

/**
 * 生成 JPush 模块配置
 */
const getJPushModules = (): string => {
  return `include ':jpush-react-native'
project(':jpush-react-native').projectDir = new File(rootProject.projectDir, '../node_modules/jpush-react-native/android')

include ':jcore-react-native'
project(':jcore-react-native').projectDir = new File(rootProject.projectDir, '../node_modules/jcore-react-native/android')`;
};

export function applyAndroidSettingsGradle(contents: string): string {
  return syncGeneratedContents({
    src: contents,
    newSrc: getJPushModules(),
    tag: 'jpush-modules',
    anchor: /include\s+['"]?:app['"]?/,
    offset: -1,
    comment: '//',
  }).contents;
}

/**
 * 配置 Android settings.gradle
 * 添加 jpush-react-native 和 jcore-react-native 模块
 */
export const withAndroidSettingsGradle: ConfigPlugin = (config) =>
  withSettingsGradle(config, (config) => {
    console.log('\n[MX_JPush_Expo] 配置 Android settings.gradle ...');
    config.modResults.contents = applyAndroidSettingsGradle(config.modResults.contents);
    return config;
  });
