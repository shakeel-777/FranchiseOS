"""
Role-based permission helpers shared across every app.

Role ladder (low -> high): user < store_manager < franchise_owner < admin

Usage in a viewset:

    from accounts.permissions import IsAdmin, IsManagerOrAbove

    def get_permissions(self):
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsManagerOrAbove()]
        return [permissions.IsAuthenticated()]
"""
from rest_framework import permissions

ROLE_RANK = {
    'user': 1,
    'store_manager': 2,
    'franchise_owner': 3,
    'admin': 4,
}


def _rank(profile):
    if not profile:
        return 0
    return ROLE_RANK.get(profile.role, 0)


class IsAdmin(permissions.BasePermission):
    """Corporate admin only."""
    message = "Only a corporate admin can do this."

    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return bool(profile and profile.is_admin)


class IsManagerOrAbove(permissions.BasePermission):
    """Store manager, franchise owner or admin. Blocks basic users."""
    message = "Your role does not have permission for this action."

    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return _rank(profile) >= ROLE_RANK['store_manager']


class IsOwnerOrAbove(permissions.BasePermission):
    """Franchise owner or admin."""
    message = "Only a franchise owner or admin can do this."

    def has_permission(self, request, view):
        profile = getattr(request.user, 'profile', None)
        return _rank(profile) >= ROLE_RANK['franchise_owner']


class SameFranchiseOrAdmin(permissions.BasePermission):
    """Object-level check: admin sees everything, everyone else only their own franchise."""

    def has_object_permission(self, request, view, obj):
        profile = getattr(request.user, 'profile', None)
        if profile and profile.is_admin:
            return True
        obj_franchise = getattr(obj, 'franchise', None)
        if not (profile and obj_franchise):
            return False
        return profile.franchises.filter(id=obj_franchise.id).exists()
