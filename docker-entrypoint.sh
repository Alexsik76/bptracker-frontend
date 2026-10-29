#!/bin/sh
set -e

if [ -n "$API_URL" ]; then
  cat <<EOF > /usr/share/nginx/html/config.js
window.__APP_CONFIG__ = {
  apiUrl: '$API_URL',
};
EOF
fi

exec "$@"
