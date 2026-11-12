from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from .models import UserProfile
from .permissions import IsAdmin
from .serializers import UserProfileSerializer, UserSerializer, RegisterSerializer
from notifications.models import Notification


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — Create a new user account."""
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        user = User.objects.create_user(
            username=d['username'], password=d['password'],
            email=d['email'], first_name=d['first_name'], last_name=d['last_name']
        )
        UserProfile.objects.create(
            user=user, role='user',
            phone=d.get('phone', ''),
        )
        # Notify all admins about the new signup
        admins = UserProfile.objects.filter(role='admin').select_related('user')
        display_name = user.get_full_name() or user.username
        for admin_profile in admins:
            Notification.objects.create(
                user=admin_profile.user,
                title='New user registered',
                message=f'{display_name} ({user.username}) has created an account.',
                notification_type='info',
                link=f'/users',
            )
        return Response({'message': 'Account created successfully.', 'user_id': user.id},
                        status=status.HTTP_201_CREATED)


class MeView(APIView):
    """GET /api/auth/me/ — Return current user's profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)
        return Response(UserProfileSerializer(profile).data)


class UserListView(generics.ListAPIView):
    """GET /api/users/ — List all users. Admin only: this is the whole company's
    user directory, not something every role should be able to pull."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        return UserProfile.objects.select_related('user').prefetch_related('franchises').all()


class UserCreateView(generics.CreateAPIView):
    """POST /api/users/ — Admin creates a user. Kept admin-only so a lower-role
    account can never grant itself (or anyone) a higher role."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        user = User.objects.create_user(
            username=d['username'], password=d['password'],
            email=d['email'], first_name=d['first_name'], last_name=d['last_name']
        )
        fids = request.data.get('franchise_ids', request.data.get('franchise_id', []))
        if not isinstance(fids, list):
            fids = [fids] if fids else []
        from franchises.models import Franchise
        # NOTE: 'role' isn't declared on RegisterSerializer, so it's never in
        # validated_data — read it straight from request.data instead, or an
        # admin picking a role in the "New User" form would always get 'user'.
        role = request.data.get('role', 'user')
        valid_roles = dict(UserProfile.ROLE_CHOICES)
        if role not in valid_roles:
            role = 'user'
        # Prevent admins from creating other admin accounts via the API.
        # Only a superuser or direct DB intervention can grant the admin role.
        if role == 'admin':
            role = 'franchise_owner'
        profile = UserProfile.objects.create(
            user=user, role=role,
            phone=d.get('phone', ''),
        )
        if fids:
            profile.franchises.set(Franchise.objects.filter(id__in=fids))
        # Notify all admins about the new user
        admins = UserProfile.objects.filter(role='admin').select_related('user')
        display_name = user.get_full_name() or user.username
        for admin_profile in admins:
            Notification.objects.create(
                user=admin_profile.user,
                title='New user created',
                message=f'{display_name} ({user.username}) was created with role "{role}".',
                notification_type='info',
                link=f'/users',
            )
        return Response({'message': 'User created.', 'user_id': user.id},
                        status=status.HTTP_201_CREATED)


