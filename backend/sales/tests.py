from django.test import TestCase
from django.contrib.auth.models import User
from franchises.models import Franchise
from sales.models import Sale, SaleItem


class SalesModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='cashier1', password='pass')
        self.franchise = Franchise.objects.create(
            name='Express Cafe',
            code='EXP01',
            owner_name='Express Owner',
            email='exp@cafe.test',
            phone='9876540001',
            address='Station Road',
            city='Bangalore',
            state='Karnataka'
        )

    def test_sale_creation_and_items(self):
        """Verify POS sale transaction and associated line items."""
        sale = Sale.objects.create(
            franchise=self.franchise,
            sold_by=self.user,
            customer_name='John Doe',
            total_amount=500.00,
            discount=50.00,
            status='completed'
        )
        item1 = SaleItem.objects.create(
            sale=sale,
            product_name='Espresso Coffee',
            quantity=2,
            unit_price=150.00,
            total=300.00
        )
        item2 = SaleItem.objects.create(
            sale=sale,
            product_name='Croissant',
            quantity=2,
            unit_price=125.00,
            total=250.00
        )
        self.assertEqual(sale.items.count(), 2)
        self.assertEqual(sale.total_amount, 500.00)
        self.assertIn(f"Sale #{sale.id}", str(sale))
        self.assertIn(self.franchise.name, str(sale))
        self.assertEqual(str(item1), "Espresso Coffee x2")
