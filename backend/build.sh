#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py shell -c "
import os
from users.models import CustomUser

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
    print('Superuser created!')
else:
    print('Superuser already exists.')
"

# > 💡 **WHY build.sh?**
# > Render runs this script automatically when deploying.
# > It installs packages, collects static files, and
# > runs migrations — all in one step.

