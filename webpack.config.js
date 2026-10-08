const path = require("path");

module.exports = {
	context: __dirname,

	entry: {
		draftail_curlify: "./fpfwagtailcommon/curlify/client/draftail_curlify.js",
	},

	output: {
		path: path.resolve(__dirname, "fpfwagtailcommon/curlify/static/curlify/js"),
		// No content hash: wagtail_hooks.py references this file by name.
		filename: "[name].js",
	},

	module: {
		rules: [
			{
				// Babel settings belong in babel.config.js.
				test: /\.js$/,
				loader: "babel-loader",
				include: path.resolve(__dirname, "fpfwagtailcommon/curlify/client"),
			},
		],
	},
};
