import { resolve } from "path";
import webpack from "webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import merge from "webpack-merge"

const ROOT = __dirname

const PROJECT_NAME = "light-template"

const BASE_CONFIG = {
	mode: "production",
	entry: {
		// PROJECT_NAME: resolve(ROOT, "src/index.ts"),
		[PROJECT_NAME]: resolve(ROOT, "lib/esm/index.js")
	},
	output: {
		path: resolve(ROOT, "lib/browser"),
		library: 'LIGHT_TEMPLATE',
	},
	resolve: {
		extensions: [".js", ".ts"]
	},
	module: {
		rules: [
			{
				test: /\.(ts)$/,
				loader: "ts-loader",
				options: {
					configFile: resolve(ROOT, "./src/tsconfig.esm.json")
				}
			},
		]
	},
	plugins: [
		new webpack.BannerPlugin(
			`Copyright (c) 2019 light0x00
		Licensed under the MIT License (MIT), see
		https://github.com/light0x00/${PROJECT_NAME}`),
	]
}

const FAT_PROFILE = merge(BASE_CONFIG, {
	output: {
		filename: "[name].js",
	},
	optimization: {
		minimize: false,
	}
})

const MINIFY_PROFILE = merge(BASE_CONFIG, {
	output: {
		filename: "[name].min.js",
	},
	plugins: [
		// new BundleAnalyzerPlugin({
		// 	analyzerMode: "static",
		// 	reportFilename: "analyzer-report.html",
		// 	openAnalyzer: false,
		// })
	]
})

export default [
	FAT_PROFILE, MINIFY_PROFILE
]