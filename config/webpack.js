const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const BundleTracker = require("webpack-bundle-tracker");

/**
 * Baseline webpack config shared by FPF Wagtail sites.
 *
 * Sources live in client/. Bundles and webpack-stats.json are written to
 * build/static/bundles/, which each site's `build` Django app serves at
 * /static/bundles/.
 *
 * @param {object} options
 * @param {string} options.rootDir - the site's root directory (its __dirname)
 * @param {Object<string, string>} options.entry - bundle name to entry file,
 *   relative to rootDir, e.g. { common: "client/common/js/common.js" }
 * @param {string[]} [options.sassLoadPaths=[]] - extra Sass load paths,
 *   relative to rootDir; node_modules is always included
 * @param {string} [options.sassAdditionalData] - Sass prepended to every file
 * @returns {Function} config function for webpack, `(env, argv) => config`
 */
module.exports = function fpfWebpackConfig({
	rootDir,
	entry,
	sassLoadPaths = [],
	sassAdditionalData,
}) {
	const srcDir = path.join(rootDir, "client");
	const distDir = path.join(rootDir, "build", "static", "bundles");

	// A function so the config is defined whenever it's loaded.
	return (env, argv) => {
		// The npm scripts pass --config-node-env, which sets NODE_ENV in the Node
		// process. Use an explicit --mode if given, else NODE_ENV, else webpack's
		// own default, and set `mode` below so this config and webpack agree.
		const mode =
			argv.mode ??
			(process.env.NODE_ENV === "development" ? "development" : "production");
		const isProd = mode === "production";

		// In the bundles themselves, webpack replaces process.env.NODE_ENV based
		// on `mode` (optimization.nodeEnv), so no DefinePlugin is needed.
		return {
			mode,

			// Each key is a separate JS (and extracted CSS) bundle.
			entry: Object.fromEntries(
				Object.entries(entry).map(([name, file]) => [
					name,
					path.resolve(rootDir, file),
				]),
			),

			// In production, file names get a content hash; in development they
			// are just the entry key. `clean` empties the output directory before
			// each build so dev bundles don't linger alongside production ones.
			output: {
				path: distDir,
				filename: isProd ? "[name]-[contenthash].js" : "[name].js",
				clean: true,
			},

			resolve: {
				extensions: [".js", ".jsx"],
			},

			module: {
				rules: [
					{
						// All other Babel settings belong in the site's babel.config.js.
						test: /\.jsx?$/,
						loader: "babel-loader",
						// Babel picks its env from NODE_ENV, which --mode alone doesn't set.
						// Pin it to the resolved mode so preset-react never emits jsxDEV
						// calls, which the production React runtime lacks.
						options: { envName: mode },
						include: [srcDir],
					},
					{
						test: /\.scss$/,
						use: [
							MiniCssExtractPlugin.loader,
							"css-loader",
							{
								loader: "sass-loader",
								options: {
									sassOptions: {
										loadPaths: [
											path.join(rootDir, "node_modules"),
											...sassLoadPaths.map((p) => path.resolve(rootDir, p)),
										],
										// Stops Sass adding a byte-order mark to CSS containing
										// non-ASCII characters. webpack concatenates these
										// fragments, so a BOM can end up invalidating selectors.
										charset: false,
									},
									...(sassAdditionalData === undefined
										? {}
										: { additionalData: sassAdditionalData }),
								},
							},
						],
					},
					{
						test: /\.css$/,
						use: [MiniCssExtractPlugin.loader, "css-loader"],
					},
					{
						test: /\.(png|svg|jpg|gif)$/,
						type: "asset/resource",
					},
					{
						test: /\.(woff|woff2|eot|ttf|otf)$/,
						type: "asset/resource",
					},
				],
			},

			plugins: [
				new MiniCssExtractPlugin({
					filename: isProd ? "[name]-[contenthash].css" : "[name].css",
					chunkFilename: isProd ? "[id]-[contenthash].css" : "[id].css",
				}),
				new BundleTracker({
					path: distDir,
					filename: "webpack-stats.json",
				}),
			],
		};
	};
};
