const { execSync } = require("child_process");

try {
  let dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.includes("sumobase.my.id") && !dbUrl.includes("schema=")) {
    const sep = dbUrl.includes("?") ? "&" : "?";
    dbUrl = `${dbUrl}${sep}schema=latih_in`;
  }
  console.log("Menyelaraskan skema database produksi...");
  execSync("npx prisma db push --accept-data-loss --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl || process.env.DATABASE_URL },
  });
} catch (err) {
  console.warn("Peringatan: Gagal menyelaraskan database selama build (akan dilewati):", err.message);
}
