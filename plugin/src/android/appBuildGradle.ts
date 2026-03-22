/**
 * Android app/build.gradle 配置
 * 添加 JPush 依赖和 manifestPlaceholders
 */

import { ExpoConfig } from 'expo/config';
import { withAppBuildGradle } from 'expo/config-plugins';
import { ResolvedJPushPluginProps, VendorChannelConfig } from '../types';
import { mergeContents } from '../utils/generateCode';
import { Validator } from '../utils/codeValidator';

/**
 * 生成 NDK abiFilters 配置
 */
const getNdkConfig = (): string => {
  return `ndk {
                //选择要添加的对应 cpu 类型的 .so 库。
                abiFilters 'arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'
            }`;
};

/**
 * 生成 manifestPlaceholders 代码
 */
const gradleEnv = (key: string, fallback = '""'): string =>
  `System.getenv("${key}") ?: (project.findProperty("${key}") ?: ${fallback})`;

const getManifestPlaceholders = (
  packageName: string,
  vendorChannels?: VendorChannelConfig
): string => {
  const placeholders: string[] = [
    `JPUSH_PKGNAME: ${gradleEnv('JPUSH_PKGNAME', `"${packageName}"`)}`,
    `JPUSH_APPKEY: ${gradleEnv('JPUSH_APP_KEY')}`,
    `JPUSH_CHANNEL: ${gradleEnv('JPUSH_CHANNEL')}`,
  ];

  if (vendorChannels?.meizu) {
    placeholders.push(`MEIZU_APPKEY: ${gradleEnv('JPUSH_MEIZU_APP_KEY')}`);
    placeholders.push(`MEIZU_APPID: ${gradleEnv('JPUSH_MEIZU_APP_ID')}`);
  }

  if (vendorChannels?.xiaomi) {
    placeholders.push(`XIAOMI_APPID: ${gradleEnv('JPUSH_XIAOMI_APP_ID')}`);
    placeholders.push(`XIAOMI_APPKEY: ${gradleEnv('JPUSH_XIAOMI_APP_KEY')}`);
  }

  if (vendorChannels?.oppo) {
    placeholders.push(`OPPO_APPKEY: ${gradleEnv('JPUSH_OPPO_APP_KEY')}`);
    placeholders.push(`OPPO_APPID: ${gradleEnv('JPUSH_OPPO_APP_ID')}`);
    placeholders.push(`OPPO_APPSECRET: ${gradleEnv('JPUSH_OPPO_APP_SECRET')}`);
  }

  if (vendorChannels?.vivo) {
    placeholders.push(`VIVO_APPKEY: ${gradleEnv('JPUSH_VIVO_APP_KEY')}`);
    placeholders.push(`VIVO_APPID: ${gradleEnv('JPUSH_VIVO_APP_ID')}`);
  }

  if (vendorChannels?.honor) {
    placeholders.push(`HONOR_APPID: ${gradleEnv('JPUSH_HONOR_APP_ID')}`);
  }

  if (vendorChannels?.nio) {
    placeholders.push(`NIO_APPID: ${gradleEnv('JPUSH_NIO_APP_ID')}`);
  }

  return `manifestPlaceholders = [
                ${placeholders.join(',\n                ')}
            ]`;
};

/**
 * 生成 JPush SDK 依赖代码
 */
