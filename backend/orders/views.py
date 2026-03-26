from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem, Order, OrderItem
from .serializers import (
    CartSerializer, CartItemSerializer,
    OrderSerializer, CreateOrderSerializer
)
from menu.models import MenuItem
from payments.models import Payment


class CartViewSet(viewsets.GenericViewSet):
    """
    WHY GenericViewSet instead of ModelViewSet?
    Cart has special behaviour — each user has exactly
    ONE cart. We don't want the standard list/create/delete
    of ModelViewSet. GenericViewSet gives us the base
    without any automatic actions — we define exactly
    what we need using @action decorator.
    This is precise control vs convenience tradeoff.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CartSerializer

    def get_or_create_cart(self, user):
        """
        WHY this helper method?
        Cart is created automatically when first needed.
        User never explicitly creates a cart — it just
        appears when they first add an item.
        This pattern is called "get or create" — very
        common in real applications.
        """
        cart, created = Cart.objects.get_or_create(user=user)
        return cart

    @action(detail=False, methods=['get'])
    def my_cart(self, request):
        """
        WHY @action decorator?
        @action adds custom endpoints to a ViewSet beyond
        the standard CRUD. This creates:
        GET /api/orders/cart/my_cart/
        detail=False means no pk needed in URL (not /cart/1/my_cart/)
        This returns the current user's cart with all items.
        """
        cart = self.get_or_create_cart(request.user)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """
        POST /api/orders/cart/add_item/
        Body: { "menu_item_id": 1, "quantity": 2 }
        
        WHY get_or_create for CartItem?
        If the item already exists in cart, increase quantity.
        If it's new, create it. This prevents duplicate
        cart items for the same menu item.
        """
        cart = self.get_or_create_cart(request.user)
        menu_item_id = request.data.get('menu_item_id')
        quantity = int(request.data.get('quantity', 1))

        menu_item = get_object_or_404(MenuItem, id=menu_item_id)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            menu_item=menu_item,
            defaults={'quantity': quantity}
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """
        POST /api/orders/cart/remove_item/
        Body: { "cart_item_id": 1 }
        """
        cart = self.get_or_create_cart(request.user)
        cart_item_id = request.data.get('cart_item_id')
        cart_item = get_object_or_404(CartItem, id=cart_item_id, cart=cart)
        """
        WHY filter by both id AND cart?
        Security! Without cart=cart, a user could delete
        another user's cart items by guessing IDs.
        Always scope queries to the current user's data.
        BEGINNER MISTAKE: only filtering by ID — exposes
        all users' data to manipulation.
        """
        cart_item.delete()
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def update_quantity(self, request):
        """
        POST /api/orders/cart/update_quantity/
        Body: { "cart_item_id": 1, "quantity": 3 }
        """
        cart = self.get_or_create_cart(request.user)
        cart_item_id = request.data.get('cart_item_id')
        quantity = int(request.data.get('quantity', 1))

        cart_item = get_object_or_404(CartItem, id=cart_item_id, cart=cart)

        if quantity <= 0:
            cart_item.delete()
        else:
            cart_item.quantity = quantity
            cart_item.save()

        serializer = CartSerializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        """
        POST /api/orders/cart/clear/
        Removes all items from cart — called after order placed.
        """
        cart = self.get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response({'message': 'Cart cleared.'})


class OrderViewSet(viewsets.ModelViewSet):
    """
    WHY ModelViewSet here but GenericViewSet for Cart?
    Orders need standard CRUD — list, retrieve, update status.
    But we override create() for our custom order placement logic.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        WHY override get_queryset()?
        Regular users see ONLY their own orders.
        Admin users see ALL orders.
        This is critical security — never let customers
        see other customers' orders.
        BEGINNER MISTAKE: returning Order.objects.all()
        for everyone — exposes all order data to any user.
        """
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(user=user).order_by('-created_at')

    def create(self, request):
        """
        WHY override create()?
        Placing an order is not a simple model create.
        We need to:
        1. Validate the cart has items
        2. Calculate total from cart items
        3. Create Order record
        4. Create OrderItem records (snapshot of prices)
        5. Create Payment record
        6. Clear the cart
        All this must happen atomically — all or nothing.
        """
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get user's cart
        cart = get_object_or_404(Cart, user=request.user)
        cart_items = cart.items.all()

        if not cart_items.exists():
            return Response(
                {'error': 'Your cart is empty.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get restaurant from first cart item
        restaurant = cart_items.first().menu_item.restaurant

        # Calculate total
        total_amount = sum(item.total_price for item in cart_items)

        # Create order
        order = Order.objects.create(
            user=request.user,
            restaurant=restaurant,
            address=serializer.validated_data['address'],
            total_amount=total_amount,
            status=Order.Status.PENDING
        )

        # Create order items (price snapshot)
        for cart_item in cart_items:
            # WHY use menu_item.price here?
            # We snapshot the CURRENT price at order time.
            # If restaurant changes price tomorrow,
            # this order still shows what customer paid.
            # This is financial data integrity.
            OrderItem.objects.create(
                order=order,
                menu_item=cart_item.menu_item,
                quantity=cart_item.quantity,
                price=cart_item.menu_item.price
            )

        # Create payment record
        Payment.objects.create(
            order=order,
            method=serializer.validated_data['payment_method'],
            status='pending'
        )

        # Clear cart after order placed
        cart_items.delete()

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def update_status(self, request, pk=None):
        """
        POST /api/orders/orders/1/update_status/
        Body: { "status": "preparing" }
        Admin only — customers cannot change their own order status.
        """
        order = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(Order.Status.choices):
            return Response(
                {'error': 'Invalid status.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save()
        return Response(OrderSerializer(order).data)