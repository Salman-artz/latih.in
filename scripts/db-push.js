const { execSync } = require("child_process");

try {
  console.log("Menyelaraskan skema database produksi...");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
} catch (err) {
  console.warn("Peringatan: Gagal menyelaraskan database selama build (akan dilewati):", err.message);
}
