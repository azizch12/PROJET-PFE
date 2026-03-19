FROM php:8.2-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    nginx \
    supervisor \
    libpng-dev \
    libzip-dev \
    libxml2-dev \
    oniguruma-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    bash \
    curl \
    unzip

# Install PHP extensions
RUN docker-php-ext-install \
    pdo \
    pgsql \
    pdo_pgsql \
    mbstring \
    xml \
    ctype \
    fileinfo \
    tokenizer \
    bcmath \
    zip

RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install gd exif

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application files
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
 && chmod -R 755 /var/www/html/storage \
 && chmod -R 755 /var/www/html/bootstrap/cache

# Copy config files
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisord.conf
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

EXPOSE 8000

ENTRYPOINT ["/startup.sh"]
