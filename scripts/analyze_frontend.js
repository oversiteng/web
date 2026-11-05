const fs = require("fs");
const data = require("../scratch_folder/page_api_audit_dump.json");

console.log("=== PAGES WITHOUT ANY API/FETCH CALLS ===");
const noApi = data.filter(d => d.endpoints.length === 0);
noApi.forEach(d => console.log(`- ${d.page} (${d.linesCount} lines)`));

console.log("\n=== PAGES WITH API CALLS ===");
const withApi = data.filter(d => d.endpoints.length > 0);
withApi.forEach(d => console.log(`- ${d.page} -> [${d.endpoints.join(", ")}]`));

