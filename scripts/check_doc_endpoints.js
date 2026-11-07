const fs = require('fs');
const path = require('path');

const doc = fs.readFileSync('docs/api_documentation.md', 'utf8').replace(/\r/g, '');
const endpoints = [...doc.matchAll(/\*\s+\*\*Endpoint:\*\*\s+`([A-Z]+)\s+([^`\n]+)`/g)].map(m => m[1] + ' ' + m[2].trim());
console.log('Total documented endpoints:', endpoints.length);
console.log('Sample documented endpoints (first 10):');
console.log(endpoints.slice(0, 10).join('\n'));

// Now list all route files in app/api/v1
function getApiRoutes(dir, base = '') {
  let routes = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      routes = routes.concat(getApiRoutes(path.join(dir, item.name), (base ? base + '/' : '') + item.name));
    } else if (item.name === 'route.ts' || item.name === 'route.js') {
      const routePath = '/api/v1' + (base ? '/' + base : '');
      const content = fs.readFileSync(path.join(dir, item.name), 'utf8');
      const methods = [];
      if (/export\s+(async\s+)?function\s+GET|export\s+const\s+GET/i.test(content)) methods.push('GET');
      if (/export\s+(async\s+)?function\s+POST|export\s+const\s+POST/i.test(content)) methods.push('POST');
      if (/export\s+(async\s+)?function\s+PUT|export\s+const\s+PUT/i.test(content)) methods.push('PUT');
      if (/export\s+(async\s+)?function\s+PATCH|export\s+const\s+PATCH/i.test(content)) methods.push('PATCH');
      if (/export\s+(async\s+)?function\s+DELETE|export\s+const\s+DELETE/i.test(content)) methods.push('DELETE');
      if (methods.length === 0 && content.includes('export {')) {
        const reExports = content.match(/export\s*\{\s*([^}]+)\s*\}/);
        if (reExports) {
          reExports[1].split(',').map(m => m.trim()).forEach(m => methods.push(m));
        }
      }
      routes.push({ routePath, methods });
    }
  }
  return routes;
}

const allRoutes = getApiRoutes('app/api/v1');
console.log('Total route files in app/api/v1:', allRoutes.length);

const documentedSet = new Set(endpoints.map(e => {
  // Normalize :param and [param] to :param
  return e.replace(/\[([^\]]+)\]/g, ':$1').replace(/\/$/, '');
}));

const missing = [];
for (const r of allRoutes) {
  const normPath = r.routePath.replace(/\[([^\]]+)\]/g, ':$1');
  for (const m of r.methods) {
    const key = m + ' ' + normPath;
    // Check direct match or alias in doc
    let found = false;
    for (const d of documentedSet) {
      if (d === key || d.startsWith(key + ' ') || d.includes(key)) {
        found = true;
        break;
      }
    }
    if (!found) {
      // Check if doc contains method and path
      if (!doc.includes(normPath) && !doc.includes(r.routePath)) {
        missing.push(key);
      }
    }
  }
}

console.log(`Undocumented endpoints count: ${missing.length}`);
console.log(missing.join('\n'));

