from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from accounts.permissions import IsManagerOrAbove
from .models import Inventory
from .serializers import InventorySerializer


class InventoryViewSet(viewsets.ModelViewSet):
    """Full CRUD for Inventory. Non-admin users see inventory from ALL their franchises."""
    serializer_class = InventorySerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsManagerOrAbove()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Inventory.objects.select_related('product', 'franchise').all()
        profile = getattr(self.request.user, 'profile', None)
        if not profile:
            return qs.none()
        if not profile.is_admin:
            franchises = list(profile.franchises.all())
            if not franchises:
                return qs.none()
            qs = qs.filter(franchise__in=franchises)
        product_id = self.request.query_params.get('product_id')
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

    def _require_own_franchise(self):
        profile = getattr(self.request.user, 'profile', None)
        if not profile or (not profile.is_admin and not profile.franchises.exists()):
            raise PermissionDenied("Your account hasn't been assigned a franchise yet. Ask an admin to approve your access.")
        return profile

    def perform_create(self, serializer):
        profile = self._require_own_franchise()
        serializer.save(franchise=profile.franchise) if not profile.is_admin else serializer.save()

    def perform_update(self, serializer):
        profile = self._require_own_franchise()
        serializer.save(franchise=profile.franchise) if not profile.is_admin else serializer.save()
