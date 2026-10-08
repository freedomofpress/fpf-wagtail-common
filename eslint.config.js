const { defineConfig } = require("eslint/config");
const fpfEslintConfig = require("./config/eslint.js");

module.exports = defineConfig([
	...fpfEslintConfig({
		files: ["fpfwagtailcommon/**/client/**/*.js"],
		// Webpack output
		ignores: ["fpfwagtailcommon/**/static/"],
	}),
]);
