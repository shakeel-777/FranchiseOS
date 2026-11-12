from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, ContactLeadViewSet

router = DefaultRouter()
router.register('leads', ContactLeadViewSet, basename='contactlead')
router.register('', CampaignViewSet, basename='campaign')
urlpatterns = router.urls
