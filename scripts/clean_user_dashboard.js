const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "app/(user)/dashboard/page.tsx");
let content = fs.readFileSync(file, "utf-8");

// 1. Replace initial summary state
content = content.replace(
  /activeRequests:\s*3,\s*pendingReports:\s*1,\s*monitoredProperties:\s*3/g,
  "activeRequests: 0, pendingReports: 0, monitoredProperties: 0"
);

// 2. Add unreadCount state
if (!content.includes("unreadNotifications")) {
  content = content.replace(
    /const \[loadingTasks, setLoadingTasks\] = useState\(true\);/,
    "const [loadingTasks, setLoadingTasks] = useState(true);\n  const [unreadNotifications, setUnreadNotifications] = useState(0);"
  );
}

// 3. Load unread count in loadDashboardData
if (!content.includes("/api/v1/notifications")) {
  content = content.replace(
    /\/\/ Load dashboard stats/,
    `// Load unread notifications
        try {
          const notifsRes = await fetch("/api/v1/notifications", { credentials: "include", headers });
          const notifsJson = await notifsRes.json();
          if (notifsJson.success && Array.isArray(notifsJson.data)) {
            const unread = notifsJson.data.filter((n: any) => !n.isRead).length;
            setUnreadNotifications(unread);
          }
        } catch (e) {}

        // Load dashboard stats`
  );
}

// 4. Replace hardcoded 2 in Bell badge
content = content.replace(
  /<span className="absolute top-0\.5 right-0\.5 w-4 h-4 bg-\[var\(--primary\)\] text-white text-\[9px\] font-bold rounded-full flex items-center justify-center border-2 border-\[var\(--bg-body\)\]">\s*2\s*<\/span>/g,
  `{unreadNotifications > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[var(--primary)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--bg-body)]">
              {unreadNotifications}
            </span>
          )}`
);

// 5. Replace summary.monitoredProperties || 2 with summary.monitoredProperties || 0
content = content.replace(/summary\.monitoredProperties\s*\|\|\s*2/g, "summary.monitoredProperties");

// 6. Replace hardcoded Flag 1 with 0
content = content.replace(
  /<span className=" sm:text-\[17px\] font-bold text-\[var\(--text-heading\)\]">1<\/span>/g,
  `<span className=" sm:text-[17px] font-bold text-[var(--text-heading)]">0</span>`
);

fs.writeFileSync(file, content, "utf-8");
console.log("Cleaned user dashboard page.");

