/**
 * iOS Info.plist 配置
 * 参考: https://juejin.cn/post/7554288083597885467
 */

import { ConfigPlugin, withInfoPlist } from "expo/config-plugins";
import { getAppKey, getApsForProduction, getChannel } from "../utils/config";

const REQUIRED_BACKGROUND_MODES = ["fetch", "remote-notification"] as const;

function mergeBackgroundModes(
	existingModes: string[] | string | undefined,
): string[] {
	const mergedModes = new Set(
		Array.isArray(existingModes)
			? existingModes
			: typeof existingModes === "string"
				? [existingModes]
				: [],
	);

	for (const mode of REQUIRED_BACKGROUND_MODES) {
		mergedModes.add(mode);
	}

	return Array.from(mergedModes);
}

/**
 * 配置 iOS Info.plist
 * 添加推送通知所需的后台模式
 */
export const withIosInfoPlist: ConfigPlugin = (config) =>
	withInfoPlist(config, (config) => {
		// 添加后台模式支持（推送通知必需）
		config.modResults.UIBackgroundModes = mergeBackgroundModes(
			config.modResults.UIBackgroundModes,
		);
		config.modResults.JPUSH_APPKEY = getAppKey();
		config.modResults.JPUSH_CHANNEL = getChannel();
		config.modResults.JPUSH_APS_FOR_PRODUCTION = getApsForProduction();

		return config;
	});
