from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):

    class Role(models.TextChoices):
        CUSTOMER = 'customer', 'Customer'
        ADMIN = 'admin', 'Admin'

    email = models.EmailField(unique=True)
    """
    WHY EmailField instead of CharField?
    EmailField validates that the value is a proper email
    format (contains @, valid domain, etc.) automatically.
    CharField would accept "notanemail" as valid — wrong.

    WHY unique=True?
    Since we use email as USERNAME_FIELD for login,
    two users with the same email would break authentication.
    unique=True enforces this at the DATABASE level —
    not just form validation, but a real DB constraint.

    BEGINNER MISTAKE: Only validating uniqueness in the
    serializer but not at model level. Always enforce
    critical constraints at BOTH levels — model + serializer.
    """

    phone = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email