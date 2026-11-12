from django.db import models
from franchises.models import Franchise


class Campaign(models.Model):
    """Marketing campaign managed by corporate or franchise."""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
    ]
    franchise = models.ForeignKey(Franchise, on_delete=models.CASCADE, null=True, blank=True, related_name='campaigns')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    spent = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    reach = models.PositiveIntegerField(default=0, help_text='Estimated audience reach')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='draft')
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ContactLead(models.Model):
    """A submission from the public marketing site's 'Get In Touch' form.

    No authentication is required to create one (it's a public lead-gen
    form), but only staff can list/view them via the API — enforced in
    the viewset, not here.
    """
    SCALE_CHOICES = [
        ('1-5', '1-5 locations'),
        ('6-20', '6-20 locations'),
        ('21-100', '21-100 locations'),
        ('100+', '100+ locations'),
    ]
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    company = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    scale = models.CharField(max_length=10, choices=SCALE_CHOICES, blank=True)
    message = models.TextField()
    is_reviewed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} <{self.email}>"
