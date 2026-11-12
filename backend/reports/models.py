from django.db import models
from django.contrib.auth.models import User
from franchises.models import Franchise


class Report(models.Model):
    """Generated report for analytics and insights."""
    TYPE_CHOICES = [
        ('sales', 'Sales Report'),
        ('inventory', 'Inventory Report'),
        ('expense', 'Expense Report'),
        ('compliance', 'Compliance Report'),
        ('performance', 'Performance Report'),
        ('custom', 'Custom Report'),
    ]
    franchise = models.ForeignKey(Franchise, on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    report_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='custom')
    title = models.CharField(max_length=200)
    data = models.JSONField(default=dict)
    notes = models.TextField(blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.get_report_type_display()} — {self.generated_at.strftime('%Y-%m-%d')}"
