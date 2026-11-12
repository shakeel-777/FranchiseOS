from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile

# Unregister default User admin and re-register with username in list
admin.site.unregister(User)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('username_display', 'role', 'phone', 'franchise_count', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('user__username', 'user__email', 'phone')
    filter_horizontal = ('franchises',)

    def username_display(self, obj):
        return obj.user.username
    username_display.short_description = 'Username'
    username_display.admin_order_field = 'user__username'

    def franchise_count(self, obj):
        return obj.franchises.count()
    franchise_count.short_description = 'Franchises'
