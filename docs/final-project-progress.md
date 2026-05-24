# Итоговый проект: ход выполнения

Проект: JobAbility. Цель работы: развернуть веб-приложение в Kubernetes и
настроить автоматическую поставку через GitLab CI/CD.

## Выполнено

### 1. Подготовка приложения на новом ПК

Выполнено:

- синхронизирован исходный проект;
- создано Python-окружение `bmstu/.venv`;
- установлены Python и Node.js зависимости;
- проверены сборка frontend и тесты Django;
- исправлены регистрозависимые импорты `Models` -> `models` и конфликт тестового модуля;
- исправлена кодировка `requirements.txt`, чтобы зависимости устанавливались через `pip`.

Результат: локальная версия JobAbility запускается и проходит проверки.

### 2. Подготовка виртуальной машины

Выполнено:

- проверена Ubuntu 22.04.5 LTS;
- проверены Docker и `kubectl`;
- расширен LVM-раздел `/` с 12 до 23 ГБ;
- свободное пространство увеличено до 13 ГБ.

Результат: на VM достаточно места для контейнеров и Kubernetes-ресурсов
учебного стенда.

### 3. Подготовка Kubernetes

Выполнено:

- установлен легковесный Kubernetes `k3s`;
- выбран kubeconfig `/etc/rancher/k3s/k3s.yaml`;
- проверен узел `ubuntu` со статусом `Ready`;
- проверен встроенный Ingress Controller Traefik со статусом `Running`.

Результат: кластер готов к развертыванию приложения через `Ingress`.

### 4. Подготовка GitLab и конфигурации деплоя

Выполнено:

- создан проект GitLab `https://gitlab.com/xflame0xx1/jobability`;
- репозиторий подключен локально как remote `gitlab`;
- подготовлены Dockerfiles для React/Nginx frontend и Django/Gunicorn backend;
- подготовлены manifests для `ConfigMap`, `Service`, `Deployment`, `Ingress`,
  PostgreSQL и persistent volumes;
- подготовлен pipeline из стадий `build`, `upload`, `deploy`.
- локально успешно собраны образы `jobability-backend:lab-check` и
  `jobability-frontend:lab-check`;
- повторно выполнены сборка frontend и 11 тестов Django без ошибок.

Архитектура деплоя:

```text
Ingress (Traefik) -> frontend (Nginx + React)
                           |
                           +-> backend (Django + Gunicorn) -> PostgreSQL
```

Nginx отдает интерфейс сайта и проксирует API по тому же адресу, поэтому
приложение может открываться как обычный сайт с единым URL.

## Следующие шаги

1. Отправить исходники и конфигурацию в GitLab.
2. Установить и зарегистрировать GitLab Runner на VM с тегом `jobability`.
3. Создать в GitLab переменную типа `File` с именем `KUBECONFIG`.
4. Создать Kubernetes Secret для Django и PostgreSQL без публикации паролей в Git.
5. Запустить Pipeline и проверить стадии `build`, `upload`, `deploy`.
6. Проверить сайт через Traefik внутри VM.
7. Подключить публичный URL через Cloudflare Tunnel и домен.
8. Собрать отчет `.docx` со скриншотами результата.

## Скриншоты для отчета

Сохранять скриншоты лучше сразу после соответствующего шага.

| N | Когда сделать | Что должно быть видно | Раздел отчета |
|---|---|---|---|
| 01 | Уже сейчас | `kubectl get nodes -o wide`, узел `ubuntu Ready`; `kubectl get pods -A`, Traefik `Running` | Подготовка Kubernetes |
| 02 | После push в GitLab | Страница проекта GitLab с файлами `.gitlab-ci.yml`, `deploy/` и исходниками | Публикация проекта |
| 03 | После регистрации Runner | GitLab `Settings -> CI/CD -> Runners`, Runner со статусом online и тегом `jobability` | Настройка Runner |
| 04 | После первого успешного Pipeline | Pipeline с тремя зелеными стадиями `build`, `upload`, `deploy` | Настройка CI/CD |
| 05 | После стадии build | Лог job `build`, где видны команды `docker build` и теги образов с SHA коммита | Docker-образ |
| 06 | После стадии deploy | Лог job `deploy`, где видны `kubectl apply`, `set image` и успешный rollout | Автоматический деплой |
| 07 | После деплоя на VM | Вывод `kubectl -n jobability get pods,svc,ingress,configmap` с Running pods | Kubernetes manifests |
| 08 | После проверки сайта | Открытый сайт JobAbility через Ingress или публичный домен | Результат работы |
| 09 | После Cloudflare Tunnel, если делаем публичность | Страница tunnel/hostname и сайт по HTTPS URL | Публичная публикация |

## Команды проверки результата

На VM после успешного Pipeline:

```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
kubectl -n jobability get pods,svc,ingress,configmap
kubectl -n jobability describe ingress jobability
curl -I http://127.0.0.1/
```
