#!/bin/bash
set -e

cd /var/www/html

echo "Caching config..."
php artisan config:cache

echo "Caching routes..."
php artisan route:cache

echo "Running migrations..."
php artisan migrate --force

echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
