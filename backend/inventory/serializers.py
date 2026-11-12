from rest_framework import serializers
from .models import Inventory


class InventorySerializer(serializers.ModelSerializer):
    """Inventory item with product & franchise details."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    franchise_name = serializers.CharField(source='franchise.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Inventory
        fields = [
            'id', 'franchise', 'franchise_name', 'product', 'product_name',
            'product_sku', 'quantity', 'low_stock_threshold', 'is_low_stock',
            'last_restock_date', 'updated_at',
        ]
