from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile


class UserSerializer(serializers.ModelSerializer):
    """Base user serializer."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile with nested user fields."""
    user = UserSerializer(read_only=True)
    franchise = serializers.SerializerMethodField()
    franchises = serializers.SerializerMethodField()
    franchise_name = serializers.SerializerMethodField()
    franchise_names = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'role', 'phone', 'franchise', 'franchises',
                  'franchise_name', 'franchise_names', 'avatar_url', 'created_at', 'is_admin']

    def get_franchise(self, obj):
        f = obj.franchise
        return f.id if f else None

    def get_franchises(self, obj):
        return list(obj.franchises.values_list('id', flat=True))

    def get_franchise_name(self, obj):
        f = obj.franchise
        return f.name if f else None

    def get_franchise_names(self, obj):
        return [f.name for f in obj.franchises.all()]


class RegisterSerializer(serializers.Serializer):
    """Registration serializer for new user sign-up."""
    username = serializers.CharField(min_length=3, max_length=150)
    password = serializers.CharField(min_length=6, write_only=True)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value
