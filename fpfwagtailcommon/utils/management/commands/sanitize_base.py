import argparse
import json
from dataclasses import dataclass, field
from typing import Any

from django.apps import apps
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Model


@dataclass
class SanitizationProfile:
    """Configuration for sanitization operations

    Attributes:
        mangle_tables:  Map of {app_label.ModelName: {field: overwrite value}}
                        All rows of each model will be updated. String
                        values may contain {name} placeholders, filled
                        in from --replace name=value.
        truncate_tables: List of "app_label.ModelName" models to delete all
                        rows from, in order.
    """

    mangle_tables: dict[str, dict[str, Any]] = field(default_factory=dict)
    truncate_tables: list[str] = field(default_factory=list)


class SanitizeBaseCommand(BaseCommand):
    """Base command to sanitize a database in-place based on a profile

    This command, once it's been subclassed with a SanitizationProfile, will use that
    SanitizationProfile to modify values in the database per the profile's
    mangle_tables values, and will delete rows from the database per the profile's
    truncate_tables values.
    """

    help = (
        "Sanitize a production database dump so that it can be backported to "
        "a non-production environment."
    )

    profile: SanitizationProfile | None = None

    def add_arguments(self, parser):
        parser.add_argument(
            "-Y",
            "--yes",
            "--confirm",
            dest="confirm",
            help="Skip the confirmation prompt",
            action="store_true",
        )
        parser.add_argument(
            "-r",
            "--replace",
            nargs="+",
            action="extend",
            default=[],
            type=parse_name_value,
            metavar="NAME=VALUE",
            help="Fill in a {NAME} placeholder in the profile's mangle_tables",
        )
        parser.add_argument(
            "--no-truncate",
            nargs="+",
            action="extend",
            default=[],
            metavar="LABEL",
            help="Skip app or app.Model from the profile's truncate_tables",
        )
        parser.add_argument(
            "--no-mangle",
            nargs="+",
            action="extend",
            default=[],
            metavar="LABEL",
            help="Skip app or app.Model from the profile's mangle_tables",
        )

    def handle(self, *args, **options):
        # Ensure that subclasses provide a profile, so this cannot be run
        # unintentionally
        if self.profile is None:
            raise CommandError("Subclasses must define profile: SanitizationProfile.")

        replacements = dict(options["replace"])
        no_truncate = options["no_truncate"]
        no_mangle = options["no_mangle"]

        # Resolve labels and fill placeholders up front so we can fail early
        truncate_models = [get_model(label) for label in self.profile.truncate_tables]
        mangle_models = {
            get_model(label): {
                name: format_value(value, replacements)
                for name, value in updates.items()
            }
            for label, updates in self.profile.mangle_tables.items()
        }

        truncate_models = [
            model
            for model in truncate_models
            if not model_in_labels(model, no_truncate)
        ]
        mangle_models = {
            model: updates
            for model, updates in mangle_models.items()
            if not model_in_labels(model, no_mangle)
        }

        if not options["confirm"]:
            # Provide a summary based of the profile to apply, including replacements
            # in mangle_tables.
            summary = {
                "mangle_tables": {
                    model._meta.label: updates
                    for model, updates in mangle_models.items()
                },
                "truncate_tables": [model._meta.label for model in truncate_models],
            }
            self.stderr.write(
                f"Sanitization profile:\n{json.dumps(summary, indent=2, default=str)}"
            )
            answer = input("Continue with database sanitization? [yes/NO]: ")
            if answer.lower().strip() not in ("y", "yes"):
                raise CommandError("Operation cancelled by user")

        with transaction.atomic():
            for model in truncate_models:
                # Use the base manager so custom default managers can't hide anything
                count, _ = model._base_manager.all().delete()
                self.stdout.write(
                    f"Truncated {model._meta.label}: deleted {count} rows"
                )
            for model, updates in mangle_models.items():
                model._base_manager.update(**updates)
                self.stdout.write(f"Mangled {model._meta.label}: set {list(updates)}")

        self.stdout.write("Sanitization complete.")


def parse_name_value(item: str) -> tuple[str, str]:
    """Parse a NAME=VALUE command-line argument"""
    try:
        name, value = item.split("=", 1)
    except ValueError:
        raise argparse.ArgumentTypeError(f"expected NAME=VALUE, got {item!r}")
    return name, value


def format_value(value: Any, replacements: dict[str, str]) -> Any:
    """Fill {name} placeholders in a string mangle value"""
    if not isinstance(value, str):
        return value
    try:
        return value.format_map(replacements)
    except KeyError as e:
        raise CommandError(f"Missing --replace value for {e}.")


def get_model(label: str) -> type[Model]:
    """Return the model for a dotted app_label.ModelName label"""
    try:
        return apps.get_model(label)
    except ValueError:
        # app registry couldn't split this into app_label, model_name
        raise CommandError(f"Expected app_label.ModelName, got {label!r}.")
    except LookupError:
        raise CommandError(f"Could not find a Django model for {label!r}.")


def model_in_labels(model: type[Model], labels: list[str]) -> bool:
    """Whether model matches any app_label or app_label.ModelName."""
    for label in labels:
        app_label, _, model_name = label.partition(".")
        if model._meta.app_label == app_label and (
            not model_name or model._meta.model_name == model_name.lower()
        ):
            return True
    return False
