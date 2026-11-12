from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for Product."""
    franchise_name = serializers.CharField(source='franchise.name', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
