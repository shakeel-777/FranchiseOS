from django.db.models import Prefetch
from rest_framework import generics, permissions
from rest_framework.response import Response
from franchises.models import Franchise
from products.models import Product


class PublicFranchiseListView(generics.GenericAPIView):
    """List all active franchises with their products. Requires authentication."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        franchises = Franchise.objects.filter(status='active').order_by('name').prefetch_related(
            Prefetch('products', queryset=Product.objects.filter(is_active=True))
        )
        result = []
        for f in franchises:
            result.append({
                'id': f.id,
                'name': f.name,
                'code': f.code,
                'city': f.city,
                'state': f.state,
                'country': f.country,
                'address': f.address,
                'owner_name': f.owner_name,
                'revenue_share_pct': str(f.revenue_share_pct),
                'status': f.status,
                'products': [
                    {
                        'id': p.id, 'name': p.name, 'sku': p.sku,
                        'category': p.category, 'price': str(p.price),
                        'description': p.description,
                    }
                    for p in f.products.all()
                ],
            })
        return Response(result)
