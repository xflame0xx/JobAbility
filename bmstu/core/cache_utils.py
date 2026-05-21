import hashlib
import json
import logging
from typing import Any

from django.conf import settings
from django.core.cache import cache

from .metrics import CACHE_OPERATIONS_TOTAL

cache_logger = logging.getLogger("core.cache")

PUBLIC_VACANCIES_VERSION_KEY = "vacancies:public:version"
PUBLIC_VACANCIES_KEY_PREFIX = "vacancies:public"
PUBLIC_VACANCIES_RESOURCE = "vacancies"


def register_cache_operation(result: str) -> None:
    try:
        CACHE_OPERATIONS_TOTAL.labels(
            resource=PUBLIC_VACANCIES_RESOURCE,
            result=result,
        ).inc()
    except Exception:
        cache_logger.exception(
            "Cache metric error resource=%s result=error",
            PUBLIC_VACANCIES_RESOURCE,
        )


def get_public_vacancies_cache_ttl() -> int:
    return int(getattr(settings, "PUBLIC_VACANCIES_CACHE_TTL", 60))


def get_public_vacancies_cache_version() -> int:
    try:
        version = cache.get(PUBLIC_VACANCIES_VERSION_KEY)

        if version is None:
            version = 1
            cache.set(PUBLIC_VACANCIES_VERSION_KEY, version, timeout=None)

        return int(version)
    except Exception:
        register_cache_operation("error")

        cache_logger.exception(
            "Cache error resource=%s operation=get_version result=error",
            PUBLIC_VACANCIES_KEY_PREFIX,
        )

        return 1


def build_public_vacancies_cache_key(query_params) -> str:
    allowed_params = [
        "search",
        "company",
        "city",
        "schedule",
        "disability_support",
        "min_price",
        "max_price",
        "date_from",
        "date_to",
    ]

    normalized_params = {}

    for param in allowed_params:
        value = query_params.get(param, "").strip()

        if value:
            normalized_params[param] = value

    raw_key = json.dumps(
        normalized_params,
        ensure_ascii=False,
        sort_keys=True,
    )

    digest = hashlib.md5(raw_key.encode("utf-8")).hexdigest()
    version = get_public_vacancies_cache_version()

    return f"{PUBLIC_VACANCIES_KEY_PREFIX}:v{version}:{digest}"


def get_cached_public_vacancies(cache_key: str) -> Any | None:
    try:
        cached_value = cache.get(cache_key)

        if cached_value is None:
            register_cache_operation("miss")

            cache_logger.info(
                "Cache miss key=%s resource=%s result=miss",
                cache_key,
                PUBLIC_VACANCIES_KEY_PREFIX,
            )

            return None

        register_cache_operation("hit")

        cache_logger.info(
            "Cache hit key=%s resource=%s result=hit",
            cache_key,
            PUBLIC_VACANCIES_KEY_PREFIX,
        )

        return cached_value
    except Exception:
        register_cache_operation("error")

        cache_logger.exception(
            "Cache error key=%s resource=%s operation=get result=error",
            cache_key,
            PUBLIC_VACANCIES_KEY_PREFIX,
        )

        return None


def set_cached_public_vacancies(cache_key: str, data: Any) -> None:
    ttl = get_public_vacancies_cache_ttl()

    try:
        cache.set(cache_key, data, timeout=ttl)

        register_cache_operation("set")

        cache_logger.info(
            "Cache set key=%s resource=%s ttl=%s result=set",
            cache_key,
            PUBLIC_VACANCIES_KEY_PREFIX,
            ttl,
        )
    except Exception:
        register_cache_operation("error")

        cache_logger.exception(
            "Cache error key=%s resource=%s operation=set result=error",
            cache_key,
            PUBLIC_VACANCIES_KEY_PREFIX,
        )


def invalidate_public_vacancies_cache(reason: str) -> None:
    try:
        version = cache.get(PUBLIC_VACANCIES_VERSION_KEY)

        if version is None:
            new_version = 2
        else:
            new_version = int(version) + 1

        cache.set(PUBLIC_VACANCIES_VERSION_KEY, new_version, timeout=None)

        register_cache_operation("invalidate")

        cache_logger.warning(
            "Cache invalidate key=%s resource=%s new_version=%s reason=%s result=invalidate",
            PUBLIC_VACANCIES_VERSION_KEY,
            PUBLIC_VACANCIES_KEY_PREFIX,
            new_version,
            reason,
        )
    except Exception:
        register_cache_operation("error")

        cache_logger.exception(
            "Cache error key=%s resource=%s reason=%s operation=invalidate result=error",
            PUBLIC_VACANCIES_VERSION_KEY,
            PUBLIC_VACANCIES_KEY_PREFIX,
            reason,
        )