const getJPushDependencies = (
  vendorChannels?: VendorChannelConfig
): string => {
  const dependencies: string[] = [
    `// JPush React Native 桥接（已包含 JPush 核心 SDK）`,
    `implementation project(':jpush-react-native')`,
    `implementation project(':jcore-react-native')`,
  ];

  if (vendorChannels) {
    const hasVendorChannels = Object.keys(vendorChannels).length > 0;
    if (hasVendorChannels) {
      dependencies.push(``, `// 厂商通道 SDK（JPush 5.9.0）`);
    }

    if (vendorChannels.huawei) {
      dependencies.push(
        `// 华为厂商`,
        `implementation 'com.huawei.hms:push:6.13.0.300'`,
        `implementation 'com.huawei.agconnect:agconnect-core:1.9.3.302'`,
        `implementation 'cn.jiguang.sdk.plugin:huawei:5.9.0'`
      );
    }

    if (vendorChannels.fcm) {
      dependencies.push(
        `// FCM 厂商`,
        `implementation 'com.google.firebase:firebase-messaging:24.1.0'`,
        `implementation 'cn.jiguang.sdk.plugin:fcm:5.9.0'`
      );
    }

    if (vendorChannels.meizu) {
      dependencies.push(
        `// 魅族厂商`,
        `implementation 'cn.jiguang.sdk.plugin:meizu:5.9.0'`
      );
    }

    if (vendorChannels.vivo) {
      dependencies.push(
        `// VIVO 厂商`,
        `implementation 'cn.jiguang.sdk.plugin:vivo:5.9.0'`
      );
    }

    if (vendorChannels.xiaomi) {
      dependencies.push(
        `// 小米厂商`,
        `implementation 'cn.jiguang.sdk.plugin:xiaomi:5.9.0'`
      );
    }

    if (vendorChannels.oppo) {
      dependencies.push(
        `// OPPO 厂商`,
        `implementation 'cn.jiguang.sdk.plugin:oppo:5.9.0'`,
        `// OPPO 3.1.0 aar 及其以上版本需要添加以下依赖`,
        `implementation 'com.google.code.gson:gson:2.6.2'`,
        `implementation 'androidx.annotation:annotation:1.1.0'`
      );
    }

    if (vendorChannels.honor) {
      dependencies.push(
        `// 荣耀厂商`,
        `implementation 'cn.jiguang.sdk.plugin:honor:5.9.0'`
      );
    }

    if (vendorChannels.nio) {
      dependencies.push(
        `// 蔚来厂商`,
        `implementation 'cn.jiguang.sdk.plugin:nio:5.9.0'`
      );
    }
  }

  return dependencies.join('\n    ');
};

/**
 * 生成 apply plugin 语句
 */
const getApplyPlugins = (vendorChannels?: VendorChannelConfig): string => {
  const plugins: string[] = [];

  if (vendorChannels?.fcm) {
    plugins.push(`apply plugin: 'com.google.gms.google-services'`);
  }

  if (vendorChannels?.huawei) {
    plugins.push(`apply plugin: 'com.huawei.agconnect'`);
  }

  return plugins.length > 0 ? plugins.join('\n') : '';
};

/**
 * 配置 Android build.gradle
 */
export function withAndroidAppBuildGradle(
  config: ExpoConfig,
  props: Pick<ResolvedJPushPluginProps, 'packageName' | 'vendorChannels'>
): ExpoConfig {
  return withAppBuildGradle(config, (nextConfig) => {
    const validator = new Validator(nextConfig.modResults.contents);

    validator.register('abiFilters', (src) => {
      console.log('\n[MX_JPush_Expo] 配置 build.gradle NDK abiFilters ...');

      return mergeContents({
        src,
        newSrc: getNdkConfig(),
        tag: 'jpush-ndk-config',
        anchor: /versionName\s+["'][\d.]+["']/,
        offset: 1,
        comment: '//',
      });
    });

    validator.register('JPUSH_APPKEY', (src) => {
      console.log(
        '\n[MX_JPush_Expo] 配置 build.gradle manifestPlaceholders ...'
      );

      return mergeContents({
        src,
        newSrc: getManifestPlaceholders(props.packageName, props.vendorChannels),
        tag: 'jpush-manifest-placeholders',
        anchor: /defaultConfig\s*\{/,
        offset: 1,
        comment: '//',
      });
    });

    validator.register('fileTree', (src) => {
      console.log('\n[MX_JPush_Expo] 配置 build.gradle libs 目录依赖 ...');

      return mergeContents({
        src,
        newSrc: `implementation fileTree(include: ['*.jar','*.aar'], dir: 'libs')`,
        tag: 'jpush-libs-filetree',
        anchor: /dependencies \{/,
        offset: 1,
        comment: '//',
      });
    });

    validator.register("implementation project(':jpush-react-native')", (src) => {
      console.log('\n[MX_JPush_Expo] 配置 build.gradle dependencies ...');

      return mergeContents({
        src,
        newSrc: getJPushDependencies(props.vendorChannels),
        tag: 'jpush-dependencies',
        anchor: /dependencies \{/,
        offset: 1,
        comment: '//',
      });
    });

    const applyPlugins = getApplyPlugins(props.vendorChannels);
    if (applyPlugins) {
      validator.register('apply plugin:', (src) => {
        console.log('\n[MX_JPush_Expo] 配置 build.gradle apply plugins ...');

        if (src.includes('// @generated begin jpush-apply-plugins')) {
          return { contents: src, didMerge: false, didClear: false };
        }

        const newContents =
          src +
          '\n\n// @generated begin jpush-apply-plugins - expo prebuild (DO NOT MODIFY)\n' +
          applyPlugins +
          '\n// @generated end jpush-apply-plugins\n';

        return { contents: newContents, didMerge: true, didClear: false };
      });
    }

    nextConfig.modResults.contents = validator.invoke();
    return nextConfig;
  });
}
