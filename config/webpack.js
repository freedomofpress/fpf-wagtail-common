const path = require("path");
const BundleTracker = require("webpack-bundle-tracker");

/** Baseline webpack config for FPF Wagtail sites. */
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
					test: /\.jsx?$/,
					// Babel reads its env from NODE_ENV, which is set by --config-node-env,
					// so prod builds don't get dev/debug JSX transforms.
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
