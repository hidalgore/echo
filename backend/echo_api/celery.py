import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "echo_api.settings.dev")

app = Celery("echo_api")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.beat_schedule = {
    "purge-expired-idempotency-records": {
        "task": "core.tasks.purge_expired_idempotency_records",
        "schedule": 60 * 60,  # hourly
    },
    "advance-event-lifecycle": {
        "task": "events.tasks.advance_event_lifecycle",
        "schedule": 60,  # every minute; idempotent, only ever advances
    },
}
