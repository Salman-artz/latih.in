import { describe, it, expect } from "vitest";
import { normalizeRedeemCode } from "@/lib/validators/redeem";
import { extractYoutubeId } from "@/lib/validators/admin";

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
});
