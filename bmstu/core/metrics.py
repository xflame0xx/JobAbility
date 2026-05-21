import time

from django.http import HttpResponse
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total number of HTTP requests handled by Django backend",
    ["method", "path", "status"],
)

HTTP_ERRORS_TOTAL = Counter(
    "http_errors_total",
    "Total number of HTTP errors handled by Django backend",
    ["method", "path", "status"],
)

HTTP_RESPONSE_TIME_SECONDS = Histogram(
    "http_response_time_seconds",
    "HTTP response time in seconds",
    ["method", "path"],
)

AUTH_ATTEMPTS_TOTAL = Counter(
    "auth_attempts_total",
    "Total authentication attempts",
    ["result"],
)

CACHE_OPERATIONS_TOTAL = Counter(
    "cache_operations_total",
    "Total number of cache operations",
    ["resource", "result"],
)


def is_prometheus_metrics_request(request) -> bool:
    return request.path.rstrip("/") == "/metrics"


def get_metric_path(request) -> str:
    """Возвращает стабильное имя маршрута для Prometheus."""
    match = getattr(request, "resolver_match", None)

    if match and match.route:
        return match.route

    return request.path


class PrometheusMetricsMiddleware:
    """Middleware для сбора HTTP-метрик Prometheus."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if is_prometheus_metrics_request(request):
            return self.get_response(request)

        start_time = time.perf_counter()
        method = request.method

        try:
            response = self.get_response(request)
        except Exception:
            duration = time.perf_counter() - start_time
            path = get_metric_path(request)

            HTTP_REQUESTS_TOTAL.labels(
                method=method,
                path=path,
                status="500",
            ).inc()

            HTTP_ERRORS_TOTAL.labels(
                method=method,
                path=path,
                status="500",
            ).inc()

            HTTP_RESPONSE_TIME_SECONDS.labels(
                method=method,
                path=path,
            ).observe(duration)

            raise

        duration = time.perf_counter() - start_time
        path = get_metric_path(request)
        status_code = str(response.status_code)

        HTTP_REQUESTS_TOTAL.labels(
            method=method,
            path=path,
            status=status_code,
        ).inc()

        HTTP_RESPONSE_TIME_SECONDS.labels(
            method=method,
            path=path,
        ).observe(duration)

        if response.status_code >= 400:
            HTTP_ERRORS_TOTAL.labels(
                method=method,
                path=path,
                status=status_code,
            ).inc()

        return response


def metrics_view(request):
    return HttpResponse(
        generate_latest(),
        content_type=CONTENT_TYPE_LATEST,
    )
