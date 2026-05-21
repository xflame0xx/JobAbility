import logging
import time

logger = logging.getLogger("core.requests")


def is_prometheus_metrics_request(request) -> bool:
    return request.path.rstrip("/") == "/metrics"


class RequestLoggingMiddleware:
    """Middleware для логирования HTTP-запросов backend-приложения."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if is_prometheus_metrics_request(request):
            return self.get_response(request)

        start_time = time.perf_counter()

        logger.debug(
            "HTTP request started method=%s path=%s result=START",
            request.method,
            request.path,
        )

        try:
            response = self.get_response(request)
        except Exception:
            duration_ms = (time.perf_counter() - start_time) * 1000

            logger.exception(
                "HTTP exception method=%s path=%s status=500 result=ERROR duration_ms=%.2f",
                request.method,
                request.path,
                duration_ms,
            )

            raise

        duration_ms = (time.perf_counter() - start_time) * 1000
        status_code = response.status_code

        if status_code >= 500:
            log_func = logger.error
            result = "ERROR"
        elif status_code >= 400:
            log_func = logger.warning
            result = "FAIL"
        else:
            log_func = logger.info
            result = "OK"

        log_func(
            "HTTP method=%s path=%s status=%s result=%s duration_ms=%.2f",
            request.method,
            request.path,
            status_code,
            result,
            duration_ms,
        )

        return response
