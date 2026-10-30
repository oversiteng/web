const fs = require('fs');

let code = fs.readFileSync('app/(user)/support/page.tsx', 'utf8');
code = code.replace(/\r\n/g, '\n');

if (!code.includes('PageHeader')) {
  code = code.replace(
    'import { useRouter } from "next/navigation";',
    'import { useRouter } from "next/navigation";\nimport { PageHeader } from "@/components/ui/PageHeader";'
  );
}

code = code.replace(
  '<div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-16 select-none">',
  '<div className="relative w-full text-[var(--text-heading)] pb-16 select-none">'
);

const oldSupportHeader = `      {/* ── Top Header ── */}
      <div className="relative flex items-center justify-center py-3 mb-8">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/more");
            }
          }}
          aria-label="Go back"
          className="absolute left-0 w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text-heading)]">
          Support
        </h1>
      </div>`;

const newSupportHeader = `      {/* ── Unified Page Header ── */}
      <PageHeader
        title="Support"
        showBack={true}
        onBack={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/more");
          }
        }}
      />`;

code = code.replace(oldSupportHeader, newSupportHeader);
fs.writeFileSync('app/(user)/support/page.tsx', code.replace(/\n/g, '\r\n'), 'utf8');
console.log('Fixed support/page.tsx');
