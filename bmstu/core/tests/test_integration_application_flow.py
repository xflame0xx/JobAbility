from django.contrib.auth import get_user_model
from django.test import TestCase, tag
from rest_framework.test import APIClient

from core.Models import Application, UserAccount, Vacancy

User = get_user_model()


class ApiScenarioTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.applicant = User.objects.create_user(
            username="applicant1",
            password="pass1234",
            email="applicant@example.com",
        )
        UserAccount.objects.create(user=self.applicant, role=UserAccount.Role.APPLICANT)

        self.employer = User.objects.create_user(
            username="employer1",
            password="pass1234",
            email="employer@example.com",
        )
        UserAccount.objects.create(user=self.employer, role=UserAccount.Role.EMPLOYER)

        self.moderator = User.objects.create_user(
            username="moderator1",
            password="pass1234",
            email="moderator@example.com",
            is_staff=True,
        )
        UserAccount.objects.create(user=self.moderator, role=UserAccount.Role.MODERATOR)

    def login_as(self, user):
        self.client.force_login(user)


@tag("integration", "smoke")
class ApplicationHappyPathIntegrationTests(ApiScenarioTestCase):
    def test_employer_moderator_applicant_flow_forms_application(self):
        self.login_as(self.employer)

        create_response = self.client.post(
            "/api/vacancies/",
            {
                "title": "Backend developer",
                "company": "JobAbility",
                "city": "Moscow",
                "salary": 120000,
                "description": "Django REST API",
                "schedule": "Remote",
                "disability_support": "Flexible schedule",
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, 201)
        vacancy_id = create_response.json()["id"]

        vacancy = Vacancy.objects.get(pk=vacancy_id)
        self.assertEqual(vacancy.creator, self.employer)
        self.assertEqual(vacancy.moderation_status, Vacancy.ModerationStatus.PENDING)
        self.assertFalse(vacancy.is_active)

        self.login_as(self.moderator)
        moderate_response = self.client.put(
            f"/api/vacancies/{vacancy_id}/moderate/",
            {"action": "approve", "moderation_note": "Looks good"},
            format="json",
        )

        self.assertEqual(moderate_response.status_code, 200)

        vacancy.refresh_from_db()
        self.assertEqual(vacancy.moderation_status, Vacancy.ModerationStatus.APPROVED)
        self.assertTrue(vacancy.is_active)
        self.assertEqual(vacancy.moderator, self.moderator)

        self.login_as(self.applicant)
        add_response = self.client.post(
            "/api/application-lines/",
            {"vacancy_id": vacancy_id, "qty": 2, "comment": "Relevant experience"},
            format="json",
        )

        self.assertEqual(add_response.status_code, 201)
        application_id = add_response.json()["application_id"]

        update_response = self.client.put(
            f"/api/applications/{application_id}/",
            {
                "full_name": "Ivan Applicant",
                "phone": "+79990000000",
                "city": "Moscow",
                "contact_email": "applicant@example.com",
                "cover_letter": "I want to apply.",
            },
            format="json",
        )

        self.assertEqual(update_response.status_code, 200)

        form_response = self.client.put(
            f"/api/applications/{application_id}/form/",
            {},
            format="json",
        )

        self.assertEqual(form_response.status_code, 200)
        self.assertEqual(form_response.json()["status"], Application.Status.FORMED)
        self.assertEqual(form_response.json()["total_salary"], 240000)

        application = Application.objects.get(pk=application_id)
        self.assertEqual(application.status, Application.Status.FORMED)
        self.assertEqual(application.total_salary, 240000)
        self.assertIsNotNone(application.formed_at)
        self.assertIsNotNone(application.estimated_response_date)


@tag("integration", "regression", "permissions")
class AccessControlIntegrationTests(ApiScenarioTestCase):
    def test_applicant_cannot_create_vacancy(self):
        self.login_as(self.applicant)

        response = self.client.post(
            "/api/vacancies/",
            {
                "title": "Forbidden vacancy",
                "company": "JobAbility",
                "city": "Moscow",
                "salary": 100000,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(Vacancy.objects.filter(title="Forbidden vacancy").exists())


@tag("integration", "regression", "business_logic")
class ApplicationValidationRegressionTests(ApiScenarioTestCase):
    def test_cannot_form_empty_draft_application(self):
        self.login_as(self.applicant)
        application = Application.objects.create(
            creator=self.applicant,
            status=Application.Status.DRAFT,
            contact_email="applicant@example.com",
        )

        response = self.client.put(
            f"/api/applications/{application.id}/form/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        application.refresh_from_db()
        self.assertEqual(application.status, Application.Status.DRAFT)
