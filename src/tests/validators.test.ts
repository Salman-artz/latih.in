import { describe, it, expect } from "vitest";
import { normalizeRedeemCode } from "@/lib/validators/redeem";
import { extractYoutubeId } from "@/lib/validators/admin";
import { passwordSchema, validatePassword, registerSchema } from "@/lib/validators/auth";

describe("Validasi & Helper Logika", () => {
  it("normalisasi kode redeem dengan benar (trim, uppercase, buang tanda hubung dan spasi)", () => {
    expect(normalizeRedeemCode(" latih-demo-0001 ")).toBe("LATIHDEMO0001");
    expect(normalizeRedeemCode("abcd - efgh - 1234")).toBe("ABCDEFGH1234");
    expect(normalizeRedeemCode("latih 01")).toBe("LATIH01");
  });

  it("ekstraksi YouTube ID dari berbagai format URL dan ID langsung", () => {
    // ID langsung
    expect(extractYoutubeId("Wn6p_y7m15M")).toBe("Wn6p_y7m15M");
    // URL standar watch
    expect(extractYoutubeId("https://www.youtube.com/watch?v=Wn6p_y7m15M")).toBe("Wn6p_y7m15M");
    // URL youtu.be
    expect(extractYoutubeId("https://youtu.be/Wn6p_y7m15M")).toBe("Wn6p_y7m15M");
    // URL embed
    expect(extractYoutubeId("https://www.youtube-nocookie.com/embed/Wn6p_y7m15M")).toBe("Wn6p_y7m15M");
    // URL dengan query parameter tambahan
    expect(extractYoutubeId("https://www.youtube.com/watch?feature=shared&v=Wn6p_y7m15M")).toBe("Wn6p_y7m15M");
    // Format invalid
    expect(extractYoutubeId("https://example.com/video")).toBeNull();
  });

  describe("Validasi Password (Min. 8 Karakter, 1 Huruf Besar, 1 Huruf Kecil, 1 Angka)", () => {
    it("menolak password yang kurang dari 8 karakter", () => {
      const res = validatePassword("Ab1");
      expect(res.isValid).toBe(false);
      expect(res.error).toBe("Password minimal 8 karakter");
      expect(() => passwordSchema.parse("Ab1")).toThrow("Password minimal 8 karakter");
    });

    it("menolak password tanpa huruf besar (A-Z)", () => {
      const res = validatePassword("password123");
      expect(res.isValid).toBe(false);
      expect(res.error).toBe("Password harus mengandung minimal 1 huruf besar (A-Z)");
      expect(() => passwordSchema.parse("password123")).toThrow("Password harus mengandung minimal 1 huruf besar (A-Z)");
    });

    it("menolak password tanpa huruf kecil (a-z)", () => {
      const res = validatePassword("PASSWORD123");
      expect(res.isValid).toBe(false);
      expect(res.error).toBe("Password harus mengandung minimal 1 huruf kecil (a-z)");
      expect(() => passwordSchema.parse("PASSWORD123")).toThrow("Password harus mengandung minimal 1 huruf kecil (a-z)");
    });

    it("menolak password tanpa angka (0-9)", () => {
      const res = validatePassword("PasswordLatih");
      expect(res.isValid).toBe(false);
      expect(res.error).toBe("Password harus mengandung minimal 1 angka (0-9)");
      expect(() => passwordSchema.parse("PasswordLatih")).toThrow("Password harus mengandung minimal 1 angka (0-9)");
    });

    it("menerima password yang memenuhi seluruh kriteria", () => {
      const res = validatePassword("Demo#12345");
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
      expect(passwordSchema.parse("Demo#12345")).toBe("Demo#12345");
      expect(passwordSchema.parse("LatihUser2026")).toBe("LatihUser2026");
    });

    it("memvalidasi schema registrasi lengkap", () => {
      const valid = registerSchema.safeParse({
        name: "Pengguna Unggul",
        email: "pengguna@sekolah.sch.id",
        password: "PenggunaBaru#2026",
      });
      expect(valid.success).toBe(true);

      const invalid = registerSchema.safeParse({
        name: "A",
        email: "invalid-email",
        password: "lemah",
      });
      expect(invalid.success).toBe(false);
    });
  });
});
