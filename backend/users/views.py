from rest_framework import generics, status, serializers
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from .serializers import RegisterSerializer, UserSerializer, RestaurantRegisterSerializer

class RegisterRestaurantView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RestaurantRegisterSerializer
    permission_classes = [AllowAny]


class RegisterView(generics.CreateAPIView):
    """
    WHY generics.CreateAPIView?
    The PDF says use ViewSets + generics.
    CreateAPIView handles POST requests automatically.
    It calls serializer.is_valid() and serializer.save() for you.
    You only need to specify serializer_class and permission_classes.

    WHY AllowAny?
    Registration must be public — unauthenticated users
    need to be able to register. Without AllowAny,
    your registration endpoint would return 401 Unauthorized
    to everyone, making it impossible to create accounts.
    """
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """
    WHY @api_view for logout but class for register?
    Logout is a single simple action — function based view
    is cleaner here. Register involves ModelSerializer
    magic so class based is better there.
    Both are acceptable per the PDF — use what fits the action.

    WHY blacklist the refresh token?
    JWT tokens are stateless — the server doesn't store them.
    To truly logout, we blacklist the refresh token so it
    can never be used to generate new access tokens.
    Without this, logout is fake — the token still works.
    """
    try:
        refresh_token = request.data['refresh']
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(
            {'message': 'Logged out successfully.'},
            status=status.HTTP_200_OK
        )
    except Exception:
        return Response(
            {'error': 'Invalid token.'},
            status=status.HTTP_400_BAD_REQUEST
        )


class UserListView(generics.ListAPIView):
    """
    WHY IsAdminUser?
    Only admins can see all users — never expose
    your full user list to regular customers.
    IsAdminUser checks if user.is_staff = True.
    """
    queryset = CustomUser.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    WHY RetrieveUpdateAPIView?
    Handles both GET (view profile) and PUT/PATCH (edit profile).
    Two endpoints in one class — clean and efficient.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        WHY override get_object()?
        Default get_object() looks for a pk in the URL.
        We want /api/users/profile/ to always return
        THE CURRENT logged in user's profile — no pk needed.
        get_object() returns self.request.user directly.
        """
        return self.request.user


@api_view(['POST'])
@permission_classes([IsAdminUser])
def block_user(request, pk):
    """
    Toggles is_active for a user.
    SAFETY: Prevents an admin from blocking themselves, which would 
    lock them out of the system.
    """
    if request.user.id == int(pk):
        return Response(
            {'error': 'You cannot block your own account. This is a safety measure.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = CustomUser.objects.get(pk=pk)
        user.is_active = not user.is_active
        user.save()
        status_text = 'activated' if user.is_active else 'blocked'
        return Response(
            {'message': f'User {status_text} successfully.'},
            status=status.HTTP_200_OK
        )
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )


class DeleteUserView(generics.DestroyAPIView):
    """
    Deletes a user.
    SAFETY: Prevents self-deletion.
    Only accessible by Admins.
    """
    queryset = CustomUser.objects.all()
    permission_classes = [IsAdminUser]

    def perform_destroy(self, instance):
        if self.request.user.id == instance.id:
            raise serializers.ValidationError(
                {"error": "Safety Alert: You cannot delete your own admin account."}
            )
        instance.delete()