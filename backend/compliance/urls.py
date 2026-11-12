from rest_framework.routers import DefaultRouter
from .views import ComplianceChecklistViewSet, FranchiseComplianceViewSet

router = DefaultRouter()
router.register('checklists', ComplianceChecklistViewSet, basename='checklist')
router.register('records', FranchiseComplianceViewSet, basename='compliance-record')
urlpatterns = router.urls
