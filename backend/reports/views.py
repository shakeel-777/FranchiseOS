from rest_framework import viewsets, permissions
from .models import Report
from .serializers import ReportSerializer


class ReportViewSet(viewsets.ModelViewSet):
    """CRUD for Reports. Non-admin users see reports from ALL their franchises."""
    serializer_class = ReportSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Report.objects.select_related('franchise').all()
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
        f = profile.franchise if not profile.is_admin else None
        serializer.save(generated_by=self.request.user, franchise=f)
