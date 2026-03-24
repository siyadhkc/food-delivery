from django.db import models
from orders.models import Order

class Payment(models.Model):

    class Method(models.TextChoices):
        RAZORPAY = 'razorpay', 'Razorpay'
        COD = 'cod', 'Cash on Delivery'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCESS = 'success', 'Success'
        FAILED = 'failed', 'Failed'

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name='payment'
    )
    """
    WHY OneToOneField here?
    One order has exactly one payment record.
    OneToOneField enforces this — you cannot accidentally
    create two payments for the same order.
    This is how you prevent double charging a customer.
    """

    method = models.CharField(max_length=20, choices=Method.choices)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING
    )
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    """
    WHY store razorpay_order_id?
    When Razorpay creates a payment request, it gives
    you an ID to track the transaction.
    You store it here to verify the payment later
    when Razorpay sends a callback to your server.
    blank=True, null=True because COD orders won't have this.
    """

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment for Order #{self.order.id} - {self.status}"