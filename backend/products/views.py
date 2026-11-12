from django.db import models
from rest_framework import viewsets, permissions
from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    """Full CRUD for Products. Non-admin users see products from ALL their franchises."""
    serializer_class = ProductSerializer

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        if profile and profile.is_admin:
            return Product.objects.all()
        if profile:
            franchises = list(profile.franchises.all())
            if franchises:
                return Product.objects.filter(
                    models.Q(franchise__in=franchises) | models.Q(franchise__isnull=True)
                )
        return Product.objects.filter(franchise__isnull=True)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), AdminOnly()]


class AdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return profile and profile.is_admin
