"""WebSocket consumer for real-time chat."""
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model

from .models import Conversation, Message
from .serializers import MessageSerializer

logger = logging.getLogger('chat')
User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """Handles WebSocket connections for a single conversation."""

    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conv_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        # Authenticate via JWT token in query string
        token = self.scope.get('query_string', b'').decode()
        token = token.replace('token=', '') if token.startswith('token=') else ''
        user = await self._get_user_from_token(token)

        if user is None or not await self._can_access(user):
            await self.close()
            return

        self.scope['user'] = user

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Mark messages as delivered for this user
        await self._mark_delivered(user)

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            return

        action = data.get('action')
        user = self.scope.get('user')

        if action == 'send_message':
            await self._handle_send_message(user, data)
        elif action == 'typing':
            await self._handle_typing(user, data)
        elif action == 'mark_read':
            await self._handle_mark_read(user)

    # ── message handlers ──────────────────────────────────────────

    async def _handle_send_message(self, user, data):
        content = (data.get('content') or '').strip()
        if not content:
            return

        msg = await self._create_message(user, content)
        if msg is None:
            return

        payload = await self._serialize_message(msg)

        # Send acknowledgement to sender
        await self.send(text_data=json.dumps({
            'type': 'message_ack',
            'temp_id': data.get('temp_id'),
            'message': payload,
        }))

        # Broadcast new message to group (excluding sender gets via ack)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': payload,
                'sender_channel': self.channel_name,
            }
        )

        # Auto-reply for non-admin users when no admin has replied
        profile = await self._get_profile(user)
        is_admin = profile and profile.is_admin
        if not is_admin:
            has_admin_reply = await self._has_admin_reply()
            if not has_admin_reply:
                user_name = user.get_full_name() or user.username
                bot_msg = await self._create_bot_message(
                    f"🤖 Thanks for reaching out, {user_name}! We've received your message "
                    f"and someone from our team will connect with you ASAP. _(Auto-reply)_"
                )
                if bot_msg:
                    bot_payload = await self._serialize_message(bot_msg)
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': bot_payload,
                            'sender_channel': None,
                        }
                    )

    async def _handle_typing(self, user, data):
        is_typing = data.get('typing', False)
        user_name = user.get_full_name() or user.username
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'typing_event',
                'user_id': user.id,
                'user_name': user_name,
                'typing': is_typing,
                'sender_channel': self.channel_name,
            }
        )

    async def _handle_mark_read(self, user):
        await self._mark_read(user)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'status_update',
                'status': 'read',
                'user_id': user.id,
                'sender_channel': self.channel_name,
            }
        )

    # ── group event handlers ──────────────────────────────────────

    async def chat_message(self, event):
        """Forward a chat message to the WebSocket."""
        if event.get('sender_channel') == self.channel_name:
            return  # don't echo back to sender
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message'],
        }))

    async def typing_event(self, event):
        """Forward a typing indicator."""
        if event.get('sender_channel') == self.channel_name:
            return
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'user_name': event['user_name'],
            'typing': event['typing'],
        }))

    async def status_update(self, event):
        """Forward a read receipt."""
        if event.get('sender_channel') == self.channel_name:
            return
        await self.send(text_data=json.dumps({
            'type': 'message_status',
            'status': event['status'],
            'user_id': event['user_id'],
        }))

    # ── database helpers ──────────────────────────────────────────

    @database_sync_to_async
    def _get_user_from_token(self, token):
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            return User.objects.get(id=user_id, is_active=True)
        except Exception:
            return None

    @database_sync_to_async
    def _can_access(self, user):
        try:
            conv = Conversation.objects.get(id=self.conversation_id)
            profile = getattr(user, 'profile', None)
            if profile and profile.is_admin:
                return True
            return conv.user_id == user.id
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def _create_message(self, user, content):
        try:
            conv = Conversation.objects.get(id=self.conversation_id)
            msg = Message.objects.create(
                conversation=conv,
                sender=user,
                content=content,
                status='sent',
            )
            conv.save()  # update updated_at
            return msg
        except Conversation.DoesNotExist:
            return None

    @database_sync_to_async
    def _create_bot_message(self, content):
        try:
            conv = Conversation.objects.get(id=self.conversation_id)
            msg = Message.objects.create(
                conversation=conv,
                sender=None,
                content=content,
                status='sent',
            )
            conv.save()
            return msg
        except Conversation.DoesNotExist:
            return None

    @database_sync_to_async
    def _serialize_message(self, msg):
        return MessageSerializer(msg).data

    @database_sync_to_async
    def _mark_delivered(self, user):
        Message.objects.filter(
            conversation_id=self.conversation_id,
            status='sent',
        ).exclude(sender=user).update(status='delivered')

    @database_sync_to_async
    def _mark_read(self, user):
        Message.objects.filter(
            conversation_id=self.conversation_id,
        ).exclude(sender=user).update(status='read', is_read=True)

    @database_sync_to_async
    def _has_admin_reply(self):
        from accounts.models import Profile
        return Message.objects.filter(
            conversation_id=self.conversation_id,
            sender__profile__role='admin',
        ).exists()

    @database_sync_to_async
    def _get_profile(self, user):
        return getattr(user, 'profile', None)
