from rest_framework import viewsets, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only audit logs. Admin sees all; users see their own."""
    serializer_class = AuditLogSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user').all()
        profile = getattr(self.request.user, 'profile', None)
        if profile and not profile.is_admin:
            qs = qs.filter(user=self.request.user)
        entity = self.request.query_params.get('entity_type')
        if entity:
            qs = qs.filter(entity_type=entity)
        return qs[:200]
