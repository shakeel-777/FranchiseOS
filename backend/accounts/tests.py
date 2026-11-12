from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import UserProfile
from franchises.models import Franchise


class AccountsModelAndAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testadmin',
            email='testadmin@franchiseos.test',
            password='testpassword123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            role='admin',
            phone='9876543210'
        )
        self.franchise = Franchise.objects.create(
            name='Test Outlet',
            code='TST01',
            owner_name='Tester',
            email='test@outlet.in',
            phone='9876500000',
            address='123 Test St',
            city='Coimbatore',
            state='Tamil Nadu',
            status='active'
        )
        self.profile.franchises.add(self.franchise)

    def test_user_profile_creation_and_role(self):
        """Verify UserProfile links to User and evaluates role properties correctly."""
        self.assertEqual(self.user.profile.role, 'admin')
        self.assertTrue(self.user.profile.is_admin)
        self.assertEqual(self.user.profile.franchise, self.franchise)
        self.assertEqual(str(self.user.profile), 'testadmin (Corporate Admin)')

    def test_jwt_token_authentication(self):
        """Verify JWT token obtain endpoint returns valid access & refresh tokens."""
        response = self.client.post('/api/token/', {
            'username': 'testadmin',
            'password': 'testpassword123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        # Verify AuditLog logged the login event
        from audit.models import AuditLog
        self.assertTrue(AuditLog.objects.filter(user=self.user, action='login').exists())

    def test_jwt_token_invalid_credentials(self):
        """Verify invalid login attempts are rejected with 401 Unauthorized."""
        response = self.client.post('/api/token/', {
            'username': 'testadmin',
            'password': 'wrongpassword'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
