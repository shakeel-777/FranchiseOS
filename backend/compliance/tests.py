from django.test import TestCase
from franchises.models import Franchise
from compliance.models import ComplianceChecklist, ComplianceItem, FranchiseCompliance


class ComplianceModelTests(TestCase):
    def setUp(self):
        self.franchise = Franchise.objects.create(
            name='Clean Foods Outlet',
            code='CFO01',
            owner_name='Hygiene Inspector',
            email='clean@foods.test',
            phone='9876543219',
            address='Safety Blvd',
            city='Coimbatore',
            state='Tamil Nadu'
        )

    def test_checklist_and_compliance_scoring(self):
        """Verify checklist template creation and franchise compliance status."""
        checklist = ComplianceChecklist.objects.create(
            title='Annual Food Hygiene Audit',
            description='Mandatory FSSAI and cleanliness checklist'
        )
        item1 = ComplianceItem.objects.create(checklist=checklist, label='Pest control certificate', order=1)
        item2 = ComplianceItem.objects.create(checklist=checklist, label='Hand sanitizer stations', order=2)

        fc = FranchiseCompliance.objects.create(
            franchise=self.franchise,
            checklist=checklist,
            status='compliant',
            completed_items=[item1.id, item2.id]
        )
        self.assertEqual(checklist.items.count(), 2)
        self.assertEqual(fc.status, 'compliant')
        self.assertEqual(len(fc.completed_items), 2)
