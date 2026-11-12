from django.db import models
from django.contrib.auth.models import User


class Approval(models.Model):
    """Approval request for actions needing authorization."""
    TYPE_CHOICES = [
        ('discount', 'Discount Approval'),
        ('refund', 'Refund Request'),
        ('purchase', 'Purchase Order'),
        ('hire', 'Hiring Request'),
        ('leave', 'Leave Request'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='approvals_requested')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approvals_reviewed')
    approval_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='other')
    title = models.CharField(max_length=200)
    details = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.get_status_display()}] {self.title}"
