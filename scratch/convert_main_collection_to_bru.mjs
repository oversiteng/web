import fs from "node:fs";
import path from "node:path";

const targetDir = "./bruno-collection/Oversite V2026 Mobile API";
const backupDir = "./scratch/backup_yaml_collection";
const sourceBruDir = "./bruno-collection/Oversite V2026 Bru Collection";

console.log("1. Creating backup of YAML collection...");
fs.cpSync(targetDir, backupDir, { recursive: true });

console.log("2. Removing all .yml files from Oversite V2026 Mobile API...");
function removeYaml(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeYaml(full);
    } else if (entry.name.endsWith(".yml")) {
      fs.unlinkSync(full);
      console.log(`Deleted: ${full}`);
    }
  }
}
removeYaml(targetDir);

console.log("3. Copying all .bru files into Oversite V2026 Mobile API...");
fs.cpSync(sourceBruDir, targetDir, { recursive: true });

console.log("4. Cleaning up temporary Bru Collection folder...");
fs.rmSync(sourceBruDir, { recursive: true, force: true });

console.log("5. Verifying files in Oversite V2026 Mobile API...");
function listFiles(dir) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += listFiles(full);
    } else if (entry.name.endsWith(".bru")) {
      count++;
    }
  }
  return count;
}

const totalBru = listFiles(targetDir);
console.log(`Successfully converted Oversite V2026 Mobile API to native Bruno format! Total .bru files: ${totalBru}`);
