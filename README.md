# fpf-wagtail-common

Shared Wagtail extensions for the Freedom of the Press Foundation Wagtail sites.

- [`fpfwagtailcommon.curlify`](#curlify) — a Draftail rich-text feature
  (`curlify`) that converts straight quotes to curly quotes.

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
