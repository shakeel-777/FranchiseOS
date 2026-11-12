from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """CRUD serializer for Notification."""
    class Meta:
        model = Notification
        fields = '__all__'
