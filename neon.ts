import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  preview: {
    // Upgrade to a paid plan to enable AI Gateway for your project.
    // aiGateway: true,
    buckets: {
      "property-image": { access: "private" },
      "report-doc": { access: "private" },
      miscellaneous: { access: "private" },
    },
    functions: {
      api: { name: "api", source: "./hello.ts" },
    },
  },
});
