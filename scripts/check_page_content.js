const fs = require("fs");
const path = require("path");

const filesToCheck = [
  "app/(admin)/admin/dashboard/page.tsx",
  "app/(admin)/admin/users/page.tsx",
  "app/(admin)/admin/tasks/page.tsx",
  "app/(admin)/admin/finance/page.tsx",
  "app/(admin)/admin/reports/page.tsx",
  "app/(agent)/agent/dashboard/page.tsx",
  "app/(agent)/agent/tasks/page.tsx",
  "app/(user)/billing/page.tsx",
  "app/(user)/billing/history/page.tsx",
  "app/(user)/billing/plans/page.tsx",
  "app/(user)/chat/page.tsx",
  "app/(user)/notifications/page.tsx",
  "app/(user)/vault/page.tsx",
  "app/(user)/dashboard/tasks/[id]/report/page.tsx",
  "app/(user)/support/page.tsx"
];

filesToCheck.forEach(file => {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  const content = fs.readFileSync(full, "utf-8");
  console.log(`\n========================================`);
  console.log(`FILE: ${file}`);
  
  // Find array declarations: const FOO = [ ... ]
  const arrays = [...content.matchAll(/const\s+([A-Za-z0-9_]+)\s*=\s*\[/g)].map(m => m[1]);
  console.log("Array constants defined:", arrays.join(", "));

  // Find useState initial state with arrays or objects
  const states = [...content.matchAll(/useState\s*(?:<[^>]+>)?\s*\(\s*(\[[^\]]*\]|\{[^\}]*\})/g)].map(m => m[1].slice(0, 80));
  if (states.length) console.log("State initial values:", states);
});

