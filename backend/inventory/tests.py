from django.test import TestCase
from franchises.models import Franchise
from products.models import Product
from inventory.models import Inventory


class InventoryModelTests(TestCase):
    def setUp(self):
        self.franchise = Franchise.objects.create(
            name='Test Pizzeria',
            code='TPZ01',
            owner_name='Pizza Chef',
            email='chef@pizzeria.test',
            phone='9000011111',
            address='1 Pizzeria Way',
            city='Chennai',
            state='Tamil Nadu'
        )
        self.product = Product.objects.create(
            franchise=self.franchise,
            name='Cheese Slice',
            sku='TPZ-SKU-001',
            category='food',
            price=99.00,
            cost_price=40.00
        )

    def test_inventory_creation_and_threshold(self):
        """Verify inventory tracking and automated is_low_stock property."""
        inv = Inventory.objects.create(
            franchise=self.franchise,
            product=self.product,
            quantity=5,
            low_stock_threshold=10
        )
        self.assertTrue(inv.is_low_stock)

        # Restock product
        inv.quantity = 25
        inv.save()
        self.assertFalse(inv.is_low_stock)

    def test_inventory_unique_together_constraint(self):
        """Ensure duplicate product entries per franchise trigger integrity constraint."""
        from django.db import IntegrityError
        Inventory.objects.create(
            franchise=self.franchise,
            product=self.product,
            quantity=10
        )
        with self.assertRaises(IntegrityError):
            Inventory.objects.create(
                franchise=self.franchise,
                product=self.product,
                quantity=15
            )
