const { defineConfig, globalIgnores } = require("eslint/config");
const js = require("@eslint/js");
const importPlugin = require("eslint-plugin-import");
const globals = require("globals");

/**
 * Baseline ESLint flat config shared by FPF Wagtail sites.
 *
 * @param {object} options
 * @param {string[]} options.files - glob patterns for this project's
 *   browser source, e.g. ["client/**\/*.{js,jsx}"]
 * @param {boolean} [options.react=false] - enable React, JSX a11y and
 *   React hooks rules (requires the eslint-plugin-react* and
 *   eslint-plugin-jsx-a11y packages)
 * @param {string[]} [options.ignores=[]] - extra project-specific ignores
 * @param {string[]} [options.testFiles] - files that get Jest globals
 * @returns {object[]} config objects to spread into defineConfig()
 */
module.exports = function fpfEslintConfig({
	files,
	react = false,
	ignores = [],
	testFiles = ["**/*.test.js"],
}) {
	const source = {
		files,
		extends: [js.configs.recommended, importPlugin.flatConfigs.recommended],
		languageOptions: {
			// eslint-plugin-import's recommended config sets ecmaVersion: 2018,
			// which can't parse newer syntax such as optional chaining.
			ecmaVersion: "latest",
			globals: globals.browser,
		},
	};

	if (react) {
		// Required lazily so non-React projects don't need these installed.
		const reactPlugin = require("eslint-plugin-react");
		const reactHooks = require("eslint-plugin-react-hooks");
		const jsxA11y = require("eslint-plugin-jsx-a11y");

		source.extends.push(
			reactPlugin.configs.flat.recommended,
			jsxA11y.flatConfigs.recommended,
			importPlugin.flatConfigs.react,
		);
		source.plugins = { "react-hooks": reactHooks };
		source.settings = {
			react: {
				version: "detect",
			},
			"import/resolver": { node: { extensions: [".js", ".jsx"] } },
		};
		source.rules = {
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",

			// prop-types is going away in React 19
			"react/prop-types": "off",
		};
	}

	return defineConfig([
		globalIgnores(["build/", "**/coverage/", "htmlcov/", ".venv/", ...ignores]),

		source,

		{
			files: testFiles,
			languageOptions: {
				globals: globals.jest,
			},
		},

		{
			// Build tool configs at the repo root, which run in Node.
			files: ["*.config.{js,mjs}"],
			extends: [js.configs.recommended],
			languageOptions: {
				globals: globals.node,
			},
		},

		{
			files: ["*.config.js"],
			languageOptions: {
				sourceType: "commonjs",
			},
		},
	]);
};
