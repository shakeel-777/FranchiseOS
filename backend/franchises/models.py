from django.db import models


class Franchise(models.Model):
    """A franchise location owned or managed under FranchiseOS."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending Approval'),
        ('suspended', 'Suspended'),
    ]
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=10, unique=True, db_index=True)
    owner_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='active')
    logo_url = models.URLField(blank=True)
    revenue_share_pct = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"
