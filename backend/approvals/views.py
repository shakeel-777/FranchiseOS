from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Approval
from .serializers import ApprovalSerializer


class AdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return profile and profile.is_admin


class ApprovalViewSet(viewsets.ModelViewSet):
    """Full CRUD for Approvals. Admin can review; users see and manage their own requests."""
    serializer_class = ApprovalSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update']:
            return [permissions.IsAuthenticated(), AdminOnly()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        qs = Approval.objects.select_related('requested_by').all()
        if not profile:
            return qs.none()
        if not profile.is_admin:
            if not profile.franchises.exists():
                return qs.none()
            qs = qs.filter(requested_by=self.request.user)
        return qs

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        if not profile or (not profile.is_admin and not profile.franchises.exists()):
            raise PermissionDenied("Your account hasn't been assigned a franchise yet. Ask an admin to approve your access.")
        serializer.save(requested_by=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.instance
        new_status = serializer.validated_data.get('status', instance.status if instance else None)
        if new_status in ('approved', 'rejected') and instance and instance.status == 'pending':
            from django.utils import timezone
            serializer.save(reviewed_by=self.request.user, reviewed_at=timezone.now())
        else:
            serializer.save()
