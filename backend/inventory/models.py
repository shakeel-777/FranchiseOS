from django.db import models
from franchises.models import Franchise
from products.models import Product


class Inventory(models.Model):
    """Stock levels per franchise per product."""
    franchise = models.ForeignKey(Franchise, on_delete=models.CASCADE, related_name='inventory_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inventory_items')
    quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=10)
    last_restock_date = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('franchise', 'product')
        verbose_name_plural = 'Inventories'

    def __str__(self):
        return f"{self.product.name} @ {self.franchise.name}: {self.quantity}"

    @property
    def is_low_stock(self):
        return self.quantity <= self.low_stock_threshold
