const fs = require("fs");
const path = require("path");

// 1. Get all routes in app/api
function getApiRoutes(dir) {
  let routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes = routes.concat(getApiRoutes(full));
    } else if (entry.name === "route.ts") {
      const rel = path.relative(path.join(process.cwd(), "app", "api"), full);
      const routePath = "/api/" + rel.replace(/\\/g, "/").replace(/\/route\.ts$/, "");
      routes.push({
        file: full,
        routePath,
        content: fs.readFileSync(full, "utf-8")
      });
    }
  }
  return routes;
}

const apiRoutes = getApiRoutes(path.join(process.cwd(), "app", "api"));

// 2. Read docs/api_documentation.md and extract documented endpoints
const docContent = fs.readFileSync(path.join(process.cwd(), "docs", "api_documentation.md"), "utf-8");
const docEndpoints = [...docContent.matchAll(/###\s+(?:(?:\d+\.|\*)\s+)?(GET|POST|PUT|PATCH|DELETE)\s+`([^`]+)`/g)].map(m => ({
  method: m[1],
  path: m[2]
}));

console.log("Total API routes implemented in app/api:", apiRoutes.length);
console.log("Total endpoints in docs/api_documentation.md:", docEndpoints.length);

// 3. Classify routes with mock data
const mockRoutes = [];
apiRoutes.forEach(r => {
  const lines = r.content.split("\n");
  const found = [];
  lines.forEach((l, i) => {
    if (/(mock[A-Z0-9_a-z]*|dummy|fake)/i.test(l) && !/node_modules|bypass/i.test(l)) {
      found.push({ line: i + 1, text: l.trim() });
    }
  });
  if (found.length > 0) {
    mockRoutes.push({ route: r.routePath, occurrences: found });
  }
});

console.log("\nRoutes containing mock data declarations:", mockRoutes.length);
mockRoutes.forEach(m => {
  console.log(`- ${m.route}:`);
  m.occurrences.forEach(o => console.log(`    L${o.line}: ${o.text}`));
});

