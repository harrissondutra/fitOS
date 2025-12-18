const fs = require('fs');
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

// Check root dependencies (v2/v3 lockfile)
const rootNext = lock.packages['']?.dependencies?.next;
console.log('Root package.json next version:', rootNext || 'Not found');

// Check hoisted next
const next = lock.packages['node_modules/next'];
console.log('node_modules/next version:', next?.version || 'Not found');

// Check frontend workspace
const fe = lock.packages['src/frontend'] || lock.dependencies?.['fitos-frontend']; // v3 vs v1 structure
console.log('src/frontend (packages) versions:', fe?.dependencies?.next || 'Not found');

// Check nested node_modules in workspace if exists
const feNested = lock.packages['src/frontend/node_modules/next'];
console.log('src/frontend/node_modules/next version:', feNested?.version || 'Not found');
