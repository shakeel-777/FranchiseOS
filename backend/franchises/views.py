from rest_framework import viewsets, permissions
from django.db.models import Q
from .models import Franchise
from .serializers import FranchiseSerializer


class AdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return profile and profile.is_admin


class FranchiseViewSet(viewsets.ModelViewSet):
    """Full CRUD for Franchise. Admins see all; users see ALL their assigned franchises."""
    serializer_class = FranchiseSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), AdminOnly()]

    def get_queryset(self):
        qs = Franchise.objects.all()
        profile = getattr(self.request.user, 'profile', None)
        if not profile:
            return qs.none()
        if not profile.is_admin:
            franchises = list(profile.franchises.all())
            if not franchises:
                return qs.none()
            qs = qs.filter(id__in=[f.id for f in franchises])
        search = self.request.query_params.get('search', '')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(code__icontains=search) | Q(city__icontains=search))
        return qs
