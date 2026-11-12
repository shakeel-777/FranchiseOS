from django.db import models


class Product(models.Model):
    """Product catalog item — optionally scoped to a specific franchise."""
    CATEGORY_CHOICES = [
        ('food', 'Food & Beverage'),
        ('retail', 'Retail'),
        ('service', 'Service'),
        ('digital', 'Digital'),
        ('other', 'Other'),
    ]
    franchise = models.ForeignKey(
        'franchises.Franchise', on_delete=models.CASCADE,
        null=True, blank=True, related_name='products',
        help_text='Leave blank for global/shared products.'
    )
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='retail')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['franchise__name', 'name']

    def __str__(self):
        if self.franchise:
            return f"[{self.franchise.code}] {self.name} — ₹{self.price}"
        return f"{self.name} — ₹{self.price}"
