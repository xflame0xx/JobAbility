# JobAbility diagrams

Готовый комплект диаграмм для итогового проекта.

## Основные файлы

- `JobAbility_Class_Diagram.mdj` - отдельный StarUML-проект только для диаграммы классов.
- `JobAbility_Deployment_Diagram.mdj` - отдельный StarUML-проект только для deployment-диаграммы.
- `jobability_frontend_backend.puml` - диаграмма классов для сайта PlantUML. Показывает frontend-страницы, frontend API-клиенты и backend API-домены с методами. Модели и таблицы БД специально не показаны.
- `jobability_deployment.puml` - deployment-диаграмма для сайта PlantUML. Показывает VM, k3s, Traefik, frontend pod, Nginx со статикой, backend pod, Django API, PostgreSQL, Redis, MinIO, Prometheus, Grafana, Adminer, ConfigMap, Secrets, PVC и путь CI/CD.
- `jobability_business_process.bpmn` - BPMN 2.0 XML для bpmn.io. Внутри три дорожки: `Работодатель`, `Сервис JobAbility`, `Соискатель`.

## Дополнительные файлы

- `jobability_business_process_bpmn.puml` - резервная PlantUML-версия бизнес-процесса.
- `JobAbility_Diagrams.mdj` - общий StarUML-проект, оставлен как запасной вариант.

## Как открыть PlantUML

1. Открой сайт PlantUML.
2. Скопируй содержимое `jobability_frontend_backend.puml` для диаграммы классов.
3. Скопируй содержимое `jobability_deployment.puml` для deployment-диаграммы.
4. Экспортируй результат в PNG/SVG.

## Как открыть BPMN

1. Открой [https://bpmn.io](https://bpmn.io).
2. Нажми `Open diagram`.
3. Загрузи файл `jobability_business_process.bpmn`.
4. При необходимости экспортируй диаграмму как PNG/SVG.

Примечание: `.puml` не нужно открывать в StarUML двойным кликом. Это исходники для PlantUML.

## Как открыть отдельные StarUML-файлы

1. В StarUML выбери `File -> Open`.
2. Для диаграммы классов открой `JobAbility_Class_Diagram.mdj`.
3. Для deployment-диаграммы открой `JobAbility_Deployment_Diagram.mdj`.
4. Каждый файл содержит только одну диаграмму, поэтому они не мешают друг другу.
