const fs = require("fs");
const path = require("path");

const files = [
  "app/(user)/billing/page.tsx",
  "app/(user)/billing/history/page.tsx",
  "app/(user)/billing/plans/page.tsx",
  "app/(user)/chat/page.tsx",
  "app/(user)/notifications/page.tsx",
  "app/(user)/vault/page.tsx",
  "app/(user)/dashboard/tasks/[id]/report/page.tsx"
];

files.forEach(f => {
  const p = path.join(process.cwd(), f);
  const content = fs.readFileSync(p, "utf-8");
  console.log(`\n=================== ${f} ===================`);
  // Look for hardcoded data structures or sample items
  const lines = content.split("\n");
  lines.slice(0, 50).forEach((l, i) => {
    if (/const\s+|let\s+|useState/i.test(l)) {
      console.log(`L${i+1}: ${l.trim()}`);
    }
  });
});

