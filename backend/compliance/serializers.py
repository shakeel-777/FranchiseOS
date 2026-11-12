from rest_framework import serializers
from .models import ComplianceChecklist, ComplianceItem, FranchiseCompliance


class ComplianceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplianceItem
        fields = '__all__'


class ComplianceChecklistSerializer(serializers.ModelSerializer):
    items = ComplianceItemSerializer(many=True, read_only=True)

    class Meta:
        model = ComplianceChecklist
        fields = '__all__'


class FranchiseComplianceSerializer(serializers.ModelSerializer):
    checklist_title = serializers.CharField(source='checklist.title', read_only=True)
    franchise_name = serializers.CharField(source='franchise.name', read_only=True)

    class Meta:
        model = FranchiseCompliance
        fields = '__all__'
