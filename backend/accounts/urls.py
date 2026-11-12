from django.urls import path
from .views import (
    RegisterView, MeView, DashboardView,
    UserListView, UserCreateView, UpdateProfileView, ChangePasswordView
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('me/', MeView.as_view()),
    path('dashboard/', DashboardView.as_view()),
    path('profile/', UpdateProfileView.as_view()),
    path('change-password/', ChangePasswordView.as_view()),
]
