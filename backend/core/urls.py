from django.urls import path

from core.views import ConfigPublicView

urlpatterns = [
    path("v1/config/public", ConfigPublicView.as_view(), name="config-public"),
]
