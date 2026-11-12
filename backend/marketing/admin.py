from django.contrib import admin
from .models import ContactLead


@admin.register(ContactLead)
class ContactLeadAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'company', 'scale', 'is_reviewed', 'created_at')
    list_filter = ('is_reviewed', 'scale')
    search_fields = ('full_name', 'email', 'company', 'message')
    readonly_fields = ('created_at',)
