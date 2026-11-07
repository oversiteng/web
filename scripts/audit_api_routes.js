const fs = require("fs");
const path = require("path");

const apiDir = path.join(process.cwd(), "app", "api");

function findRoutes(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findRoutes(fullPath));
    } else if (file === "route.ts") {
      results.push(fullPath);
    }
  });
  return results;
}

const routes = findRoutes(apiDir);

const routeAnalysis = routes.map(r => {
  const content = fs.readFileSync(r, "utf-8");
  const relPath = path.relative(process.cwd(), r).replace(/\\/g, "/");
  
  // Supported methods
  const methods = [];
  if (/export\s+async\s+function\s+GET/i.test(content) || /export\s+const\s+GET/i.test(content)) methods.push("GET");
  if (/export\s+async\s+function\s+POST/i.test(content) || /export\s+const\s+POST/i.test(content)) methods.push("POST");
  if (/export\s+async\s+function\s+PUT/i.test(content) || /export\s+const\s+PUT/i.test(content)) methods.push("PUT");
  if (/export\s+async\s+function\s+PATCH/i.test(content) || /export\s+const\s+PATCH/i.test(content)) methods.push("PATCH");
  if (/export\s+async\s+function\s+DELETE/i.test(content) || /export\s+const\s+DELETE/i.test(content)) methods.push("DELETE");

  // Check if it uses DB
  const usesDb = /db\.(select|insert|update|delete|query)|from\s+["']@\/db["']/i.test(content);
  
  // Check if it uses mock
  const hasMock = /mock|dummy|fake/i.test(content);
  
  // Find mock variable declarations or returns
  const mockLines = [];
  content.split("\n").forEach((line, idx) => {
    if (/(mock[a-zA-Z0-9_]*|dummy|fake)\s*(=|:)/i.test(line) || /return\s+.*mock/i.test(line)) {
      mockLines.push({ line: idx + 1, text: line.trim() });
    }
  });

  return {
    route: relPath,
    methods,
    usesDb,
    hasMock,
    mockLines
  };
});

fs.writeFileSync("scratch_folder/api_routes_audit_dump.json", JSON.stringify(routeAnalysis, null, 2));
console.log(`Audited ${routeAnalysis.length} API routes.`);
const mockRoutes = routeAnalysis.filter(r => r.hasMock || !r.usesDb);
console.log(`Routes with mock or no DB: ${mockRoutes.length}`);
mockRoutes.forEach(r => console.log(`- ${r.route} [${r.methods.join(",")}] (usesDb: ${r.usesDb}, hasMock: ${r.hasMock})`));

