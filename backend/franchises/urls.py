from rest_framework.routers import DefaultRouter
from .views import FranchiseViewSet

router = DefaultRouter()
router.register('', FranchiseViewSet, basename='franchise')
urlpatterns = router.urls
