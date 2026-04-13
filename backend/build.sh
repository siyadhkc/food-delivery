#!/usr/bin/env bash
set -o errexit
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_kerala
python manage.py collectstatic --no-input
python manage.py shell -c "
import os
from users.models import CustomUser

email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@gmail.com')
username = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Admin@1234')

user = CustomUser.objects.filter(email=email).first()

if user:
    user.is_active = True
    user.is_staff = True
    user.is_superuser = True
    
    # If you have custom block field
    if hasattr(user, 'is_blocked'):
        user.is_blocked = False

    user.set_password(password)
    user.save()
    print('Admin restored!')
else:
    CustomUser.objects.create_superuser(
        email=email,
        username=username,
        password=password,
        role='admin',
    )
    print('Superuser created!')
"


# > 💡 **WHY build.sh?**
# > Render runs this script automatically when deploying.
# > It installs packages, collects static files, and
# > runs migrations — all in one step.

