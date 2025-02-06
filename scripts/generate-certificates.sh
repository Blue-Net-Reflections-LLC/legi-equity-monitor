#!/bin/bash

# Create certificates directory if it doesn't exist
mkdir -p certificates

# Generate SSL certificates for localhost
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certificates/localhost.key \
  -out certificates/localhost.crt \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "SSL certificates generated successfully in ./certificates/"
echo "You may need to add the certificate to your system's trusted certificates" 