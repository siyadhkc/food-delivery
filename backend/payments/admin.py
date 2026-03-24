from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'method', 'status', 'razorpay_order_id', 'created_at']
    list_filter = ['method', 'status', 'created_at']
    search_fields = ['order__id', 'razorpay_order_id']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
    """
    WHY all payment fields essentially readonly?
    Payment records are financial data — they should
    NEVER be edited after creation. In a real system
    you'd make most fields readonly. For now we keep
    it simple but remember this principle.
    """