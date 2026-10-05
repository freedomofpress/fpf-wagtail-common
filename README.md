# fpf-wagtail-common

Shared Wagtail extensions for the Freedom of the Press Foundation Wagtail sites.

- [`fpfwagtailcommon.curlify`](#curlify) — a Draftail rich-text feature
  (`curlify`) that converts straight quotes to curly quotes.
- [Shared configs](#shared-configs) — baseline webpack, ESLint, Stylelint and
  Prettier configs for the sites.

## Curlify

### Installation

```python
INSTALLED_APPS = [
    # ...
    "fpfwagtailcommon.curlify",
]
```

The `curlify` app registers a `curlify` Draftail feature and appends it to the
default rich-text features. Enable it explicitly in a feature list, e.g.:

```python
WAGTAILADMIN_RICH_TEXT_EDITORS = {
    "default": {
        "WIDGET": "wagtail.admin.rich_text.DraftailRichTextArea",
        "OPTIONS": {"features": ["bold", "italic", "link", "curlify"]},
    },
}
```

## Shared configs

Install the package from a tag as an npm devDependency:

```json
"fpf-wagtail-common": "github:freedomofpress/fpf-wagtail-common#v0.2.0"
```

The tools themselves are optional peer dependencies, so each site keeps
installing its own webpack and loaders, `eslint`, `stylelint`, `prettier` and
plugins.

The configs are looked up from the site's own `node_modules`, so pre-commit
hooks only find them after `npm ci`; listing this package under a hook's
`additional_dependencies` is not enough.

**Prettier** — in `package.json`:

```json
"prettier": "fpf-wagtail-common/config/prettier.json"
```

**Stylelint** — in `.stylelintrc.json`:

```json
{ "extends": ["fpf-wagtail-common/config/stylelint.json"] }
```

**ESLint** — `config/eslint.js` exports a function returning flat config
objects; spread them into `defineConfig()` and add site-specific overrides
after them:

```js
const { defineConfig } = require("eslint/config");
const fpfEslintConfig = require("fpf-wagtail-common/config/eslint.js");

module.exports = defineConfig([
	...fpfEslintConfig({
		files: ["client/**/*.{js,jsx}"],
		react: true, // needs eslint-plugin-react, -react-hooks and -jsx-a11y
		ignores: ["static/"],
	}),
]);
```

**webpack** — `config/webpack.js` exports a function taking the site's options
and returning a webpack config function. It assumes the shared layout: sources
in `client/`, and bundles plus `webpack-stats.json` written to
`build/static/bundles/`, served by a `build` Django app. Run webpack with
`--config-node-env production` or `development`.

```js
const fpfWebpackConfig = require("fpf-wagtail-common/config/webpack.js");

module.exports = fpfWebpackConfig({
	rootDir: __dirname,
	entry: { common: "client/common/js/common.js" },
	sassLoadPaths: ["client/common/scss/"], // optional; node_modules is included
	sassAdditionalData: '$static-url: "/static/";', // optional
});
```

## Releases and using downstream

This library is automatically versioned by
[poetry-dynamic-versioning](https://github.com/mtkennerly/poetry-dynamic-versioning).
To make a new release that can be consumed by downstream projects, create a
new [GitHub Release](https://github.com/freedomofpress/fpf-wagtail-common/releases).
Ensure the tag is [PEP 440](https://peps.python.org/pep-0440/) formatted,
`v<MAJOR>.<MINOR>.<PATCH>`, e.g. `v1.2.3`. Optional prerelease segements are also
supported, e.g. `v1.2.3rc1`.

Once the release is created, the
[publish.yml workflow](https://github.com/freedomofpress/fpf-wagtail-common/blob/main/.github/workflows/publish.yml)
will build and attach a wheel file to the release. Use this wheel as a dependency
in downstream projects.
