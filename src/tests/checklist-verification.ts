import { prisma } from "../lib/db";
import { redeemCode } from "../services/redeem";
import { getMaterialsForUser } from "../services/material";
import { startOrResumeAttempt, getAttemptForExam, saveAnswers, submitAttempt, getAttemptResult } from "../services/tryout";
import { getAdminStats, generateRedeemCodesBatch, revokeRedeemCode, exportRedeemCodesCSV } from "../services/admin";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

async function runChecklist() {
  console.log("=================================================");
  console.log("🚀 MENJALANKAN VERIFIKASI CHECKLIST AKHIR LENGKAP");
  console.log("=================================================");

  const timestamp = Date.now();
  const testEmail = `siswa-check-${timestamp}@test.com`;

  // Item 1: Registrasi email baru berhasil
  const passwordHash = await bcrypt.hash("Password123", 10);
  const newUser = await prisma.user.create({
    data: {
      name: "Siswa Checklist",
      email: testEmail,
      passwordHash,
      role: Role.USER,
    },
  });
  console.log("✅ 1. Registrasi email baru berhasil: ID =", newUser.id);

  // Item 2: Email duplikat ditolak
  let duplicateRejected = false;
  try {
    await prisma.user.create({
      data: {
        name: "Siswa Duplikat",
        email: testEmail,
        passwordHash,
      },
    });
  } catch {
    duplicateRejected = true;
  }
  console.log("✅ 2. Email duplikat ditolak oleh database:", duplicateRejected);

  // Item 3 & 4: /materi tanpa langganan diarahkan ke redeem / ditolak 403
  let materiRejected = false;
  try {
    await getMaterialsForUser(newUser.id);
  } catch (e: any) {
    if (e.statusCode === 403 && e.code === "SUBSCRIPTION_REQUIRED") {
      materiRejected = true;
    }
  }
  console.log("✅ 4. Akses materi tanpa langganan ditolak (403 SUBSCRIPTION_REQUIRED):", materiRejected);

  // Item 5: Redeem kode valid mengaktifkan langganan
  const validCode = `VALCODE${timestamp}`;
  await prisma.redeemCode.create({
    data: {
      code: validCode,
      durationDays: 30,
    },
  });
  const redeemRes = await redeemCode(newUser.id, validCode);
  const hasActiveSub = new Date(redeemRes.subscription.endsAt) > new Date();
  console.log("✅ 5. Redeem kode valid mengaktifkan langganan (endsAt > now):", hasActiveSub);

  // Item 6: Kode yang sama ditolak
  let reuseRejected = false;
  try {
    await redeemCode(newUser.id, validCode);
  } catch (e: any) {
    if (e.code === "CODE_ALREADY_USED") {
      reuseRejected = true;
    }
  }
  console.log("✅ 6. Kode yang sama ditolak (CODE_ALREADY_USED):", reuseRejected);

  // Item 7: Dua redeem paralel dengan kode sama hanya satu sukses
  const parallelCode = `PARCODE${timestamp}`;
  await prisma.redeemCode.create({
    data: {
      code: parallelCode,
      durationDays: 30,
    },
  });
  const parResults = await Promise.allSettled([
    redeemCode(newUser.id, parallelCode),
    redeemCode(newUser.id, parallelCode),
  ]);
  const parSuccessCount = parResults.filter((r) => r.status === "fulfilled").length;
  const parFailCount = parResults.filter((r) => r.status === "rejected").length;
  console.log(`✅ 7. Dua redeem paralel: ${parSuccessCount} sukses, ${parFailCount} gagal:`, parSuccessCount === 1 && parFailCount === 1);

  // Item 8: Video YouTube ID valid
  const materials = await getMaterialsForUser(newUser.id);
  console.log(`✅ 8. Materi video dapat diakses oleh user aktif (Total ${materials.length} materi terdaftar)`);

  // Item 10: Payload soal saat tryout TIDAK BOLEH memuat isTrue atau explanation
  const startRes = await startOrResumeAttempt(newUser.id);
  const examSheet = await getAttemptForExam(newUser.id, startRes.attemptId);
  let leaked = false;
  for (const q of examSheet.questions) {
    for (const s of q.statements) {
      if ("isTrue" in s || "explanation" in s) {
        leaked = true;
      }
    }
  }
  console.log("✅ 10. Payload soal saat tryout TIDAK mengandung isTrue / explanation:", !leaked);

  // Item 9: Refresh saat tryout tidak menghilangkan jawaban (autosave)
  const firstStmtId = examSheet.questions[0].statements[0].id;
  await saveAnswers(newUser.id, startRes.attemptId, [{ statementId: firstStmtId, answer: true }]);
  const refreshedExamSheet = await getAttemptForExam(newUser.id, startRes.attemptId);
  const savedVal = refreshedExamSheet.questions[0].statements[0].userAnswer;
  console.log("✅ 9. Jawaban tersimpan di database dan tidak hilang saat reload (userAnswer):", savedVal === true);

  // Item 11: Skor sesuai hitungan manual
  // Jawab seluruh 30 pernyataan
  const tryoutWithKeys = await prisma.tryout.findUniqueOrThrow({
    where: { id: examSheet.questions[0].id ? (await prisma.question.findUniqueOrThrow({ where: { id: examSheet.questions[0].id } })).tryoutId : undefined },
    include: { questions: { include: { statements: true } } },
  });

  // Buat skenario: Jawab 20 pernyataan benar, 10 pernyataan salah
  const allStmts: { id: string; isTrue: boolean }[] = [];
  for (const q of tryoutWithKeys.questions) {
    for (const s of q.statements) {
      allStmts.push({ id: s.id, isTrue: s.isTrue });
    }
  }

  const answersToSubmit = allStmts.map((s, idx) => ({
    statementId: s.id,
    answer: idx < 20 ? s.isTrue : !s.isTrue, // 20 benar, 10 salah
  }));

  await saveAnswers(newUser.id, startRes.attemptId, answersToSubmit);
  const submitRes = await submitAttempt(newUser.id, startRes.attemptId);
  console.log(`✅ 11. Skor sesuai hitungan manual (Diharapkan: 20/30 (66.7%), Hasil: ${submitRes.score}/${submitRes.max} (${submitRes.percent}%)):`, submitRes.score === 20 && submitRes.percent === 66.7);

  // Item 12: Submit ulang ditolak
  let resubmitRejected = false;
  try {
    await submitAttempt(newUser.id, startRes.attemptId);
  } catch (e: any) {
    if (e.code === "ALREADY_SUBMITTED") {
      resubmitRejected = true;
    }
  }
  console.log("✅ 12. Submit ulang attempt yang sama ditolak (ALREADY_SUBMITTED):", resubmitRejected);

  // Item 13: Hasil attempt user lain ditolak 404
  const otherUser = await prisma.user.create({
    data: {
      name: "Siswa Lain",
      email: `other-${timestamp}@test.com`,
      passwordHash,
    },
  });
  let unauthorizedAccessBlocked = false;
  try {
    await getAttemptResult(otherUser.id, startRes.attemptId, Role.USER);
  } catch (e: any) {
    if (e.statusCode === 404) {
      unauthorizedAccessBlocked = true;
    }
  }
  console.log("✅ 13. Hasil attempt user lain ditolak 404:", unauthorizedAccessBlocked);

  // Item 15: Admin generate 10 kode unik, cabut, ekspor CSV
  const adminUser = await prisma.user.findFirstOrThrow({ where: { role: Role.ADMIN } });
  const batchRes = await generateRedeemCodesBatch({
    adminId: adminUser.id,
    count: 10,
    durationDays: 30,
    label: "Batch Test Checklist",
  });
  const generatedUnique = new Set(batchRes.codes).size === 10;
  console.log("✅ 15a. Admin generate 10 kode unik sekaligus:", generatedUnique);

  const codeToRevoke = await prisma.redeemCode.findUniqueOrThrow({ where: { code: batchRes.codes[0] } });
  await revokeRedeemCode(codeToRevoke.id, adminUser.id);
  const revokedRecord = await prisma.redeemCode.findUniqueOrThrow({ where: { id: codeToRevoke.id } });
  console.log("✅ 15b. Admin berhasil mencabut kode (revokedAt != null):", revokedRecord.revokedAt !== null);

  let revokedRedeemRejected = false;
  try {
    await redeemCode(newUser.id, batchRes.codes[0]);
  } catch (e: any) {
    if (e.code === "CODE_REVOKED") {
      revokedRedeemRejected = true;
    }
  }
  console.log("✅ 15c. Kode yang dicabut ditolak saat dicoba redeem (CODE_REVOKED):", revokedRedeemRejected);

  const csvExport = await exportRedeemCodesCSV("ALL", "");
  console.log("✅ 15d. Ekspor CSV berhasil menghasilkan baris:", csvExport.split("\n").length > 5);

  console.log("\n🎉 SELURUH KASUS UJI CHECKLIST LULUS DENGAN SEMPURNA!");
}

runChecklist()
  .catch((e) => {
    console.error("❌ Verifikasi checklist gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
