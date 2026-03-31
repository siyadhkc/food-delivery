# backend/core/create_superuser.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import CustomUser

"""
WHY this script?
Render free tier has no shell access.
We can't run createsuperuser manually.
This script runs automatically during deployment
via build.sh and creates the admin account
only if it doesn't already exist.
This is a common production deployment pattern.
"""

email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@gmail.com')
username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Admin@1234')

if not CustomUser.objects.filter(email=email).exists():
    CustomUser.objects.create_superuser(
        email=email,
        username=username,
        password=password,
        role='admin',
    )
    print(f'✅ Superuser created: {email}')
else:
    print(f'ℹ️ Superuser already exists: {email}')