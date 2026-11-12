from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from approvals.models import Approval


class ApprovalModelTests(TestCase):
    def setUp(self):
        self.requester = User.objects.create_user(username='staff_requester', password='pw')
        self.admin = User.objects.create_user(username='admin_reviewer', password='pw')

    def test_approval_lifecycle(self):
        """Verify approval request creation, pending state, and approval authorization."""
        app = Approval.objects.create(
            requested_by=self.requester,
            approval_type='discount',
            title='15% Festive Discount',
            details='Requesting approval for 15% discount campaign',
            amount=2500.00
        )
        self.assertEqual(app.status, 'pending')
        self.assertIsNone(app.reviewed_by)
        self.assertIn('[Pending]', str(app))

        # Admin reviews and approves
        app.status = 'approved'
        app.reviewed_by = self.admin
        app.reviewed_at = timezone.now()
        app.save()

        self.assertEqual(app.status, 'approved')
        self.assertEqual(app.reviewed_by, self.admin)
        self.assertIn('[Approved]', str(app))
