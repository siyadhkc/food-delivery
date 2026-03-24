from django.contrib import admin
from .models import Cart, CartItem, Order, OrderItem


class CartItemInline(admin.TabularInline):
    """
    WHY Inlines?
    The PDF specifically requires inlines in Django Admin.
    An inline lets you see and edit CartItems INSIDE
    the Cart detail page — no need to navigate away.
    TabularInline = compact table layout (recommended for many items)
    StackedInline = expanded form layout (better for complex items)
    This is one of Django Admin's most powerful features.
    """
    model = CartItem
    extra = 0
    """
    WHY extra = 0?
    By default Django shows 3 empty extra forms.
    extra=0 means show only existing items, no empty forms.
    Cleaner and less confusing in admin.
    """
    readonly_fields = ['total_price']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['total_price']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['created_at']
    inlines = [CartItemInline]
    """
    WHY inlines = [CartItemInline]?
    Now when you open any Cart in admin, you'll see
    all its CartItems in a table below the cart info.
    This is how real admin panels work — related data
    visible in context, not on a separate page.
    """


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'restaurant', 'status', 'total_amount', 'created_at']
    list_filter = ['status', 'created_at', 'restaurant']
    search_fields = ['user__email', 'restaurant__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [OrderItemInline]

    # WHY list_editable on status?
    # The admin panel's primary job for orders is
    # updating their status. Making it editable directly
    # from the list saves enormous time.
    list_editable = ['status']

    fieldsets = (
        ('Order Info', {
            'fields': ('user', 'restaurant', 'address')
        }),
        ('Status & Payment', {
            'fields': ('status', 'total_amount')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )