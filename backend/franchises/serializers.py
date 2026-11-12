from rest_framework import serializers
from .models import Franchise


class FranchiseSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for Franchise."""
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Franchise
        fields = '__all__'

    def get_user_count(self, obj):
        return obj.users.count()
