from django.db import models
from django.contrib.auth.models import User
from franchises.models import Franchise


class Expense(models.Model):
    """Operational expense recorded by a franchise."""
    CATEGORY_CHOICES = [
        ('rent', 'Rent'),
        ('utilities', 'Utilities'),
        ('salaries', 'Salaries'),
        ('supplies', 'Supplies'),
        ('marketing', 'Marketing'),
        ('maintenance', 'Maintenance'),
        ('other', 'Other'),
    ]
    franchise = models.ForeignKey(Franchise, on_delete=models.CASCADE, related_name='expenses')
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='expenses')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    receipt_url = models.URLField(blank=True)
    expense_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-expense_date']

    def __str__(self):
        return f"{self.get_category_display()}: ₹{self.amount} — {self.franchise.name}"
