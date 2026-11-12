from django.test import TestCase
from django.db import IntegrityError
from franchises.models import Franchise
from products.models import Product


class ProductModelTests(TestCase):
    def setUp(self):
        self.franchise = Franchise.objects.create(
            name='Burger King',
            code='BK01',
            owner_name='Burger King Owner',
            email='bk@burger.test',
            phone='9876543211',
            address='King St',
            city='Coimbatore',
            state='Tamil Nadu'
        )

    def test_product_creation_and_scoping(self):
        """Verify product attributes and franchise scoping representation."""
        p = Product.objects.create(
            franchise=self.franchise,
            name='Whopper Burger',
            sku='BK-SKU-001',
            category='food',
            price=249.00,
            cost_price=110.00
        )
        self.assertEqual(p.franchise, self.franchise)
        self.assertIn('[BK01]', str(p))
        self.assertIn('Whopper Burger', str(p))

    def test_sku_uniqueness_constraint(self):
        """Verify duplicate SKU raises database integrity error."""
        Product.objects.create(
            franchise=self.franchise,
            name='Item A',
            sku='UNIQUE-SKU-99',
            price=100.00
        )
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                franchise=self.franchise,
                name='Item B',
                sku='UNIQUE-SKU-99',
                price=150.00
            )
