from django.db import models
from restaurant.models import Restaurant

class Category(models.Model):
    """
    WHY Category is in menu app, not restaurants app?
    Categories (Pizza, Burgers, Drinks) belong to the menu system,
    not to a specific restaurant. They're shared across the platform.
    Keeping it in the menu app makes logical sense.
    """
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Categories'
        """
        WHY verbose_name_plural?
        Django Admin would show "Categorys" (wrong English).
        This fixes it to show "Categories" correctly.
        Small detail, but it matters in a professional project.
        """


class MenuItem(models.Model):
    """
    WHY MenuItem needs both restaurant and category FKs?
    A burger belongs to a specific restaurant AND a category.
    restaurant FK → "this item is sold by Restaurant X"
    category FK  → "this item is of type Burgers"
    This lets us filter: "show all Burgers from Restaurant X"
    """

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='menu_items'
    )
    """
    WHY on_delete=models.CASCADE?
    If a restaurant is deleted, all its menu items
    should also be deleted automatically. No orphan data.
    Other options:
      SET_NULL  → keep the item but set restaurant to NULL
      PROTECT   → prevent deletion if items exist
      CASCADE   → delete everything related (our choice here)

    WHY related_name='menu_items'?
    This lets you do: restaurant.menu_items.all()
    Instead of the ugly: MenuItem.objects.filter(restaurant=restaurant)
    related_name is how you access reverse relationships.
    BEGINNER MISTAKE: forgetting related_name and then
    struggling to query reverse relationships later.
    """

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='menu_items'
    )
    """
    WHY SET_NULL here but CASCADE above?
    If a category is deleted, we don't want to lose
    all menu items — that would be destructive.
    Instead, just set category to NULL and the item survives.
    This is a business logic decision — think carefully
    about on_delete for every FK you write.
    """

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    """
    WHY DecimalField for price, not FloatField?
    CRITICAL: Never use FloatField for money.
    Float has precision errors: 19.99 + 0.01 = 20.000000000000004
    DecimalField stores exact decimal values — essential for prices.
    max_digits=8 means up to 999999.99
    decimal_places=2 means two decimal points (cents)
    """

    image = models.ImageField(upload_to='menu/items/', blank=True, null=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.restaurant.name}"

    class Meta:
        ordering = ['name']