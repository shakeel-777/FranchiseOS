from django.db import models
from franchises.models import Franchise


class ComplianceChecklist(models.Model):
    """Compliance checklist template."""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class ComplianceItem(models.Model):
    """Individual compliance item within a checklist."""
    checklist = models.ForeignKey(ComplianceChecklist, on_delete=models.CASCADE, related_name='items')
    label = models.CharField(max_length=300)
    is_required = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.label


class FranchiseCompliance(models.Model):
    """Tracks a franchise's compliance status."""
    STATUS_CHOICES = [
        ('compliant', 'Compliant'),
        ('non_compliant', 'Non-Compliant'),
        ('in_review', 'In Review'),
    ]
    franchise = models.ForeignKey(Franchise, on_delete=models.CASCADE, related_name='compliance_records')
    checklist = models.ForeignKey(ComplianceChecklist, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_review')
    completed_items = models.JSONField(default=list)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.franchise.name} — {self.checklist.title}: {self.get_status_display()}"
