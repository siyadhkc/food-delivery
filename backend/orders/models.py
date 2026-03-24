from django.db import models
from django.conf import settings
from restaurant.models import Restaurant
from menu.models import MenuItem

class Cart(models.Model):
    """
    WHY a separate Cart model?
    A cart is a temporary holding area before checkout.
    One user has one active cart at a time.
    When they checkout, the cart becomes an Order.
    Keeping Cart separate from Order is clean architecture —
    orders are permanent records, carts are temporary.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart'
    )
    """
    WHY OneToOneField?
    One user can only have ONE cart at a time.
    OneToOneField enforces this at the database level.
    ForeignKey would allow multiple carts per user (wrong).
    WHY settings.AUTH_USER_MODEL instead of importing CustomUser?
    This is the correct Django way to reference the user model.
    It works even if you change your user model later.
    BEGINNER MISTAKE: directly importing CustomUser from users.models
    which can cause circular import errors.
    """

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Cart of {self.user.email}"


class CartItem(models.Model):
    """
    WHY CartItem is separate from Cart?
    A cart contains MULTIPLE items. If we stored items
    directly in Cart, we'd need multiple rows or a messy
    JSON field. CartItem is a junction table between
    Cart and MenuItem — each row is one item in the cart.
    This is a classic many-to-many with extra data (quantity) pattern.
    """

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    """
    WHY PositiveIntegerField?
    quantity can never be 0 or negative.
    PositiveIntegerField enforces this at the database level.
    Always use the most restrictive field type that fits your data.
    """

    def __str__(self):
        return f"{self.quantity} x {self.menu_item.name}"

    @property
    def total_price(self):
        return self.menu_item.price * self.quantity
    """
    WHY a property?
    total_price is calculated, not stored.
    We don't store it in the database because if the
    menu item price changes, stored values become wrong.
    A property calculates it fresh every time it's accessed.
    """


class Order(models.Model):

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PREPARING = 'preparing', 'Preparing'
        OUT_FOR_DELIVERY = 'out_for_delivery', 'Out for Delivery'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'
    """
    WHY TextChoices for status?
    Orders move through a lifecycle. TextChoices ensures
    only valid statuses are stored. This is called a
    "state machine" pattern — very common in real apps.
    The admin updates this status as the order progresses.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='orders'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    """
    WHY updated_at with auto_now=True?
    Every time the order status changes and you save(),
    updated_at updates automatically. This gives you
    a full audit trail of when the order was last modified.
    """

    def __str__(self):
        return f"Order #{self.id} by {self.user.email}"

    class Meta:
        ordering = ['-created_at']


class OrderItem(models.Model):
    """
    WHY store price here separately?
    This is a critical senior developer decision.
    We store the price AT THE TIME OF ORDER.
    If the restaurant changes the menu item price tomorrow,
    the historical order should still show the original price.
    Never reference live prices from completed orders.
    """

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.menu_item.name}"

    @property
    def total_price(self):
        return self.price * self.quantity