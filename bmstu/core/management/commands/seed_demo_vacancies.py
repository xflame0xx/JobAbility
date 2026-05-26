from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from core.cache_utils import invalidate_public_vacancies_cache
from core.models import UserAccount, Vacancy
from core.services import approve_vacancy, ensure_demo_moderator, ensure_user_account

User = get_user_model()

DEMO_EMPLOYER_USERNAME = "JobAbility Partners"

DEMO_VACANCIES = [
    {
        "title": "Оператор службы поддержки",
        "company": "Равные возможности",
        "city": "Москва",
        "salary": 65000,
        "schedule": "Удалённо, 5/2",
        "disability_support": "Работа с клавиатуры, обучение и гибкие перерывы",
        "description": (
            "Ответы клиентам в чате и по электронной почте. Компания "
            "предоставляет понятные инструкции и наставника на период адаптации."
        ),
    },
    {
        "title": "Контент-редактор",
        "company": "BrightText",
        "city": "Санкт-Петербург",
        "salary": 75000,
        "schedule": "Удалённо, гибкий график",
        "disability_support": "Асинхронная коммуникация и совместимость со скринридером",
        "description": (
            "Редактирование текстов сайта и карточек услуг. Важны грамотность, "
            "внимание к структуре и желание делать контент доступным."
        ),
    },
    {
        "title": "Junior QA-инженер",
        "company": "Accessible Tech",
        "city": "Казань",
        "salary": 85000,
        "schedule": "Гибридный формат",
        "disability_support": "Безбарьерный офис и удалённые дни",
        "description": (
            "Проверка пользовательских сценариев веб-приложения, описание "
            "ошибок и участие в тестировании доступности интерфейсов."
        ),
    },
    {
        "title": "Специалист по обработке данных",
        "company": "DataCare",
        "city": "Новосибирск",
        "salary": 70000,
        "schedule": "Гибкий график",
        "disability_support": "Удалённый формат, адаптированное рабочее ПО",
        "description": (
            "Внесение, проверка и структурирование данных в информационной "
            "системе. Предусмотрено обучение и спокойный рабочий темп."
        ),
    },
    {
        "title": "UX-исследователь доступности",
        "company": "Inclusive Design Lab",
        "city": "Екатеринбург",
        "salary": 110000,
        "schedule": "Гибридный формат",
        "disability_support": "Доступный офис и выбор формата интервью",
        "description": (
            "Исследование пользовательского опыта людей с разными "
            "потребностями и подготовка рекомендаций для продуктовой команды."
        ),
    },
    {
        "title": "Бухгалтер первичной документации",
        "company": "Баланс Плюс",
        "city": "Краснодар",
        "salary": 72000,
        "schedule": "Полный день или 0,75 ставки",
        "disability_support": "Рабочее место с регулируемым столом и лифтом",
        "description": (
            "Обработка счетов и актов, сверка документов и взаимодействие с "
            "бухгалтерией. Возможна поэтапная адаптация нагрузки."
        ),
    },
    {
        "title": "Менеджер интернет-магазина",
        "company": "Добрые покупки",
        "city": "Нижний Новгород",
        "salary": 68000,
        "schedule": "Удалённо, сменный график",
        "disability_support": "Текстовые каналы связи и индивидуальный график",
        "description": (
            "Работа с заказами, консультации покупателей в чате и обновление "
            "статусов доставки в личном кабинете."
        ),
    },
    {
        "title": "Python-разработчик",
        "company": "JobAbility Tech",
        "city": "Москва",
        "salary": 150000,
        "schedule": "Удалённо",
        "disability_support": "Гибкое начало дня и техника по потребностям специалиста",
        "description": (
            "Разработка API на Django, работа с PostgreSQL и улучшение сервисов, "
            "которые помогают людям находить доступную работу."
        ),
    },
    {
        "title": "Графический дизайнер",
        "company": "Видимый мир",
        "city": "Томск",
        "salary": 90000,
        "schedule": "Удалённо, проектная занятость",
        "disability_support": "Асинхронная работа и удобные инструменты коммуникации",
        "description": (
            "Создание иллюстраций и рекламных материалов с учётом контраста, "
            "читаемости и требований доступности."
        ),
    },
    {
        "title": "HR-координатор",
        "company": "Карьера вместе",
        "city": "Красноярск",
        "salary": 78000,
        "schedule": "Гибридный формат",
        "disability_support": "Безбарьерный вход, сурдоперевод по запросу",
        "description": (
            "Сопровождение кандидатов, организация собеседований и помощь "
            "работодателям в создании инклюзивного найма."
        ),
    },
    {
        "title": "SMM-специалист",
        "company": "Голос бренда",
        "city": "Ростов-на-Дону",
        "salary": 70000,
        "schedule": "Удалённо",
        "disability_support": "Гибкий рабочий день и письменная коммуникация",
        "description": (
            "Подготовка публикаций, ведение контент-плана и ответы аудитории. "
            "Ценится умение создавать понятный контент."
        ),
    },
    {
        "title": "Аналитик отчётности",
        "company": "ФинДата",
        "city": "Пермь",
        "salary": 105000,
        "schedule": "Гибкий график",
        "disability_support": "Удалённые дни и настройка рабочего оборудования",
        "description": (
            "Подготовка отчётов, анализ показателей и визуализация результатов "
            "в таблицах и BI-инструментах."
        ),
    },
    {
        "title": "Оператор чат-поддержки",
        "company": "Сервис Онлайн",
        "city": "Воронеж",
        "salary": 60000,
        "schedule": "Удалённо, смены по выбору",
        "disability_support": "Без телефонных звонков, обучение и регулярные перерывы",
        "description": (
            "Помощь пользователям в текстовом чате по готовой базе знаний. "
            "Подходит для начала профессионального пути."
        ),
    },
]


class Command(BaseCommand):
    help = "Create or update the published JobAbility demonstration vacancies."

    def handle(self, *args, **options):
        employer, created = User.objects.get_or_create(
            username=DEMO_EMPLOYER_USERNAME,
            defaults={
                "first_name": "JobAbility",
                "last_name": "Partners",
                "email": "partners@jobability.demo",
            },
        )
        if created:
            employer.set_unusable_password()
            employer.save(update_fields=["password"])
        ensure_user_account(employer, UserAccount.Role.EMPLOYER)

        moderator = ensure_demo_moderator()
        created_count = 0
        updated_count = 0

        for data in DEMO_VACANCIES:
            vacancy, was_created = Vacancy.objects.update_or_create(
                title=data["title"],
                company=data["company"],
                creator=employer,
                defaults={
                    "city": data["city"],
                    "salary": data["salary"],
                    "schedule": data["schedule"],
                    "disability_support": data["disability_support"],
                    "description": data["description"],
                },
            )
            approve_vacancy(vacancy, moderator, "Проверено для каталога JobAbility.")
            if was_created:
                created_count += 1
            else:
                updated_count += 1

        invalidate_public_vacancies_cache("seed_demo_vacancies")
        self.stdout.write(
            self.style.SUCCESS(
                f"Опубликовано вакансий: {len(DEMO_VACANCIES)} "
                f"(создано: {created_count}, обновлено: {updated_count})."
            )
        )