class UserDetailView(APIView):
    """GET/PATCH /api/users/<id>/ — Admin-only. View or edit another user's
    role, franchise, or phone. This is how a self-registered account (which
    always starts as basic user with no franchise) gets approved: an admin
    assigns it a franchise here, and can bump its role at the same time."""
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        profile = get_object_or_404(UserProfile, pk=pk)
        return Response(UserProfileSerializer(profile, context={'request': request}).data)

    def patch(self, request, pk):
        profile = get_object_or_404(UserProfile, pk=pk)
        data = request.data

        if 'role' in data:
            valid_roles = dict(UserProfile.ROLE_CHOICES)
            if data['role'] not in valid_roles:
                return Response({'error': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)
            # Block admin role promotion via API — only superuser/DB can grant it.
            # Existing admins keep their role; non-admins can't be promoted to admin.
            if data['role'] == 'admin' and profile.role != 'admin':
                return Response({'error': 'Cannot promote users to admin role.'}, status=status.HTTP_403_FORBIDDEN)
            profile.role = data['role']

        if 'franchise_id' in data or 'franchise_ids' in data:
            fids = data.get('franchise_ids', data.get('franchise_id', []))
            if not isinstance(fids, list):
                fids = [fids] if fids else []
            from franchises.models import Franchise
            if fids:
                profile.franchises.set(Franchise.objects.filter(id__in=fids))
            else:
                profile.franchises.clear()

        if 'phone' in data:
            profile.phone = data['phone']

        profile.save()
        return Response(UserProfileSerializer(profile, context={'request': request}).data)


class UpdateProfileView(APIView):
    """PATCH /api/auth/profile/ — Update current user's profile."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        user = request.user
        data = request.data
        for field in ['first_name', 'last_name', 'email']:
            if field in data:
                setattr(user, field, data[field])
        user.save()
        profile = UserProfile.objects.get(user=user)
        if 'phone' in data:
            profile.phone = data['phone']
            profile.save()
        return Response(UserProfileSerializer(profile).data)


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ — Change current user's password."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        cur = request.data.get('current_password', '')
        new = request.data.get('new_password', '')
        if not user.check_password(cur):
            return Response({'error': 'Current password is incorrect.'}, status=400)
        if len(new) < 6:
            return Response({'error': 'Password must be at least 6 characters.'}, status=400)
        user.set_password(new)
        user.save()
        return Response({'message': 'Password changed successfully.'})


class DashboardView(APIView):
    """GET /api/auth/dashboard/ — Dashboard stats based on user role."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)
        from franchises.models import Franchise
        from sales.models import Sale
        from products.models import Product

        if profile.is_admin:
            franchises = Franchise.objects.count()
            active = Franchise.objects.filter(status='active').count()
            total_sales = Sale.objects.count()
            total_products = Product.objects.count()
            from django.db.models import Sum
            from reports.models import Report
            total_reports = Report.objects.count()
            revenue = Sale.objects.filter(status='completed').aggregate(s=Sum('total_amount'))['s'] or 0
            return Response({
                'role': 'admin', 'franchises': franchises, 'active_franchises': active,
                'total_sales': total_sales, 'total_products': total_products,
                'total_reports': total_reports, 'total_revenue': float(revenue),
            })
        else:
            user_franchises = list(profile.franchises.all())
            if not user_franchises:
                return Response({'role': profile.role, 'message': 'No franchise assigned.'})
            from django.db.models import Sum
            sales_count = Sale.objects.filter(franchise__in=user_franchises).count()
            revenue = Sale.objects.filter(
                franchise__in=user_franchises, status='completed'
            ).aggregate(s=Sum('total_amount'))['s'] or 0
            products_count = Product.objects.filter(
                franchise__in=user_franchises
            ).count()
            franchise_names = [f.name for f in user_franchises]
            return Response({
                'role': profile.role,
                'franchise_id': user_franchises[0].id,
                'franchise_name': user_franchises[0].name,
                'franchise_names': franchise_names,
                'sales_count': sales_count, 'total_revenue': float(revenue),
                'products_count': products_count,
            })


from rest_framework_simplejwt.views import TokenObtainPairView
from audit.models import AuditLog

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom TokenObtainPairView to log login events in the AuditLog."""
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            username = request.data.get('username')
            try:
                user = User.objects.get(username=username)
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                if x_forwarded_for:
                    ip = x_forwarded_for.split(',')[0]
                else:
                    ip = request.META.get('REMOTE_ADDR')
                
                # Check for IPv6 localhost representation
                if ip == '::1':
                    ip = '127.0.0.1'
                
                AuditLog.objects.create(
                    user=user,
                    action='login',
                    entity_type='user',
                    entity_id=user.id,
                    description=f"User {user.username} logged in successfully.",
                    ip_address=ip if ip else None
                )
            except Exception:
                pass
        return response
