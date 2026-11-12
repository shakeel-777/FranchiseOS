from rest_framework import viewsets, permissions
from .models import ComplianceChecklist, ComplianceItem, FranchiseCompliance
from .serializers import (
    ComplianceChecklistSerializer, ComplianceItemSerializer, FranchiseComplianceSerializer
)


class ComplianceChecklistViewSet(viewsets.ModelViewSet):
    """CRUD for compliance checklist templates (admin only for mutations)."""
    queryset = ComplianceChecklist.objects.prefetch_related('items').all()
    serializer_class = ComplianceChecklistSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), AdminOnly()]


class FranchiseComplianceViewSet(viewsets.ModelViewSet):
    """CRUD for franchise compliance records. Non-admin users see ALL their franchises."""
    serializer_class = FranchiseComplianceSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = FranchiseCompliance.objects.select_related('franchise', 'checklist').all()
        profile = getattr(self.request.user, 'profile', None)
        if not profile:
            return qs.none()
        if not profile.is_admin:
            franchises = list(profile.franchises.all())
            if not franchises:
                return qs.none()
            qs = qs.filter(franchise__in=franchises)
        return qs

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        if not profile or (not profile.is_admin and not profile.franchises.exists()):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Your account hasn't been assigned a franchise yet. Ask an admin to approve your access.")
        if profile.is_admin:
            serializer.save()
        else:
            serializer.save(franchise=profile.franchise)

    def perform_update(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        if profile and not profile.is_admin:
            serializer.save(franchise=profile.franchise)
        else:
            serializer.save()


class AdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return profile and profile.is_admin
