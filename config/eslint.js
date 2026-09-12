const js = require("@eslint/js");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const jsxA11y = require("eslint-plugin-jsx-a11y");
const importPlugin = require("eslint-plugin-import");
const prettier = require("eslint-config-prettier");
const globals = require("globals");

/**
 * @param {string[]} files - glob patterns for this project's JS/JSX source
 *   (varies per project, e.g. ["client/**\/*.js", "client/**\/*.jsx"])
 */
module.exports = function fpfEslintConfig(files) {
	return [
		{ files, ...js.configs.recommended },
		{ files, ...react.configs.flat.recommended },
		{ files, ...jsxA11y.flatConfigs.recommended },
		{ files, ...importPlugin.flatConfigs.recommended },
		{ files, ...prettier },

		{
			files,

			languageOptions: {
				// eslint-plugin-import's recommended config hardcodes ecmaVersion: 2018,
				// which is older than these projects' syntax (e.g. optional chaining).
				// Override it back to the ESLint default so parsing doesn't regress.
				ecmaVersion: "latest",
				globals: {
					...globals.browser,
					// webpack injects a `module` binding into each bundled chunk for
					// its Hot Module Replacement API (module.hot).
					module: "readonly",
					// Matomo/Piwik's tracking snippet defines this on `window` before
					// our bundles run.
					_paq: "readonly",
				},
			},

			settings: {
				react: {
					version: "detect",
				},
				"import/resolver": {
					webpack: {
						config: {
							extensions: [".js", ".jsx"],
						},
					},
				},
			},

			plugins: {
				"react-hooks": reactHooks,
			},

			rules: {
				"react-hooks/rules-of-hooks": "error",
				"react-hooks/exhaustive-deps": "warn",

				// Allow a leading underscore to mark a parameter as intentionally
				// unused, e.g. one kept only for signature consistency with sibling
				// callback functions.
				"no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

				// webpack.config.js in these projects only populates module.exports
				// when run via the build/start npm scripts (it branches on
				// npm_lifecycle_event), so requiring it here (e.g. from
				// eslint-import-resolver-webpack) yields an empty config and can't
				// actually resolve aliases or extension-less imports. Leave path
				// resolution unchecked until that export is restructured.
				"import/no-unresolved": "off",
			},
		},

		{
			files: ["**/*.test.js"],
			languageOptions: {
				globals: {
					...globals.jest,
				},
			},
		},
	];
};
