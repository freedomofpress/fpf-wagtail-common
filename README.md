# fpf-wagtail-common

Shared configs and Wagtail extensions for the Freedom of the Press Foundation Wagtail sites.

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

`config/` holds base webpack, ESLint, Stylelint and Prettier configs for all
sites. Install with an npm `devDependency` pinned to a release tag:

```json
"fpf-wagtail-common": "github:freedomofpress/fpf-wagtail-common#v0.4.0"
```

Each site must also hold dependencies for the packages/plugins these configs use.

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

> [!IMPORTANT]
> When a site upgrades, bump both the wheel URL in `requirements.in` and the tag in `package.json`.
