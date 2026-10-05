from argparse import ArgumentTypeError
from io import StringIO
from unittest import mock

from django.contrib.auth.models import Group, User
from django.contrib.sessions.models import Session
from django.core.management import CommandError, call_command
from django.test import SimpleTestCase, TestCase
from django.utils import timezone

from fpfwagtailcommon.utils.management.commands.sanitize_base import (
    SanitizationProfile,
    SanitizeBaseCommand,
    format_value,
    get_model,
    model_in_labels,
    parse_name_value,
)


class ParseNameValueTestCase(SimpleTestCase):
    def test_parses(self):
        self.assertEqual(parse_name_value("a=b"), ("a", "b"))
        self.assertEqual(parse_name_value("a=b=c"), ("a", "b=c"))

    def test_invalid(self):
        with self.assertRaisesMessage(ArgumentTypeError, "NAME=VALUE"):
            parse_name_value("a")


class FormatValueTestCase(SimpleTestCase):
    def test_fills_placeholders(self):
        self.assertEqual(format_value("{a}.{b}", {"a": "x", "b": "y"}), "x.y")

    def test_non_string_unchanged(self):
        self.assertIs(format_value(False, {}), False)

    def test_missing_replacement(self):
        with self.assertRaisesMessage(CommandError, "'a'"):
            format_value("{a}", {})


class GetModelTestCase(SimpleTestCase):
    def test_resolves(self):
        self.assertIs(get_model("auth.User"), User)
        self.assertIs(get_model("auth.user"), User)

    def test_invalid(self):
        for label in ("auth", "auth_user", "a.b.c", "auth.Nope", "nope.User"):
            with self.subTest(label=label), self.assertRaises(CommandError):
                get_model(label)


class ModelInLabelsTestCase(SimpleTestCase):
    def test_matches(self):
        for labels in (["auth"], ["auth.User"], ["auth.user"], ["sessions", "auth"]):
            with self.subTest(labels=labels):
                self.assertTrue(model_in_labels(User, labels))

    def test_no_match(self):
        for labels in ([], ["sessions"], ["auth.Group"]):
            with self.subTest(labels=labels):
                self.assertFalse(model_in_labels(User, labels))
        self.assertFalse(model_in_labels(Group, ["auth.User"]))


class SanitizeCommandSubclass(SanitizeBaseCommand):
    profile = SanitizationProfile(
        mangle_tables={"auth.User": {"email": "{user}@invalid"}},
        truncate_tables=["sessions.Session"],
    )


class SanitizeBaseCommandTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("alice", email="alice@example.com")
        Session.objects.create(
            session_key="abc", session_data="", expire_date=timezone.now()
        )

    def run_command(self, *args, command=SanitizeCommandSubclass):
        self.stdout = StringIO()
        self.stderr = StringIO()
        call_command(command(), *args, stdout=self.stdout, stderr=self.stderr)

    def test_requires_profile(self):
        with self.assertRaisesMessage(CommandError, "profile"):
            self.run_command("--yes", command=SanitizeBaseCommand)

    def test_sanitizes(self):
        self.run_command("--yes", "-r", "user=nobody")
        self.user.refresh_from_db()

        # Sessions are gone and user email has been mangled
        self.assertEqual(self.user.email, "nobody@invalid")
        self.assertFalse(Session.objects.exists())
        self.assertIn("complete", self.stdout.getvalue())

    def test_no_truncate_no_mangle(self):
        self.run_command(
            "--yes", "-r", "user=x", "--no-truncate", "sessions", "--no-mangle", "auth"
        )

        # Nothing changed
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "alice@example.com")
        self.assertTrue(Session.objects.exists())

    def test_confirmation(self):
        # Say no to a change
        with (
            mock.patch("builtins.input", return_value="no"),
            self.assertRaisesMessage(CommandError, "cancelled"),
        ):
            self.run_command("-r", "user=x")

        # Nothing changed
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "alice@example.com")
        self.assertTrue(Session.objects.exists())

        # Say yes
        with mock.patch("builtins.input", return_value="yes"):
            self.run_command("-r", "user=x")

        # Sessions are gone and user email has been mangled
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "x@invalid")
        self.assertFalse(Session.objects.exists())

    def test_invalid_label_changes_nothing(self):
        # Profile labels are resolved before anything is deleted
        class BadLabel(SanitizeBaseCommand):
            profile = SanitizationProfile(
                truncate_tables=["sessions.Session", "nope.X"]
            )

        with self.assertRaises(CommandError):
            self.run_command("--yes", command=BadLabel)

        # Nothing changed
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "alice@example.com")
        self.assertTrue(Session.objects.exists())
