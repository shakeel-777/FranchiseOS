import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone

from accounts.models import UserProfile
from franchises.models import Franchise
from products.models import Product
from inventory.models import Inventory
from sales.models import Sale, SaleItem
from expenses.models import Expense
from approvals.models import Approval
from compliance.models import ComplianceChecklist, ComplianceItem, FranchiseCompliance
from marketing.models import Campaign
from notifications.models import Notification
from audit.models import AuditLog


class Command(BaseCommand):
    help = "Seed FranchiseOS with real franchise brands and their individual product catalogs."

    def handle(self, *args, **options):
        self.stdout.write("Seeding FranchiseOS with real franchise data...")

        # ════════════════════════════════════════════════
        # USERS
        # ════════════════════════════════════════════════
        admin_user, created = User.objects.get_or_create(
            username='shakeel', defaults=dict(
                email='shakeel@franchiseos.test', first_name='Shakeel',
                last_name='Admin', is_staff=True, is_superuser=True,
            ))
        if created or not admin_user.has_usable_password():
            admin_user.set_password('shakeel123')
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.save()
        UserProfile.objects.get_or_create(user=admin_user, defaults=dict(role='admin', phone='9000000001'))

        vinay_user, created = User.objects.get_or_create(
            username='vinay', defaults=dict(
                email='vinay@franchiseos.test', first_name='Vinay', last_name='Kumar',
            ))
        if created or not vinay_user.has_usable_password():
            vinay_user.set_password('vinay123')
            vinay_user.save()

        # ════════════════════════════════════════════════
        # REAL FRANCHISE BRANDS
        # ════════════════════════════════════════════════
        franchises_data = [
            dict(code='DOM01', name="Domino's Pizza", owner_name='Rajesh Menon',
                 email='rajesh@dominospizza.in', phone='9876500101',
                 address='45 Food Street', city='Chennai', state='Tamil Nadu',
                 country='India', status='active', revenue_share_pct=15.00),
            dict(code='KFC01', name='KFC', owner_name='Suresh Pillai',
                 email='suresh@kfc.in', phone='9876500202',
                 address='78 Commercial Road', city='Bangalore', state='Karnataka',
                 country='India', status='active', revenue_share_pct=14.00),
            dict(code='POT01', name='Pothys', owner_name='Karthik Pothy',
                 email='karthik@pothys.in', phone='9876500303',
                 address='12 Textile Market', city='Chennai', state='Tamil Nadu',
                 country='India', status='active', revenue_share_pct=12.00),
            dict(code='APO01', name='Apollo Pharmacy', owner_name='Dr. Meera Reddy',
                 email='meera@apollopharmacy.in', phone='9876500404',
                 address='34 Hospital Road', city='Hyderabad', state='Telangana',
                 country='India', status='active', revenue_share_pct=10.00),
            dict(code='IBA01', name='Ibaco', owner_name='Deepa Nair',
                 email='deepa@ibaco.in', phone='9876500505',
                 address='89 Beach Avenue', city='Kochi', state='Kerala',
                 country='India', status='active', revenue_share_pct=12.00),
            dict(code='STA01', name='Street Arabiya', owner_name='Ahmed Hassan',
                 email='ahmed@streetarabia.in', phone='9876500606',
                 address='22 Mosque Street', city='Calicut', state='Kerala',
                 country='India', status='active', revenue_share_pct=14.00),
        ]

        franchises = {}
        for fd in franchises_data:
            f, _ = Franchise.objects.get_or_create(
                code=fd['code'], defaults=fd
            )
            franchises[fd['code']] = f

        # Assign vinay to Domino's as franchise owner
        domino = franchises['DOM01']
        profile, _ = UserProfile.objects.update_or_create(
            user=vinay_user,
            defaults=dict(role='franchise_owner', phone='9000000002')
        )
        profile.franchises.add(domino)

        # ════════════════════════════════════════════════
        # FRANCHISE-SCOPED PRODUCTS
        # Each franchise has its own products — no mixing!
        # ════════════════════════════════════════════════

        # --- Domino's Pizza ---
        dominos_products = [
            ('Margherita Pizza', 'DOM-SKU-001', 'food', 299.00, 120.00,
             'Classic Margherita with mozzarella, tomato sauce & basil'),
            ('Pepperoni Pizza', 'DOM-SKU-002', 'food', 399.00, 160.00,
             'Loaded with pepperoni slices & extra cheese'),
            ('Farmhouse Pizza', 'DOM-SKU-003', 'food', 449.00, 180.00,
             'Mushrooms, capsicum, onions & sweet corn'),
            ('Garlic Breadsticks', 'DOM-SKU-004', 'food', 149.00, 55.00,
             'Buttery garlic breadsticks with cheesy dip'),
            ('Cheesy Dip', 'DOM-SKU-005', 'food', 49.00, 20.00,
             'Creamy cheese dip, perfect with breadsticks'),
            ('Coke 500ml', 'DOM-SKU-006', 'food', 60.00, 35.00,
             'Chilled Coca-Cola 500ml'),
        ]

        # --- KFC ---
        kfc_products = [
            ('Chicken Bucket (6 pcs)', 'KFC-SKU-001', 'food', 499.00, 240.00,
             '6 pieces of signature crispy fried chicken'),
            ('Chicken Zinger Burger', 'KFC-SKU-002', 'food', 199.00, 90.00,
             'Spicy zinger fillet with lettuce & mayo'),
            ('Chicken Popcorn (Large)', 'KFC-SKU-003', 'food', 249.00, 110.00,
             'Bite-sized crispy chicken chunks'),
            ('Hot Wings (8 pcs)', 'KFC-SKU-004', 'food', 299.00, 140.00,
             'Spicy & tangy chicken wings'),
            ('French Fries (Large)', 'KFC-SKU-005', 'food', 129.00, 50.00,
             'Crispy golden fries seasoned with peri-peri'),
            ('Pepsi 500ml', 'KFC-SKU-006', 'food', 60.00, 35.00,
             'Chilled Pepsi 500ml'),
        ]

        # --- Pothys (Clothing/Textile) ---
        pothys_products = [
            ('Silk Saree', 'POT-SKU-001', 'retail', 2499.00, 1200.00,
             'Pure Kanchipuram silk saree with zari work'),
            ('Cotton Kurti', 'POT-SKU-002', 'retail', 899.00, 450.00,
             'Hand-block printed cotton kurti, various colors'),
            ('Designer Lehenga', 'POT-SKU-003', 'retail', 4999.00, 2800.00,
             'Embroidered designer lehenga choli for weddings'),
            ("Men's Formal Shirt", 'POT-SKU-004', 'retail', 1299.00, 650.00,
             'Premium cotton formal shirt, slim fit'),
            ('Kids Ethnic Wear', 'POT-SKU-005', 'retail', 699.00, 350.00,
             'Traditional ethnic set for kids aged 4-12'),
            ('Bridal Collection Saree', 'POT-SKU-006', 'retail', 9999.00, 5500.00,
             'Exclusive bridal saree with heavy embroidery'),
        ]

        # --- Apollo Pharmacy ---
        apollo_products = [
            ('Crocin Advance (15 tablets)', 'APO-SKU-001', 'retail', 45.00, 32.00,
             'Paracetamol 500mg tablets for pain & fever relief'),
            ('Dolo 650 (15 tablets)', 'APO-SKU-002', 'retail', 35.00, 25.00,
             'Paracetamol 650mg — doctor-recommended antipyretic'),
            ('Becosules Multivitamin (30 caps)', 'APO-SKU-003', 'retail', 165.00, 110.00,
             'Complete B-complex with vitamin C & zinc'),
            ('Cetaphil Moisturizer 100g', 'APO-SKU-004', 'retail', 399.00, 290.00,
             'Dermatologist-recommended gentle skin moisturizer'),
            ('Omron Digital Thermometer', 'APO-SKU-005', 'retail', 299.00, 200.00,
             'Clinical digital thermometer with accurate readings'),
            ('Band-Aid (Pack of 40)', 'APO-SKU-006', 'retail', 60.00, 38.00,
             'Waterproof fabric adhesive bandages'),
        ]

        # --- Ibaco (Ice Cream) ---
        ibaco_products = [
            ('Belgian Chocolate Scoop', 'IBA-SKU-001', 'food', 120.00, 60.00,
             'Rich Belgian dark chocolate ice cream, single scoop'),
            ('Mango Alphonso Scoop', 'IBA-SKU-002', 'food', 99.00, 50.00,
             'Real Alphonso mango ice cream, single scoop'),
            ('Butterscotch Scoop', 'IBA-SKU-003', 'food', 89.00, 45.00,
             'Crunchy butterscotch ice cream with caramel swirl'),
            ('Black Forest Sundae', 'IBA-SKU-004', 'food', 199.00, 95.00,
             'Chocolate ice cream with cherry compote & whipped cream'),
            ('Brownie Fudge Ice Cream Cake', 'IBA-SKU-005', 'food', 499.00, 260.00,
             'Frozen fudge brownie cake, serves 4'),
            ('Waffle Cone (Plain)', 'IBA-SKU-006', 'food', 40.00, 15.00,
             'Freshly baked crispy waffle cone'),
        ]

        # --- Street Arabiya (Shawarma & Mandhi) ---
        street_arabiya_products = [
            ('Chicken Shawarma (Regular)', 'STA-SKU-001', 'food', 129.00, 60.00,
             'Grilled chicken shawarma with garlic mayo & pickles in kuboos'),
            ('Chicken Shawarma (Jumbo)', 'STA-SKU-002', 'food', 179.00, 85.00,
             'Extra-large shawarma with double chicken filling'),
            ('Chicken Mandhi (Half)', 'STA-SKU-003', 'food', 249.00, 120.00,
             'Half portion of traditional Yemeni-style chicken mandhi rice'),
            ('Chicken Mandhi (Full)', 'STA-SKU-004', 'food', 449.00, 210.00,
             'Full portion — aromatic chicken mandhi with spiced rice'),
            ('Mutton Mandhi (Half)', 'STA-SKU-005', 'food', 399.00, 210.00,
             'Half portion of tender mutton mandhi with basmati rice'),
            ('Al-Faham Chicken (Half)', 'STA-SKU-006', 'food', 299.00, 150.00,
             'Arabic-style grilled chicken with special spice rub'),
            ('Hummus with Pita Bread', 'STA-SKU-007', 'food', 89.00, 35.00,
             'Smooth chickpea hummus served with warm pita bread'),
            ('Kunafa (Dessert)', 'STA-SKU-008', 'food', 149.00, 70.00,
             'Sweet cheese pastry soaked in sugar syrup, topped with pistachios'),
        ]

        franchise_product_map = {
            'DOM01': dominos_products,
            'KFC01': kfc_products,
            'POT01': pothys_products,
            'APO01': apollo_products,
            'IBA01': ibaco_products,
            'STA01': street_arabiya_products,
        }

        all_products = []
        for code, product_list in franchise_product_map.items():
            f = franchises[code]
            for name, sku, cat, price, cost, desc in product_list:
                p, _ = Product.objects.get_or_create(
                    sku=sku,
                    defaults=dict(
                        franchise=f, name=name, category=cat,
                        price=price, cost_price=cost, description=desc,
                    ))
                all_products.append(p)

        self.stdout.write(f"  Created {len(all_products)} franchise products")

        # ════════════════════════════════════════════════
        # INVENTORY — each franchise has stock of its own products
        # ════════════════════════════════════════════════
        inventory_created = 0
        for code, product_list in franchise_product_map.items():
            f = franchises[code]
            f_products = Product.objects.filter(franchise=f)
            for i, p in enumerate(f_products):
                _, created_inv = Inventory.objects.get_or_create(
                    franchise=f, product=p,
                    defaults=dict(
                        quantity=40 + i * 8,
                        low_stock_threshold=10,
                        last_restock_date=timezone.now(),
                    ))
                if created_inv:
                    inventory_created += 1

        self.stdout.write(f"  Created {inventory_created} inventory records")

        # ════════════════════════════════════════════════
        # SALES — sample sales across franchises
        # ════════════════════════════════════════════════
        if not Sale.objects.exists():
            today = timezone.now()
            for i, (code, f) in enumerate(franchises.items()):
                f_prods = Product.objects.filter(franchise=f)
                if not f_prods:
                    continue
                p = f_prods[i % len(f_prods)]
                sale = Sale.objects.create(
                    franchise=f, sold_by=admin_user,
                    customer_name=f'Walk-in Customer {i+1}',
                    total_amount=p.price * 2,
                    status='completed',
                )
                SaleItem.objects.create(
                    sale=sale, product_name=p.name,
                    quantity=2, unit_price=p.price,
                    total=p.price * 2,
                )
            self.stdout.write("  Created sample sales")

        # ════════════════════════════════════════════════
        # EXPENSES — per franchise
        # ════════════════════════════════════════════════
        if not Expense.objects.exists():
            expenses_sample = [
                ('DOM01', 'rent', 25000, 'Monthly store rent — Domino\'s'),
                ('DOM01', 'utilities', 4500, 'Electricity bill'),
                ('KFC01', 'rent', 30000, 'Monthly store rent — KFC'),
                ('KFC01', 'supplies', 6200, 'Kitchen supplies restock'),
                ('POT01', 'rent', 18000, 'Monthly showroom rent — Pothys'),
                ('APO01', 'rent', 15000, 'Monthly pharmacy rent'),
                ('APO01', 'salaries', 22000, 'Pharmacist & staff salary'),
                ('IBA01', 'rent', 12000, 'Monthly parlor rent — Ibaco'),
                ('STA01', 'rent', 14000, 'Monthly restaurant rent — Street Arabiya'),
                ('STA01', 'supplies', 3800, 'Spices & meat supplies'),
            ]
            for code, cat, amt, desc in expenses_sample:
                Expense.objects.create(
                    franchise=franchises[code], recorded_by=admin_user,
                    category=cat, amount=amt, description=desc,
                    expense_date=datetime.date.today(),
                )
            self.stdout.write("  Created sample expenses")

        # ════════════════════════════════════════════════
        # APPROVALS
        # ════════════════════════════════════════════════
        if not Approval.objects.exists():
            Approval.objects.create(
                requested_by=vinay_user, approval_type='discount',
                title='10% Ramadan offer — Street Arabiya',
                details='Requesting 10% discount during Ramadan for Street Arabiya.',
                amount=3000,
            )
            Approval.objects.create(
                requested_by=vinay_user, approval_type='purchase',
                title='New pizza oven for Domino\'s', reviewed_by=admin_user,
                details='Purchase order for industrial pizza oven.', amount=45000,
                status='approved',
            )
            self.stdout.write("  Created sample approvals")

        # ════════════════════════════════════════════════
        # COMPLIANCE
        # ════════════════════════════════════════════════
        if not ComplianceChecklist.objects.exists():
            checklist, _ = ComplianceChecklist.objects.get_or_create(
                title='Monthly Store Safety Checklist',
                defaults=dict(description='Standard safety and hygiene checklist.')
            )
            for i, label in enumerate(['Fire extinguisher check', 'Hygiene certificate visible', 'Emergency exit clear']):
                ComplianceItem.objects.get_or_create(checklist=checklist, label=label, defaults=dict(order=i))
            for code in ['DOM01', 'KFC01', 'STA01']:
                FranchiseCompliance.objects.get_or_create(
                    franchise=franchises[code], checklist=checklist,
                    defaults=dict(status='compliant', completed_items=[1, 2, 3])
                )

        # ════════════════════════════════════════════════
        # MARKETING
        # ════════════════════════════════════════════════
        if not Campaign.objects.exists():
            Campaign.objects.create(
                franchise=None, name='Summer Fest 2026',
                description='Nationwide summer festival promotion across all brands.',
                budget=100000, spent=42000, reach=25000, status='active',
                start_date=datetime.date.today(),
                end_date=datetime.date.today() + datetime.timedelta(days=45),
            )
            Campaign.objects.create(
                franchise=domino, name='Domino\'s Weekend Blast',
                description='Buy one get one free on all medium pizzas on weekends.',
                budget=15000, spent=7200, reach=3200, status='active',
                start_date=datetime.date.today(),
                end_date=datetime.date.today() + datetime.timedelta(days=14),
            )
            Campaign.objects.create(
                franchise=franchises['STA01'],
                name='Ramadan Special — Street Arabiya',
                description='Special iftar combos for Ramadan.',
                budget=20000, spent=9500, reach=4500, status='active',
                start_date=datetime.date.today(),
                end_date=datetime.date.today() + datetime.timedelta(days=30),
            )

        # ════════════════════════════════════════════════
        # NOTIFICATIONS
        # ════════════════════════════════════════════════
        Notification.objects.get_or_create(
            user=admin_user, title='Welcome to FranchiseOS',
            defaults=dict(
                message='Your admin account is ready. 6 franchise brands seeded — Domino\'s, KFC, Pothys, Apollo Pharmacy, Ibaco & Street Arabiya.',
                notification_type='info',
            ))
        Notification.objects.get_or_create(
            user=vinay_user, title='New franchise approval',
            defaults=dict(
                message='A new franchise registration is awaiting approval.',
                notification_type='approval',
            ))

        # ════════════════════════════════════════════════
        # AUDIT LOG
        # ════════════════════════════════════════════════
        AuditLog.objects.get_or_create(
            user=admin_user, action='seed', entity_type='system',
            defaults=dict(
                description='Seed data initialized — 6 real franchise brands with individual product catalogs.'
            ))

        self.stdout.write(self.style.SUCCESS(
            "\n✅ Done! 6 real franchises with 38 individual products seeded.\n"
            "   Login: shakeel (admin) | vinay (Domino's owner)\n"
            "   Brands: Domino's, KFC, Pothys, Apollo Pharmacy, Ibaco, Street Arabiya"
        ))
