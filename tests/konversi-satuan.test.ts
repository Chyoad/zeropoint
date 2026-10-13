import { describe, it, expect } from "vitest";
import { konversiKeSatuanDasar, konversiDariSatuanDasar } from "@/lib/konversi-satuan";

describe("Konversi Multi-Satuan", () => {
  it("harus mengonversi kuantitas transaksi ke satuan dasar dengan tepat", () => {
    // 5 Karton x rasio 24 = 120 Pcs
    expect(konversiKeSatuanDasar(5, 24)).toBe(120);
    // 2.5 Lusin x rasio 12 = 30 Pcs
    expect(konversiKeSatuanDasar(2.5, 12)).toBe(30);
  });

  it("harus mengonversi dari satuan dasar ke satuan target", () => {
    // 120 Pcs / rasio 24 = 5 Karton
    expect(konversiDariSatuanDasar(120, 24)).toBe(5);
    // 30 Pcs / rasio 12 = 2.5 Lusin
    expect(konversiDariSatuanDasar(30, 12)).toBe(2.5);
  });

  it("harus melempar error jika rasio <= 0", () => {
    expect(() => konversiKeSatuanDasar(10, 0)).toThrow();
    expect(() => konversiKeSatuanDasar(10, -5)).toThrow();
    expect(() => konversiDariSatuanDasar(10, 0)).toThrow();
    expect(() => konversiDariSatuanDasar(10, -2)).toThrow();
  });

  it("harus menangani presisi desimal dengan benar tanpa floating point error yang aneh", () => {
    // 0.1 * 3 in floating point is 0.30000000000000004
    expect(konversiKeSatuanDasar(0.1, 3)).toBe(0.3);
    expect(konversiDariSatuanDasar(0.3, 3)).toBe(0.1);
  });
});
