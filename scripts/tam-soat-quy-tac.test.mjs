// Test cho quy tắc công cụ tầm soát (js/tam-soat-quy-tac.js).
// Hai lớp: (1) chữ trong code khớp nguyên văn bảng bác sĩ đã duyệt ở
// docs/quy-tac-cong-cu-tam-soat.md; (2) mỗi quy tắc bật đúng điều kiện của nó.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { ketQua, CHU } = require("../js/tam-soat-quy-tac.js");

const DOC = readFileSync(new URL("../docs/quy-tac-cong-cu-tam-soat.md", import.meta.url), "utf8")
  .replace(/\r\n/g, "\n");
const boDam = (s) => s.replace(/\*\*/g, "").trim();

// Dòng bảng: | ID | Điều kiện | Người dùng thấy | Nguồn |
function chuTrongBang() {
  const kq = {};
  for (const dong of DOC.split("\n")) {
    const o = dong.split("|").map((s) => s.trim());
    if (o.length >= 6 && /^[A-Z]{1,3}\d+$/.test(o[1])) kq[o[1]] = boDam(o[3]);
  }
  return kq;
}

// Khối trích dẫn (> ...) đầu tiên nằm dưới tiêu đề ### cho trước.
function trichDanDuoi(tieuDe) {
  const dong = DOC.split("\n");
  let i = dong.findIndex((d) => d.startsWith("### " + tieuDe));
  assert.ok(i >= 0, `docs thiếu mục "### ${tieuDe}"`);
  while (i < dong.length && !dong[i].startsWith("> ")) i++;
  const khoi = [];
  while (i < dong.length && dong[i].startsWith(">")) khoi.push(dong[i++].replace(/^>\s?/, ""));
  return boDam(khoi.join(" "));
}

test("chữ trong code khớp nguyên văn bảng đã duyệt", () => {
  const bang = chuTrongBang();
  const idBang = Object.keys(bang).sort();
  const idCode = Object.keys(CHU).filter((k) => /^[A-Z]{1,3}\d+$/.test(k) && k !== "R0" && k !== "T0");
  assert.deepEqual(idCode.sort(), idBang, "bộ ID trong code và trong bảng phải trùng nhau");
  for (const id of idBang) assert.equal(CHU[id], bang[id], `lệch chữ ở ${id}`);

  assert.equal(CHU.R0, trichDanDuoi("R0"));
  assert.equal(CHU.T0, trichDanDuoi("T0"));
  assert.equal(CHU.KHONG_KHOP, trichDanDuoi("Không có mục nào khớp"));
  assert.equal(CHU.MIEN_TRU, trichDanDuoi("Luôn hiện ở cuối kết quả"));
});

const ids = (tl) => ketQua({ giaDinh: [], banThan: [], ...tl }).muc.map((m) => m.id);

test("R0: có dấu hiệu thì bật cờ cảnh báo, nhưng vẫn tính lịch tầm soát bên dưới", () => {
  const kq = ketQua({ tuoi: 50, gioi: "nam", dauHieu: true, giaDinh: [], banThan: [] });
  assert.equal(kq.dauHieu, true);
  assert.deepEqual(kq.muc.map((m) => m.id), ["D1", "DD1"]);
  assert.equal(ketQua({ tuoi: 50, gioi: "nam", giaDinh: [], banThan: [] }).dauHieu, false);
});

test("T0: dưới 18 tuổi không có mục tầm soát nào, kể cả khi chọn tiền sử", () => {
  const kq = ketQua({ tuoi: 16, gioi: "nu", dauHieu: true, giaDinh: ["vu"], banThan: ["hp", "chua-tiem-hpv"] });
  assert.equal(kq.duoiTuoi, true);
  assert.equal(kq.dauHieu, true);
  assert.deepEqual(kq.muc, []);
  assert.equal(ketQua({ tuoi: 18, gioi: "nam" }).duoiTuoi, false);
});

test("V1–V4: vú theo tuổi và nguy cơ", () => {
  assert.deepEqual(ids({ tuoi: 39, gioi: "nu" }).filter((x) => x[0] === "V"), ["V2"]);
  assert.deepEqual(ids({ tuoi: 40, gioi: "nu" }).filter((x) => x[0] === "V"), ["V1"]);
  assert.deepEqual(ids({ tuoi: 74, gioi: "nu" }).filter((x) => x[0] === "V"), ["V1"]);
  assert.deepEqual(ids({ tuoi: 75, gioi: "nu" }).filter((x) => x[0] === "V"), ["V4"]);
  for (const nguyCo of [{ giaDinh: ["vu"] }, { banThan: ["brca"] }, { banThan: ["xa-tri-nguc"] }]) {
    assert.deepEqual(ids({ tuoi: 30, gioi: "nu", ...nguyCo }).filter((x) => x[0] === "V"), ["V3"]);
    assert.deepEqual(ids({ tuoi: 74, gioi: "nu", ...nguyCo }).filter((x) => x[0] === "V"), ["V3"]);
    assert.deepEqual(ids({ tuoi: 80, gioi: "nu", ...nguyCo }).filter((x) => x[0] === "V"), ["V4"]);
  }
  assert.equal(ids({ tuoi: 50, gioi: "nam", giaDinh: ["vu"], banThan: ["brca"] }).some((x) => x[0] === "V"), false);
});

