from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import UserListView, UserCreateView, UserDetailView, CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', CustomTokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('api/auth/', include('accounts.urls')),
    path('api/users/', UserListView.as_view()),
    path('api/users/create/', UserCreateView.as_view()),
    path('api/users/<int:pk>/', UserDetailView.as_view()),
    path('api/franchises/public/', include('franchises.public_urls')),
    path('api/franchises/', include('franchises.urls')),
    path('api/products/', include('products.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/expenses/', include('expenses.urls')),
    path('api/approvals/', include('approvals.urls')),
    path('api/compliance/', include('compliance.urls')),
    path('api/marketing/', include('marketing.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/audit/', include('audit.urls')),
    path('api/ai/', include('ai_assistant.urls')),
    path('api/chat/', include('chat.urls')),
]
