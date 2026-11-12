from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_role',
                  'content', 'sequence', 'status', 'is_read', 'created_at']
        read_only_fields = ['sender', 'is_read', 'sequence', 'status']

    def get_sender_name(self, obj):
        if obj.sender is None:
            return 'FranchiseOS Bot'
        return obj.sender.username

    def get_sender_role(self, obj):
        if obj.sender is None:
            return 'bot'
        profile = getattr(obj.sender, 'profile', None)
        return profile.role if profile else 'user'


class ConversationListSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    user_name = serializers.CharField(source='user.username', read_only=True)
    franchise_name = serializers.CharField(source='franchise.name', read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'user', 'user_name', 'franchise', 'franchise_name', 'subject',
                  'is_active', 'last_message', 'unread_count', 'created_at', 'updated_at']
        read_only_fields = ['user']

    def get_last_message(self, obj):
        msg = obj.last_message
        if msg:
            sender_name = msg.sender.username if msg.sender else 'FranchiseOS Bot'
            return {'content': msg.content[:100], 'sender_name': sender_name, 'created_at': msg.created_at}
        return None

    def get_unread_count(self, obj):
        return obj.messages.filter(is_read=False).exclude(sender=self.context['request'].user).count()


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    franchise_name = serializers.CharField(source='franchise.name', read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'user', 'user_name', 'franchise', 'franchise_name', 'subject',
                  'is_active', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['user']
