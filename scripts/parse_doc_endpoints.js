const fs = require("fs");
const path = require("path");

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

const docContent = fs.readFileSync(path.join(process.cwd(), "docs", "api_documentation.md"), "utf-8");
const docEndpoints = [...docContent.matchAll(/\*\s+\*\*Endpoint:\*\*\s+`([^`]+)`/g)].map(m => {
  const parts = m[1].split(/\s+/);
  return {
    raw: m[1],
    method: parts[0],
    path: parts[1]
  };
});

console.log("Total API routes on disk:", apiRoutes.length);
console.log("Total documented endpoints in docs/api_documentation.md:", docEndpoints.length);
console.log("\nSample documented endpoints:");
docEndpoints.slice(0, 10).forEach(d => console.log(`  ${d.method} ${d.path}`));

// Compare implemented routes vs documented endpoints
const documentedPaths = new Set(docEndpoints.map(d => d.path));
const diskPaths = new Set(apiRoutes.map(r => r.routePath));

console.log("\n=== DISK ROUTES NOT EXPLICITLY IN DOCUMENTATION ===");
apiRoutes.forEach(r => {
  // Normalize dynamic params [id] -> :id
  const normalized = r.routePath.replace(/\[([^\]]+)\]/g, ":$1");
  const found = docEndpoints.some(d => d.path === normalized || d.path === r.routePath);
  if (!found) {
    console.log(`- ${r.routePath} (${normalized})`);
  }
});

