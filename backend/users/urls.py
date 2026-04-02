from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

"""
WHY TokenObtainPairView from simplejwt directly?
simplejwt gives us login for free — no need to write it.
POST /api/users/login/ with email + password
Returns access token + refresh token automatically.
This is why we installed djangorestframework-simplejwt.

WHY TokenRefreshView?
Access tokens expire (we'll set 60 mins).
When expired, React sends the refresh token here
to get a new access token — silently, without re-login.
The PDF specifically requires this flow.
"""

urlpatterns = [
    # Auth endpoints
    path('register/', views.RegisterView.as_view(), name='register'),
    path('register/restaurant/', views.RegisterRestaurantView.as_view(), name='register_restaurant'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.logout_view, name='logout'),

    # User management
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('all/', views.UserListView.as_view(), name='user_list'),
    path('<int:pk>/block/', views.block_user, name='block_user'),
    path('<int:pk>/delete/', views.DeleteUserView.as_view(), name='delete_user'),
]