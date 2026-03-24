from django.contrib import admin
from .models import Category, MenuItem

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'restaurant', 'category', 'price', 'is_available']
    list_filter = ['is_available', 'category', 'restaurant']
    search_fields = ['name', 'restaurant__name', 'category__name']
    """
    WHY restaurant__name in search_fields?
    The double underscore __ is Django's way of traversing
    relationships in queries. restaurant__name means:
    "go through the restaurant FK and search the name field".
    This lets you search menu items by typing a restaurant name.
    BEGINNER MISTAKE: trying to search 'restaurant' directly
    which would search the FK integer ID, not the name.
    """

    ordering = ['restaurant', 'name']
    list_editable = ['is_available', 'price']
    readonly_fields = ['created_at']

    fieldsets = (
        ('Item Info', {
            'fields': ('restaurant', 'category', 'name', 'description', 'image')
        }),
        ('Pricing & Availability', {
            'fields': ('price', 'is_available')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )