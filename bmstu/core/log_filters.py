import logging


class IgnoreMetricsRequestsFilter(logging.Filter):
    """Скрывает служебные запросы Prometheus к /metrics/ из консоли Django."""

    def filter(self, record):
        message = record.getMessage()

        return "/metrics/" not in message and "GET /metrics" not in message
