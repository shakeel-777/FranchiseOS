from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from accounts.permissions import IsManagerOrAbove
from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    """Full CRUD for Expenses. Non-admin users see expenses from ALL their franchises."""
    serializer_class = ExpenseSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsManagerOrAbove()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Expense.objects.select_related('franchise').all()
        profile = getattr(self.request.user, 'profile', None)
        if not profile:
            return qs.none()
        if not profile.is_admin:
            franchises = list(profile.franchises.all())
            if not franchises:
                return qs.none()
            qs = qs.filter(franchise__in=franchises)
        return qs

    def _require_own_franchise(self, profile):
        if not profile or (not profile.is_admin and not profile.franchises.exists()):
            raise PermissionDenied("Your account hasn't been assigned a franchise yet. Ask an admin to approve your access.")

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        self._require_own_franchise(profile)
        if profile.is_admin:
            serializer.save(recorded_by=self.request.user)
        else:
            serializer.save(recorded_by=self.request.user, franchise=profile.franchise)

    def perform_update(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        self._require_own_franchise(profile)
        if not profile.is_admin:
            serializer.save(franchise=profile.franchise)
        else:
            serializer.save()
