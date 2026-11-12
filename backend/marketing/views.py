from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from accounts.permissions import IsManagerOrAbove
from .models import Campaign, ContactLead
from .serializers import CampaignSerializer, ContactLeadSerializer


class CampaignViewSet(viewsets.ModelViewSet):
    """Full CRUD for Marketing Campaigns. Non-admin users see campaigns from ALL their franchises."""
    serializer_class = CampaignSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsManagerOrAbove()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Campaign.objects.select_related('franchise').all()
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
        if profile and not profile.is_admin:
            if not profile.franchises.exists():
                raise PermissionDenied("Your account hasn't been assigned a franchise yet. Ask an admin to approve your access.")
            serializer.save(franchise=profile.franchise)
        else:
            serializer.save()

    def perform_update(self, serializer):
        profile = getattr(self.request.user, 'profile', None)
        if profile and not profile.is_admin:
            serializer.save(franchise=profile.franchise)
        else:
            serializer.save()


class ContactLeadViewSet(viewsets.ModelViewSet):
    """Public marketing 'Get In Touch' form submissions.

    - create: open to anyone (anonymous website visitor submitting the form)
    - list/retrieve/update/destroy: manager rank or above only, so
      submissions land somewhere an admin can actually review them.
    """
    serializer_class = ContactLeadSerializer
    queryset = ContactLead.objects.all()

    def perform_create(self, serializer):
        lead = serializer.save()
        # Notify all admins about the new contact form submission
        try:
            from notifications.models import Notification
            from accounts.models import UserProfile
            admins = UserProfile.objects.filter(role='admin').select_related('user')
            preview = lead.message[:100] + ('...' if len(lead.message) > 100 else '')
            for admin_profile in admins:
                Notification.objects.create(
                    user=admin_profile.user,
                    title=f'New inquiry from {lead.full_name}',
                    message=f'{lead.full_name} ({lead.email}, {lead.company or "no company"}) — {preview}',
                    notification_type='info',
                    link='/marketing',
                )
        except Exception:
            pass  # Don't block form submission if notification fails

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsManagerOrAbove()]
