from rest_framework import serializers
from .models import Campaign, ContactLead


class CampaignSerializer(serializers.ModelSerializer):
    """CRUD serializer for Marketing Campaign."""
    franchise_name = serializers.CharField(source='franchise.name', read_only=True)

    class Meta:
        model = Campaign
        fields = '__all__'


class ContactLeadSerializer(serializers.ModelSerializer):
    """Public-facing serializer for the marketing site contact form.

    Anonymous visitors only ever write to this (create); read fields like
    is_reviewed/created_at are read-only from their side.
    """
    class Meta:
        model = ContactLead
        fields = ['id', 'full_name', 'email', 'company', 'phone', 'scale', 'message', 'is_reviewed', 'created_at']
        read_only_fields = ['id', 'is_reviewed', 'created_at']
