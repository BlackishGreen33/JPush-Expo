import fs from 'fs';
import path from 'path';
import { applyAndroidManifestMetaData } from '../src/android/androidManifest';
import { applyAndroidAppBuildGradle } from '../src/android/appBuildGradle';
import { applyAndroidGradleProperties } from '../src/android/gradleProperties';
import { applyAndroidProjectBuildGradle } from '../src/android/projectBuildGradle';
import { applyAndroidSettingsGradle } from '../src/android/settingsGradle';
import { setConfig } from '../src/utils/config';

const readFixture = (fixturePath: string): string =>
  fs.readFileSync(path.join(__dirname, 'fixtures', fixturePath), 'utf8');

describe('Android transforms', () => {
  beforeEach(() => {
    setConfig('demo-app-key', 'demo-channel', 'com.demo.app', false, undefined);
  });

  it('should inject app/build.gradle for enabled vendors and remain idempotent', () => {
    setConfig('demo-app-key', 'demo-channel', 'com.demo.app', false, {
      fcm: { enabled: true },
      huawei: { enabled: true },
      xiaomi: { appId: 'xiaomi-id', appKey: 'xiaomi-key' },
    });

    const fixture = readFixture('android/app-build.gradle.fixture');
    const transformed = applyAndroidAppBuildGradle(fixture);
    const repeated = applyAndroidAppBuildGradle(transformed);

    expect(transformed).toContain('defaultConfig {');
    expect(transformed).toContain('manifestPlaceholders = [');
    expect(transformed).toContain(`implementation 'cn.jiguang.sdk.plugin:huawei:5.9.0'`);
    expect(transformed).toContain(`implementation 'cn.jiguang.sdk.plugin:fcm:5.9.0'`);
    expect(transformed).toContain(`implementation 'cn.jiguang.sdk.plugin:xiaomi:5.9.0'`);
    expect(transformed).toContain(`apply plugin: 'com.google.gms.google-services'`);
    expect(transformed).toContain(`apply plugin: 'com.huawei.agconnect'`);
    expect(repeated).toBe(transformed);
  });

  it('should remove vendor-only app/build.gradle sections when vendors are disabled', () => {
    const fixture = readFixture('android/app-build.gradle.fixture');

    setConfig('demo-app-key', 'demo-channel', 'com.demo.app', false, {
      fcm: { enabled: true },
      huawei: { enabled: true },
      oppo: { appId: 'oppo-id', appKey: 'oppo-key', appSecret: 'oppo-secret' },
    });
    const enabled = applyAndroidAppBuildGradle(fixture);

    setConfig('demo-app-key', 'demo-channel', 'com.demo.app', false, undefined);
    const disabled = applyAndroidAppBuildGradle(enabled);

    expect(disabled).toContain(`implementation project(':jpush-react-native')`);
    expect(disabled).not.toContain(`com.google.firebase:firebase-messaging`);
    expect(disabled).not.toContain(`cn.jiguang.sdk.plugin:huawei:5.9.0`);
    expect(disabled).not.toContain(`cn.jiguang.sdk.plugin:oppo:5.9.0`);
    expect(disabled).not.toContain(`apply plugin: 'com.google.gms.google-services'`);
    expect(disabled).not.toContain(`apply plugin: 'com.huawei.agconnect'`);
  });

  it('should inject and remove project/build.gradle vendor sections', () => {
    const fixture = readFixture('android/project-build.gradle.fixture');

    setConfig('demo-app-key', 'demo-channel', 'com.demo.app', false, {
      fcm: { enabled: true },
      huawei: { enabled: true },
      honor: { appId: 'honor-id' },
    });
    const enabled = applyAndroidProjectBuildGradle(fixture);
    const repeated = applyAndroidProjectBuildGradle(enabled);

    expect(enabled).toContain(`classpath 'com.google.gms:google-services:4.4.0'`);
    expect(enabled).toContain(`classpath 'com.huawei.agconnect:agcp:1.9.3.302'`);
    expect(enabled).toContain(`https://developer.huawei.com/repo/`);
    expect(enabled).toContain(`https://developer.hihonor.com/repo`);
    expect(repeated).toBe(enabled);

    setConfig('demo-app-key', 'demo-channel', 'com.demo.app', false, undefined);
    const disabled = applyAndroidProjectBuildGradle(enabled);

    expect(disabled).not.toContain(`com.google.gms:google-services`);
    expect(disabled).not.toContain(`com.huawei.agconnect:agcp`);
    expect(disabled).not.toContain(`developer.huawei.com/repo`);
    expect(disabled).not.toContain(`developer.hihonor.com/repo`);
  });

  it('should inject settings.gradle modules only once', () => {
    const fixture = readFixture('android/settings.gradle.fixture');
    const transformed = applyAndroidSettingsGradle(fixture);
    const repeated = applyAndroidSettingsGradle(transformed);

    expect(transformed).toContain(`include ':jpush-react-native'`);
    expect(transformed).toContain(`include ':jcore-react-native'`);
    expect(repeated.match(/include ':jpush-react-native'/g)).toHaveLength(1);
  });

  it('should add AndroidManifest metadata and keep it idempotent', () => {
    const application = {
      $: {
        'android:name': '.MainApplication',
      },
      'meta-data': [],
    } as any;

    applyAndroidManifestMetaData(application);
    applyAndroidManifestMetaData(application);

    expect(application['meta-data']).toHaveLength(2);
    expect(application['meta-data'][0].$['android:name']).toBe('JPUSH_CHANNEL');
    expect(application['meta-data'][1].$['android:name']).toBe('JPUSH_APPKEY');
  });

  it('should add gradle.properties compatibility only for Huawei', () => {
    setConfig('demo-app-key', 'demo-channel', 'com.demo.app', false, {
      huawei: { enabled: true },
    });

    const withHuawei = applyAndroidGradleProperties([]);
    expect(withHuawei).toEqual([
      {
        type: 'property',
        key: 'apmsInstrumentationEnabled',
        value: 'false',
      },
    ]);

    setConfig('demo-app-key', 'demo-channel', 'com.demo.app', false, undefined);
    const withoutHuawei = applyAndroidGradleProperties(withHuawei);
    expect(withoutHuawei).toBe(withHuawei);
  });
});
