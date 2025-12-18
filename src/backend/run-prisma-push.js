
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Try finding .env in common locations
const envPaths = [
    path.join(__dirname, '../../.env'), // Root
    path.join(__dirname, '../.env'), // Backend root
    path.join(__dirname, '.env')
];

let envLoaded = false;
for (const p of envPaths) {
    if (fs.existsSync(p)) {
        console.log(`Loading .env from ${p}`);
        require('dotenv').config({ path: p });
        envLoaded = true;
        break;
    }
}

if (!envLoaded) {
    console.error('Could not find .env file');
    process.exit(1);
}

try {
    console.log('Running prisma db push --accept-data-loss...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
} catch (error) {
    console.error('Error running prisma:', error);
    process.exit(1);
}