test("C1–C4: cổ tử cung theo tuổi, miễn dịch, vắc-xin", () => {
  const c = (tl) => ids({ gioi: "nu", ...tl }).filter((x) => x[0] === "C");
  assert.deepEqual(c({ tuoi: 20 }), []);
  assert.deepEqual(c({ tuoi: 21 }), ["C1"]);
  assert.deepEqual(c({ tuoi: 65 }), ["C1"]);
  assert.deepEqual(c({ tuoi: 66 }), ["C4"]);
  assert.deepEqual(c({ tuoi: 24, banThan: ["suy-giam-mien-dich"] }), ["C1"]);
  assert.deepEqual(c({ tuoi: 25, banThan: ["suy-giam-mien-dich"] }), ["C2"]);
  assert.deepEqual(c({ tuoi: 65, banThan: ["suy-giam-mien-dich"] }), ["C2"]);
  assert.deepEqual(c({ tuoi: 70, banThan: ["suy-giam-mien-dich"] }), ["C4"]);
  assert.deepEqual(c({ tuoi: 18, banThan: ["chua-tiem-hpv"] }), ["C3"]);
  assert.deepEqual(c({ tuoi: 30, banThan: ["chua-tiem-hpv"] }), ["C1", "C3"]);
  assert.equal(ids({ tuoi: 30, gioi: "nam", banThan: ["chua-tiem-hpv", "suy-giam-mien-dich"] }).some((x) => x[0] === "C"), false);
});

test("D1–D3: đại trực tràng theo tuổi và nguy cơ, mọi giới", () => {
  const d = (tl) => ids({ gioi: "nam", ...tl }).filter((x) => /^D\d/.test(x));
  assert.deepEqual(d({ tuoi: 44 }), []);
  assert.deepEqual(d({ tuoi: 45 }), ["D1"]);
  assert.deepEqual(d({ tuoi: 75 }), ["D1"]);
  assert.deepEqual(d({ tuoi: 76 }), ["D3"]);
  for (const nguyCo of [{ giaDinh: ["dai-truc-trang"] }, { banThan: ["polyp"] }, { banThan: ["viem-ruot"] }]) {
    assert.deepEqual(d({ tuoi: 30, ...nguyCo }), ["D2"]);
    assert.deepEqual(d({ tuoi: 75, ...nguyCo }), ["D2"]);
    assert.deepEqual(d({ tuoi: 80, ...nguyCo }), ["D3"]);
  }
  assert.deepEqual(ids({ tuoi: 45, gioi: "nu" }).filter((x) => /^D\d/.test(x)), ["D1"]);
});

test("G1–G2: gan theo tiền sử, không phụ thuộc tuổi hay giới", () => {
  const g = (tl) => ids({ tuoi: 30, gioi: "nam", ...tl }).filter((x) => x[0] === "G");
  assert.deepEqual(g({}), []);
  for (const nguyCo of [{ banThan: ["viem-gan-b"] }, { banThan: ["viem-gan-c"] }, { banThan: ["xo-gan"] }, { giaDinh: ["gan"] }]) {
    assert.deepEqual(g(nguyCo), ["G1"]);
  }
  assert.deepEqual(g({ banThan: ["chua-xn-viem-gan"] }), ["G2"]);
  assert.deepEqual(g({ banThan: ["chua-xn-viem-gan", "viem-gan-b"] }), ["G1"], "G1 thắng G2");
});

test("DD1–DD2: dạ dày theo tuổi và nguy cơ", () => {
  const dd = (tl) => ids({ gioi: "nu", ...tl }).filter((x) => x.startsWith("DD"));
  assert.deepEqual(dd({ tuoi: 39 }), []);
  assert.deepEqual(dd({ tuoi: 40 }), ["DD1"]);
  for (const nguyCo of [{ banThan: ["hp"] }, { giaDinh: ["da-day"] }, { banThan: ["thuoc-ruou"] }]) {
    assert.deepEqual(dd({ tuoi: 25, ...nguyCo }), ["DD2"]);
    assert.deepEqual(dd({ tuoi: 60, ...nguyCo }), ["DD2"]);
  }
});

test("không khớp mục nào: nam trẻ không tiền sử", () => {
  assert.deepEqual(ids({ tuoi: 30, gioi: "nam" }), []);
});

test("mỗi mục kèm đúng bài nguồn và tên nhóm", () => {
  const kq = ketQua({ tuoi: 50, gioi: "nu", giaDinh: [], banThan: ["chua-xn-viem-gan"] });
  for (const m of kq.muc) {
    assert.ok(m.bai && m.bai.url.startsWith("/kien-thuc/tam-soat-ung-thu-"), `${m.id} thiếu bài nguồn`);
    assert.ok(m.tenNhom, `${m.id} thiếu tên nhóm`);
    assert.equal(m.chu, CHU[m.id]);
  }
});
