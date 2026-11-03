const { defineConfig, globalIgnores } = require("eslint/config");
const js = require("@eslint/js");
const importPlugin = require("eslint-plugin-import");
const globals = require("globals");

/** Baseline ESLint flat config for FPF Wagtail sites; see the README for options. */
module.exports = function fpfEslintConfig({
	files,
	react = false,
	ignores = [],
	testFiles = ["**/*.test.js"],
}) {
	return defineConfig([
		globalIgnores(["build/", "**/coverage/", "htmlcov/", ".venv/", ...ignores]),

		{
			files,
			extends: [js.configs.recommended, importPlugin.flatConfigs.recommended],
			languageOptions: {
				// eslint-plugin-import's recommended config sets ecmaVersion: 2018,
				// which can't parse newer syntax such as optional chaining.
				ecmaVersion: "latest",
				globals: globals.browser,
			},
		},

		...(react ? [reactConfig(files)] : []),

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

function reactConfig(files) {
	// Required here rather than at the top so sites without React don't need
	// these plugins installed.
	const react = require("eslint-plugin-react");
	const reactHooks = require("eslint-plugin-react-hooks");
	const jsxA11y = require("eslint-plugin-jsx-a11y");

	return {
		files,
		extends: [
			react.configs.flat.recommended,
			jsxA11y.flatConfigs.recommended,
			importPlugin.flatConfigs.react,
		],
		plugins: {
			"react-hooks": reactHooks,
		},
		settings: {
			react: {
				version: "detect",
			},
			"import/resolver": { node: { extensions: [".js", ".jsx"] } },
		},
		rules: {
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",

			// prop-types is going away in React 19
			"react/prop-types": "off",
		},
	};
}
