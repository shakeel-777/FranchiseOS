from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer, ConversationDetailSerializer, MessageSerializer,
)


class IsAdminOrOwner(permissions.BasePermission):
    """Permission: admins have full access; users only to their own conversations."""
    def has_permission(self, request, view):
        # Allow list/create for all authenticated users
        return True

    def has_object_permission(self, request, view, obj):
        profile = getattr(request.user, 'profile', None)
        if profile and profile.is_admin:
            return True
        return obj.user == request.user


class ConversationViewSet(viewsets.ModelViewSet):
    """Chat conversations. Users see their own, admins see all."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrOwner]

    def get_serializer_class(self):
        if self.action in ['retrieve', 'messages']:
            return ConversationDetailSerializer
        return ConversationListSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        if profile and profile.is_admin:
            return Conversation.objects.prefetch_related('messages').all()
        return Conversation.objects.filter(user=self.request.user).prefetch_related('messages')

    def perform_create(self, serializer):
        conversation = serializer.save(user=self.request.user)
        # Notify all admins about the new inquiry
        try:
            from notifications.models import Notification
            from accounts.models import UserProfile
            user_name = self.request.user.get_full_name() or self.request.user.username
            franchise_name = conversation.franchise.name if conversation.franchise else 'N/A'
            admins = UserProfile.objects.filter(role='admin').select_related('user')
            for admin_profile in admins:
                Notification.objects.create(
                    user=admin_profile.user,
                    title=f'New franchise inquiry',
                    message=f'{user_name} sent an inquiry about {franchise_name}: "{conversation.subject}"',
                    notification_type='info',
                    link=f'/messages',
                )
        except Exception:
            pass  # Don't block conversation creation if notification fails

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Get all messages for a conversation."""
        conversation = self.get_object()
        # Mark messages as read
        conversation.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        serializer = self.get_serializer(conversation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send a message in a conversation (REST fallback). Prefer WebSocket for real-time."""
        conversation = self.get_object()
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Message cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)

        msg = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            status='sent',
        )
        conversation.save()  # update updated_at

        # Auto-reply for non-admin users when no admin has replied yet
        profile = getattr(request.user, 'profile', None)
        if not (profile and profile.is_admin):
            admin_replied = conversation.messages.filter(
                sender__profile__role='admin',
            ).exists()
            if not admin_replied:
                user_name = request.user.get_full_name() or request.user.username
                Message.objects.create(
                    conversation=conversation,
                    sender=None,
                    content=f"🤖 Thanks for reaching out, {user_name}! We've received your message and someone from our team will connect with you ASAP. _(Auto-reply)_",
                    status='sent',
                )
                conversation.save()

        # Notify the other party about the new message
        try:
            from notifications.models import Notification
            sender_name = request.user.get_full_name() or request.user.username
            profile = getattr(request.user, 'profile', None)
            is_admin_sender = profile and profile.is_admin

            if is_admin_sender:
                # Admin replied — notify the conversation owner (franchise user)
                Notification.objects.create(
                    user=conversation.user,
                    title='New reply from admin',
                    message=f'{sender_name} replied to your inquiry "{conversation.subject}"',
                    notification_type='info',
                    link=f'/messages',
                )
            else:
                # User sent a message — notify all admins
                from accounts.models import UserProfile
                admins = UserProfile.objects.filter(role='admin').select_related('user')
                for admin_profile in admins:
                    Notification.objects.create(
                        user=admin_profile.user,
                        title='New message from user',
                        message=f'{sender_name} sent a message in "{conversation.subject}"',
                        notification_type='info',
                        link=f'/messages',
                    )
        except Exception:
            pass  # Don't block message sending if notification fails

        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Count of unread messages across all conversations for current user."""
        profile = getattr(request.user, 'profile', None)
        if profile and profile.is_admin:
            count = Message.objects.filter(
                conversation__is_active=True, is_read=False,
            ).exclude(sender=request.user).count()
        else:
            count = Message.objects.filter(
                conversation__user=request.user, conversation__is_active=True,
                is_read=False,
            ).exclude(sender=request.user).count()
        return Response({'unread': count})

    @action(detail=False, methods=['get'])
    def chat_users(self, request):
        """Return all users available for chat (admin only). Includes conversation status."""
        profile = getattr(request.user, 'profile', None)
        if not (profile and profile.is_admin):
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        from accounts.models import UserProfile
        users = UserProfile.objects.select_related('user').prefetch_related('franchises').all()
        result = []
        for up in users:
            # Check if conversation already exists between admin and this user
            existing_conv = Conversation.objects.filter(
                user=up.user, is_active=True
            ).first()
            result.append({
                'id': up.user.id,
                'username': up.user.username,
                'full_name': up.user.get_full_name() or up.user.username,
                'role': up.role,
                'franchise_names': [f.name for f in up.franchises.all()],
                'has_conversation': existing_conv is not None,
                'conversation_id': existing_conv.id if existing_conv else None,
                'unread_count': existing_conv.messages.filter(
                    is_read=False
                ).exclude(sender=request.user).count() if existing_conv else 0,
            })
        return Response(result)

    @action(detail=False, methods=['post'])
    def initiate(self, request):
        """Admin starts a new conversation with a specific user, or returns existing one."""
        profile = getattr(request.user, 'profile', None)
        if not (profile and profile.is_admin):
            return Response({'error': 'Only admins can initiate conversations'},
                            status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        subject = request.data.get('subject', 'General Inquiry')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # Find existing or create new conversation
        conv, created = Conversation.objects.get_or_create(
            user=target_user,
            is_active=True,
            subject__iexact=subject,
            defaults={
                'user': target_user,
                'subject': subject,
                'is_active': True,
            },
        )
        if created:
            # Auto-message from admin
            Message.objects.create(
                conversation=conv,
                sender=request.user,
                content=f"👋 Hi {target_user.get_full_name() or target_user.username}! An admin has started this conversation. How can we help you?",
                status='sent',
            )

        return Response({
            'conversation_id': conv.id,
            'created': created,
            'detail': ConversationListSerializer(conv, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
