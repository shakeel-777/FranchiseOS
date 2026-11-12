from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from accounts.permissions import IsManagerOrAbove
from .models import Sale, SaleItem
from .serializers import SaleSerializer


class SaleViewSet(viewsets.ModelViewSet):
    """Full CRUD for Sales. Non-admin users see sales from ALL their franchises."""
    serializer_class = SaleSerializer

    def get_permissions(self):
        if self.action == 'destroy':
            return [permissions.IsAuthenticated(), IsManagerOrAbove()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Sale.objects.select_related('franchise', 'sold_by').prefetch_related('items').all()
        profile = getattr(self.request.user, 'profile', None)
        if not profile:
            return qs.none()
        if profile.is_admin:
            return qs
        franchises = list(profile.franchises.all())
        if not franchises:
            return qs.none()
        return qs.filter(franchise__in=franchises)

    def create(self, request, *args, **kwargs):
        """Create sale with line items."""
        data = request.data
        profile = getattr(request.user, 'profile', None)
        if not profile or not profile.is_admin:
            if not profile or not profile.franchises.exists():
                return Response(
                    {'error': "Your account hasn't been assigned a franchise yet. Ask an admin to approve your access."},
                    status=status.HTTP_403_FORBIDDEN
                )
        items_data = data.pop('items', [])
        data['sold_by'] = request.user.id
        if profile and not profile.is_admin:
            # Default to the caller's first franchise; admin can override
            if 'franchise' not in data or not data['franchise']:
                data['franchise'] = profile.franchise.id
        s = self.get_serializer(data=data)
        s.is_valid(raise_exception=True)
        sale = s.save()
        for item in items_data:
            SaleItem.objects.create(
                sale=sale, product_name=item.get('product_name', ''),
                quantity=item.get('quantity', 1),
                unit_price=item.get('unit_price', 0),
                total=item.get('total', 0)
            )
        return Response(self.get_serializer(sale).data, status=status.HTTP_201_CREATED)
