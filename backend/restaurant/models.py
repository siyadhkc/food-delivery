from django.db import models

class Restaurant(models.Model):
    """
    WHY a separate Restaurant model?
    In a food delivery app, restaurants are independent entities.
    Each has its own menu, orders, and settings.
    Separating it into its own app keeps code organized —
    this is the Django principle of "separation of concerns".
    """

    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to='restaurants/logos/', blank=True, null=True)
    """
    WHY ImageField?
    ImageField is a FileField that validates the uploaded
    file is actually an image. It requires Pillow (which we installed).
    upload_to='restaurants/logos/' means files go to:
    media/restaurants/logos/filename.jpg
    This keeps your media folder organized by type.
    """

    address = models.TextField()
    """
    WHY TextField for address?
    CharField has a max_length limit.
    Addresses can be long and unpredictable.
    TextField stores unlimited text — perfect for addresses.
    """

    phone = models.CharField(max_length=15, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']
        """
        WHY Meta ordering?
        By default, querysets return records in random order.
        ordering = ['-created_at'] means newest restaurants
        appear first automatically in every query.
        The '-' means descending. Without '-' it's ascending.
        This is a senior developer habit — always define
        default ordering on models that will be listed.
        """