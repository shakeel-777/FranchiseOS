from rest_framework import serializers
from .models import Sale, SaleItem


class SaleItemSerializer(serializers.ModelSerializer):
    """Line item within a sale."""
    class Meta:
        model = SaleItem
        fields = ['id', 'product_name', 'quantity', 'unit_price', 'total']


class SaleSerializer(serializers.ModelSerializer):
    """Sale with nested line items."""
    items = SaleItemSerializer(many=True, read_only=True)
    franchise_name = serializers.CharField(source='franchise.name', read_only=True)
    sold_by_name = serializers.CharField(source='sold_by.username', read_only=True)

    class Meta:
        model = Sale
        fields = ['id', 'franchise', 'franchise_name', 'sold_by', 'sold_by_name',
                  'customer_name', 'total_amount', 'discount', 'status', 'notes',
                  'sale_date', 'items']
