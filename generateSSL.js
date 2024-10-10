const fs = require('fs');
const { execSync } = require('child_process');

// Generate SSL certificate
try {
    execSync('openssl req -nodes -new -x509 -keyout server.key -out server.cert -subj "/CN=localhost"');
    console.log('SSL certificates generated successfully.');
} catch (err) {
    console.error('Error generating SSL certificates:', err);
}