from django.templatetags.static import static

from wagtail import hooks
from wagtail.admin.rich_text.editors.draftail.features import PluginFeature


@hooks.register("register_rich_text_features")
def register_curlify(features):
    feature_name = "curlify"
    features.default_features.append(feature_name)

    features.register_editor_plugin(
        "draftail",
        feature_name,
        PluginFeature(
            {
                "type": feature_name,
            },
            js=[
                static("curlify/js/draftail_curlify.js"),
            ],
        ),
    )
