from types import SimpleNamespace

from django.test import SimpleTestCase, override_settings, tag

from core.api_serializers import VacancySerializer


@tag("unit", "media")
class VacancySerializerMediaTests(SimpleTestCase):
    @override_settings(USE_MINIO=True, MEDIA_URL="/media/")
    def test_minio_media_url_uses_public_proxy_path(self):
        file_field = SimpleNamespace(
            name="vacancies/images/photo.jpg",
            url="http://minio:9000/jobability/vacancies/images/photo.jpg",
        )

        self.assertEqual(
            VacancySerializer.get_file_url(file_field),
            "/media/vacancies/images/photo.jpg",
        )

    @override_settings(USE_MINIO=False)
    def test_filesystem_media_url_uses_storage_url(self):
        file_field = SimpleNamespace(name="photo.jpg", url="/media/photo.jpg")

        self.assertEqual(VacancySerializer.get_file_url(file_field), "/media/photo.jpg")
