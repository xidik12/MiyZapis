#!/bin/sh
# Substitute only PORT in nginx config
envsubst '${PORT}' < /etc/nginx/nginx-template.conf > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'
