from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from franchises.models import Franchise


class FranchiseModelAndAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.f1 = Franchise.objects.create(
            name='Subway Central',
            code='SUB01',
            owner_name='Subway Partner',
            email='partner@subway.test',
            phone='9876543212',
            address='Mall Road',
            city='Coimbatore',
            state='Tamil Nadu',
            status='active'
        )

    def test_franchise_representation(self):
        """Verify franchise string representation and unique code."""
        self.assertEqual(str(self.f1), "Subway Central (SUB01)")
        self.assertEqual(self.f1.revenue_share_pct, 10.00)

    def test_public_franchises_endpoint_requires_auth(self):
        """Verify unauthenticated request is safely denied with 401 Unauthorized."""
        response = self.client.get('/api/franchises/public/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_public_franchises_endpoint_authenticated(self):
        """Verify authenticated request returns active franchises list."""
        from django.contrib.auth.models import User
        user = User.objects.create_user(username='api_consumer', password='pw')
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/franchises/public/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        codes = [item['code'] for item in response.data]
        self.assertIn('SUB01', codes)
