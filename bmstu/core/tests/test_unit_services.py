from django.core.management import call_command
from django.test import SimpleTestCase, TestCase, tag

from core.management.commands.seed_demo_vacancies import DEMO_VACANCIES
from core.models import Vacancy, transliterate_to_latin
from core.services import parse_date


@tag("unit", "business_logic")
class ParseDateUnitTests(SimpleTestCase):
    def test_returns_date_for_valid_iso_value(self):
        result = parse_date("2026-05-22")

        self.assertEqual(result.year, 2026)
        self.assertEqual(result.month, 5)
        self.assertEqual(result.day, 22)

    def test_returns_none_for_empty_value(self):
        self.assertIsNone(parse_date(""))

    def test_returns_none_for_invalid_format(self):
        self.assertIsNone(parse_date("22.05.2026"))

    def test_checks_leap_year_boundary(self):
        self.assertEqual(parse_date("2024-02-29").isoformat(), "2024-02-29")
        self.assertIsNone(parse_date("2026-02-29"))


@tag("unit", "business_logic")
class TransliterationUnitTests(SimpleTestCase):
    def test_transliterates_cyrillic_title_to_slug(self):
        self.assertEqual(transliterate_to_latin("Вакансия Python"), "vakansiya-python")

    def test_keeps_latin_and_digits(self):
        self.assertEqual(transliterate_to_latin("React 19 Developer"), "react-19-developer")

    def test_returns_safe_fallback_for_empty_value(self):
        self.assertEqual(transliterate_to_latin(""), "file")

    def test_returns_safe_fallback_for_symbols_only(self):
        self.assertEqual(transliterate_to_latin("!!!"), "file")


@tag("unit", "business_logic")
class SeedDemoVacanciesTests(TestCase):
    def test_creates_thirteen_published_vacancies_without_images(self):
        call_command("seed_demo_vacancies", verbosity=0)

        vacancies = Vacancy.objects.filter(creator__username="JobAbility Partners")

        self.assertEqual(vacancies.count(), len(DEMO_VACANCIES))
        self.assertEqual(vacancies.filter(is_active=True).count(), 13)
        self.assertEqual(vacancies.exclude(image="").count(), 0)

    def test_is_idempotent(self):
        call_command("seed_demo_vacancies", verbosity=0)
        call_command("seed_demo_vacancies", verbosity=0)

        self.assertEqual(
            Vacancy.objects.filter(creator__username="JobAbility Partners").count(),
            13,
        )
