/**
 * Android project/build.gradle 配置
 * 添加厂商通道所需的 classpath 依赖
 */

import { ExpoConfig } from 'expo/config';
import { withProjectBuildGradle } from 'expo/config-plugins';
import { ResolvedJPushPluginProps, VendorChannelConfig } from '../types';
import { mergeContents } from '../utils/generateCode';
import { Validator } from '../utils/codeValidator';

/**
 * 生成厂商通道 classpath 依赖
 */
const getVendorClasspaths = (vendorChannels?: VendorChannelConfig): string => {
  const classpaths: string[] = [];

  if (vendorChannels?.fcm) {
    classpaths.push(`// Google Services for FCM`);
    classpaths.push(`classpath 'com.google.gms:google-services:4.4.0'`);
  }

  if (vendorChannels?.huawei) {
    classpaths.push(`// Huawei AGConnect`);
    classpaths.push(`classpath 'com.huawei.agconnect:agcp:1.9.3.302'`);
  }

  return classpaths.length > 0 ? classpaths.join('\n        ') : '';
};

/**
 * 配置 Android project/build.gradle
 */
export function withAndroidProjectBuildGradle(
  config: ExpoConfig,
  props: Pick<ResolvedJPushPluginProps, 'vendorChannels'>
): ExpoConfig {
  return withProjectBuildGradle(config, (nextConfig) => {
    const { vendorChannels } = props;
    const validator = new Validator(nextConfig.modResults.contents);

    if (vendorChannels?.huawei) {
      validator.register('jpush-huawei-maven-buildscript', (src) => {
        console.log(
          '\n[MX_JPush_Expo] 配置 buildscript repositories 华为 Maven 仓库 ...'
        );

        return mergeContents({
          src,
          newSrc: `maven { url 'https://developer.huawei.com/repo/' }`,
          tag: 'jpush-huawei-maven-buildscript',
          anchor: /buildscript\s*\{/,
          offset: 2,
          comment: '//',
        });
      });
    }

    if (vendorChannels?.honor) {
      validator.register('jpush-honor-maven-buildscript', (src) => {
        console.log(
          '\n[MX_JPush_Expo] 配置 buildscript repositories 荣耀 Maven 仓库 ...'
        );

        return mergeContents({
          src,
          newSrc: `maven { url 'https://developer.hihonor.com/repo' }`,
          tag: 'jpush-honor-maven-buildscript',
          anchor: /buildscript\s*\{/,
          offset: 2,
          comment: '//',
        });
      });
    }

    const classpaths = getVendorClasspaths(vendorChannels);
    if (classpaths) {
      validator.register('classpath', (src) => {
        console.log(
          '\n[MX_JPush_Expo] 配置 buildscript dependencies classpath ...'
        );

        return mergeContents({
          src,
          newSrc: classpaths,
          tag: 'jpush-vendor-classpaths',
          anchor: /dependencies\s*\{/,
          offset: 1,
          comment: '//',
        });
      });
    }

    if (vendorChannels?.huawei) {
      validator.register('jpush-huawei-maven-allprojects', (src) => {
        console.log(
          '\n[MX_JPush_Expo] 配置 allprojects repositories 华为 Maven 仓库 ...'
        );

        if (!/allprojects\s*\{/.test(src)) {
          return { contents: src, didMerge: false, didClear: false };
        }

        const hasRepositories = /allprojects\s*\{[^}]*repositories\s*\{/.test(src);

        if (hasRepositories) {
          return mergeContents({
            src,
            newSrc: `maven { url 'https://developer.huawei.com/repo/' }`,
            tag: 'jpush-huawei-maven-allprojects',
            anchor: /allprojects\s*\{/,
            offset: 2,
            comment: '//',
          });
        }

        return mergeContents({
          src,
          newSrc: `repositories {
        maven { url 'https://developer.huawei.com/repo/' }
    }`,
          tag: 'jpush-huawei-maven-allprojects',
          anchor: /allprojects\s*\{/,
          offset: 1,
          comment: '//',
        });
      });
    }

    if (vendorChannels?.honor) {
      validator.register('jpush-honor-maven-allprojects', (src) => {
        console.log(
          '\n[MX_JPush_Expo] 配置 allprojects repositories 荣耀 Maven 仓库 ...'
        );

        if (!/allprojects\s*\{/.test(src)) {
          return { contents: src, didMerge: false, didClear: false };
        }

        const hasRepositories = /allprojects\s*\{[^}]*repositories\s*\{/.test(src);

        if (hasRepositories) {
          return mergeContents({
            src,
            newSrc: `maven { url 'https://developer.hihonor.com/repo' }`,
            tag: 'jpush-honor-maven-allprojects',
            anchor: /allprojects\s*\{/,
            offset: 2,
            comment: '//',
          });
        }

        return mergeContents({
          src,
          newSrc: `repositories {
        maven { url 'https://developer.hihonor.com/repo' }
    }`,
          tag: 'jpush-honor-maven-allprojects',
          anchor: /allprojects\s*\{/,
          offset: 1,
          comment: '//',
        });
      });
    }

    nextConfig.modResults.contents = validator.invoke();
    return nextConfig;
  });
}
