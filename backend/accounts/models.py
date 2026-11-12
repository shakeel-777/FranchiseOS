from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """Extends Django User with franchise role for FranchiseOS."""
    ROLE_CHOICES = [
        ('admin', 'Corporate Admin'),
        ('franchise_owner', 'Franchise Owner'),
        ('store_manager', 'Store Manager'),
        ('user', 'User'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=24, choices=ROLE_CHOICES, default='user')
    phone = models.CharField(max_length=20, blank=True)
    franchises = models.ManyToManyField(
        'franchises.Franchise', blank=True, related_name='users'
    )
    avatar_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def franchise(self):
        """Backward-compat: returns the first assigned franchise.
        All existing code that references profile.franchise keeps working."""
        return self.franchises.first()

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == 'admin'
