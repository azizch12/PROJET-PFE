#!/bin/bash
set -e
php artisan config:clear
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan migrate --force
apache2-foreground
