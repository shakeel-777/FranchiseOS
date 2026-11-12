from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    """CRUD serializer for Report."""
    franchise_name = serializers.CharField(source='franchise.name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.username', read_only=True)

    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ['generated_by']
