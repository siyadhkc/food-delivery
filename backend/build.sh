#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
```

> 💡 **WHY build.sh?**
> Render runs this script automatically when deploying.
> It installs packages, collects static files, and
> runs migrations — all in one step.

---
