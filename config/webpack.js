const path = require("path");
const BundleTracker = require("webpack-bundle-tracker");

/**
 * Baseline webpack config shared by FPF Wagtail sites.
 *
 * Run webpack with --config-node-env production or development: it sets
 * NODE_ENV, from which webpack takes its mode and Babel its env, so production
 * builds don't get dev/debug JSX transforms.
 *
 * SCSS is compiled by sass-loader and emitted as CSS files by webpack's
 * built-in CSS support. webpack-stats.json is written to the site's root
 * directory for django-webpack-loader.
 *
 * @param {object} options
 * @param {string} options.rootDir - the site's root directory (its __dirname)
 * @param {object} options.entry - webpack entries, relative to rootDir,
 *   e.g. { common: "./client/common/js/common.js" }
 * @param {string} [options.srcDir="client"] - directory Babel transpiles,
 *   relative to rootDir
 * @param {string} [options.outputDir="build/static/bundles"] - directory
 *   bundles are written to, relative to rootDir
 * @returns {object} webpack config
 */
module.exports = function fpfWebpackConfig({
	rootDir,
	entry,
	srcDir = "client",
	outputDir = "build/static/bundles",
}) {
	return {
		context: rootDir,

		entry,

		output: {
			path: path.resolve(rootDir, outputDir),
			filename: "[name]-[contenthash].js",
			clean: true,
		},

		resolve: {
			extensions: [".js", ".jsx"],
		},

		module: {
			rules: [
				{
					// Babel settings belong in the site's babel.config.js.
					test: /\.jsx?$/,
					loader: "babel-loader",
					include: path.resolve(rootDir, srcDir),
				},
				{
					test: /\.scss$/,
					type: "css",
					loader: "sass-loader",
				},
			],
		},

		plugins: [new BundleTracker({ path: rootDir })],
	};
};
