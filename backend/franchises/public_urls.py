from django.urls import path
from . import public_views

urlpatterns = [
    path('', public_views.PublicFranchiseListView.as_view()),
]
