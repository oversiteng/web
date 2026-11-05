const fs = require("fs");
const path = require("path");

const appDir = path.join(process.cwd(), "app");

function findPages(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== "api" && file !== "fonts") {
        results = results.concat(findPages(fullPath));
      }
    } else if (file === "page.tsx") {
      results.push(fullPath);
    }
  });
  return results;
}

const pages = findPages(appDir);

const audit = pages.map(p => {
  const content = fs.readFileSync(p, "utf-8");
  const relPath = path.relative(process.cwd(), p).replace(/\\/g, "/");
  
  // Extract fetch endpoints
  const fetchMatches = [...content.matchAll(/fetch\(\s*["`']([^"`']+)["`']/g)].map(m => m[1]);
  // Also extract string occurrences of /api/v1/
  const apiMatches = [...content.matchAll(/\/api\/v1\/[a-zA-Z0-9_\-\[\]]+/g)].map(m => m[0]);
  
  // Extract mock patterns
  const mockMatches = [];
  if (/MOCK|mock|dummy|fake/i.test(content)) {
    const lines = content.split("\n");
    lines.forEach((l, idx) => {
      if (/const\s+(mock|dummy|fake|sample|MOCK)/i.test(l) || /let\s+(mock|dummy|fake|sample|MOCK)/i.test(l)) {
        mockMatches.push({ line: idx + 1, text: l.trim() });
      }
    });
  }

  return {
    page: relPath,
    endpoints: Array.from(new Set([...fetchMatches, ...apiMatches])),
    mockMatches,
    linesCount: content.split("\n").length
  };
});

fs.writeFileSync("scratch_folder/page_api_audit_dump.json", JSON.stringify(audit, null, 2));
console.log(`Audited ${audit.length} pages.`);

