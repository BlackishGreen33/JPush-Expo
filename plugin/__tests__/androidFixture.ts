import { compileModsAsync } from 'expo/config-plugins';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import withJPush from '../src';
import { JPushPluginProps } from '../src/types';
import { createExpoConfig, createPluginProps } from './testProps';

export const FIXTURE_ROOT = path.join(__dirname, 'fixtures', 'android-project');
export const APP_BUILD_GRADLE_PATH = ['android', 'app', 'build.gradle'];
export const ANDROID_MANIFEST_PATH = [
  'android',
  'app',
  'src',
  'main',
  'AndroidManifest.xml',
];
export const PROJECT_BUILD_GRADLE_PATH = ['android', 'build.gradle'];
export const SETTINGS_GRADLE_PATH = ['android', 'settings.gradle'];
export const GRADLE_PROPERTIES_PATH = ['android', 'gradle.properties'];

const tempProjectRoots: string[] = [];

export function registerAndroidFixtureLifecycleHooks(): void {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();

    while (tempProjectRoots.length > 0) {
      const projectRoot = tempProjectRoots.pop();
      if (projectRoot) {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });
}

export function getFixturePath(projectRoot: string, segments: string[]): string {
  return path.join(projectRoot, ...segments);
}

export function createProjectRoot(): string {
  const projectRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'mx-jpush-android-')
  );
  fs.cpSync(FIXTURE_ROOT, projectRoot, { recursive: true });
  tempProjectRoots.push(projectRoot);
  return projectRoot;
}

export function readFixtureFile(
  projectRoot: string,
  segments: string[]
): string {
  return fs.readFileSync(getFixturePath(projectRoot, segments), 'utf8');
}

export async function compileAndroidMods(
  projectRoot: string,
  propsOverrides: Partial<JPushPluginProps> = {}
): Promise<void> {
  const config = withJPush(
    createExpoConfig(),
    createPluginProps(propsOverrides)
  );

  await compileModsAsync(config, {
    projectRoot,
    platforms: ['android'],
  });
}
