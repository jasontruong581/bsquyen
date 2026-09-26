// Chạy: npm test
// Mốc thời gian viết theo giờ Việt Nam; kết quả phải đúng bất kể múi giờ của máy chạy
// (máy GitHub Actions ở UTC) — thử: TZ=UTC npm test
import assert from "node:assert/strict";
import { test } from "node:test";

import { tinhGioDang } from "./gio-dang.mjs";

const vn = (s) => Date.parse(`${s}+07:00`);
const raVN = (unix) => new Date(unix * 1000 + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ");
const CO_DINH = { gioCoDinh: "19:30", delayPhut: 120 };

test("giờ cố định: kịp trong ngày thì đăng 19:30 hôm đó", () => {
  assert.equal(raVN(tinhGioDang(vn("2026-09-28T09:00:00"), CO_DINH)), "2026-09-28 19:30");
  assert.equal(raVN(tinhGioDang(vn("2026-09-28T19:20:00"), CO_DINH)), "2026-09-28 19:30");
});

test("giờ cố định: còn dưới 10 phút hoặc đã qua thì dời sang hôm sau", () => {
  assert.equal(raVN(tinhGioDang(vn("2026-09-28T19:21:00"), CO_DINH)), "2026-09-29 19:30");
  assert.equal(raVN(tinhGioDang(vn("2026-09-28T19:30:00"), CO_DINH)), "2026-09-29 19:30");
  assert.equal(raVN(tinhGioDang(vn("2026-09-28T23:30:00"), CO_DINH)), "2026-09-29 19:30");
});

test("giờ cố định: sáng sớm VN là ngày hôm qua theo UTC — vẫn tính theo ngày VN", () => {
  // 06:59 VN = 23:59 UTC hôm trước. Lấy ngày theo UTC sẽ ra nhầm 29/9.
  assert.equal(raVN(tinhGioDang(vn("2026-09-28T06:59:00"), CO_DINH)), "2026-09-28 19:30");
  assert.equal(raVN(tinhGioDang(vn("2026-09-28T01:00:00"), CO_DINH)), "2026-09-28 19:30");
});

test("giờ cố định: qua tháng, qua năm", () => {
  assert.equal(raVN(tinhGioDang(vn("2026-09-30T22:00:00"), CO_DINH)), "2026-10-01 19:30");
  assert.equal(raVN(tinhGioDang(vn("2026-12-31T21:00:00"), CO_DINH)), "2027-01-01 19:30");
});

test("GIO_DANG trống thì đăng sau DELAY_PHUT phút", () => {
  const cfg = { gioCoDinh: "", delayPhut: 120 };
  assert.equal(raVN(tinhGioDang(vn("2026-09-28T14:05:00"), cfg)), "2026-09-28 16:05");
});

test("cấu hình sai thì báo lỗi, không đoán", () => {
  const now = vn("2026-09-28T09:00:00");
  for (const gio of ["7h30", "24:00", "19:60"]) {
    assert.throws(() => tinhGioDang(now, { gioCoDinh: gio }), /không hợp lệ/);
  }
  assert.throws(() => tinhGioDang(now, { gioCoDinh: "", delayPhut: 5 }), /≥ 10/);
});
