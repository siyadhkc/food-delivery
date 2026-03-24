from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """
    WHY extend UserAdmin instead of ModelAdmin?
    UserAdmin gives us password hashing, permission management,
    and the proper user editing interface for free.
    ModelAdmin is for regular models — using it for users
    would break password handling. Always extend UserAdmin
    for any custom user model.
    """

    model = CustomUser

    # WHY list_display?
    # Controls which columns appear in the user list page.
    # Without this, Admin only shows the __str__ value.
    # More columns = faster management without opening each record.
    list_display = ['email', 'username', 'phone', 'role', 'is_active', 'created_at']

    # WHY list_filter?
    # Adds a filter sidebar on the right.
    # Lets you instantly filter users by role or active status.
    # Essential for managing large numbers of users.
    list_filter = ['role', 'is_active', 'created_at']

    # WHY search_fields?
    # Adds a search bar at the top.
    # The '^' means starts with (faster query).
    # The '@' means full text search.
    # Without this you'd have to scroll through all users.
    search_fields = ['email', 'username', 'phone']

    # WHY ordering?
    # Shows newest users first by default in admin list.
    ordering = ['-date_joined']

    # WHY readonly_fields?
    # created_at is auto-generated — admin should not edit it.
    # Showing it as readonly gives info without allowing changes.
    readonly_fields = ['created_at']

    # WHY fieldsets?
    # Organizes the user detail page into clean sections.
    # Without this, all fields appear in one messy block.
    # This is what separates a professional admin from a beginner one.
    fieldsets = (
        ('Login Info', {
            'fields': ('email', 'username', 'password')
        }),
        ('Personal Info', {
            'fields': ('phone', 'role')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important Dates', {
            'fields': ('last_login', 'created_at')
        }),
    )

    # WHY add_fieldsets?
    # Controls the form when CREATING a new user in admin.
    # Different from fieldsets which is for editing existing users.
    add_fieldsets = (
        ('Create New User', {
            'classes': ('wide',),
            'fields': ('email', 'username', 'phone', 'role', 'password1', 'password2'),
        }),
    )