from django.urls import path

from checkout import views

urlpatterns = [
    path("v1/checkout/intents", views.CheckoutIntentCreateView.as_view(), name="checkout-intent-create"),
    path(
        "v1/checkout/intents/<str:intent_id>",
        views.CheckoutIntentDetailView.as_view(),
        name="checkout-intent-detail",
    ),
    path("v1/payments/confirm", views.PaymentConfirmView.as_view(), name="payments-confirm"),
    # Server-to-server (drift-script allowlist; not in the client registry).
    path("v1/webhooks/stripe", views.StripeWebhookView.as_view(), name="stripe-webhook"),
]
