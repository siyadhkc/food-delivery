from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Payment
from .serializers import PaymentSerializer


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    WHY ReadOnlyModelViewSet?
    Payments are never created directly via API —
    they're created automatically when an order is placed.
    ReadOnlyModelViewSet gives only list() and retrieve().
    No create, update, or delete — payments are immutable
    financial records. This protects your payment data.
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Payment.objects.all().order_by('-created_at')
        return Payment.objects.filter(
            order__user=user
        ).order_by('-created_at')
        """
        WHY order__user?
        Payment has no direct user FK.
        We traverse: Payment → Order → User
        Double underscore __ crosses relationships.
        This filters payments belonging to current user's orders.
        """