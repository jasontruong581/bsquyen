// Chạy: npm test
import assert from "node:assert/strict";
import { test } from "node:test";

import { tinhGioDang } from "./gio-dang.mjs";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  docThuMucVideo,
  khopReel,
  kiemTraPostReel,
  kiemTraNgayDang,
  laKhoaVideo,
  taoBinhLuan,
  taoCaptionReel,
  thuMucMoiTuDiff,
  timVideo,
  tinhGioDangReel,
} from "./reel-logic.mjs";

const vn = (s) => Date.parse(`${s}+07:00`);
const raVN = (unix) => new Date(unix * 1000 + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ");

const THU_MUC_1 = "V001 - 2026-11-25 - hp-va-da-day";
const THU_MUC_2 = "V002 - 2026-12-02 - ung-thu-vu";

test("thuMucMoiTuDiff: lấy thư mục có dấu cách từ video/<thư mục>/post.json, bỏ dòng khác", () => {
  const out = [
    `video/${THU_MUC_1}/post.json`,
    `video/${THU_MUC_2}/post.json`,
    `video/${THU_MUC_1}/script.json`,
    `video/${THU_MUC_1}/out/post.json`,
    "kien-thuc/bai.md",
    "",
  ].join("\0");
  assert.deepEqual(thuMucMoiTuDiff(out), [THU_MUC_1, THU_MUC_2]);
  assert.deepEqual(thuMucMoiTuDiff(`video/${THU_MUC_1}/post.json\n`), [THU_MUC_1]);
  assert.deepEqual(thuMucMoiTuDiff(""), []);
});

test("laKhoaVideo: nhận slug hoặc id Vnnn, chặn chuỗi lạ", () => {
  for (const k of ["hp-va-da-day", "V001", "V1234"]) assert.equal(laKhoaVideo(k), true, k);
  for (const k of ["", "V1", "V01", "../x", "a b", "V001 - 2026-11-25 - hp", "-x"]) assert.equal(laKhoaVideo(k), false, k);
});

const post1 = { id: "V001", slug: "hp-va-da-day", article: "vi-khuan-hp", caption: "Câu một." };
const post2 = { id: "V002", slug: "ung-thu-vu", article: "ung-thu-vu", caption: "Câu hai." };
const muc = [
  { thuMuc: THU_MUC_1, duongDan: `video/${THU_MUC_1}/post.json`, post: post1 },
  { thuMuc: THU_MUC_2, duongDan: `video/${THU_MUC_2}/post.json`, post: post2 },
  { thuMuc: "hong", duongDan: "video/hong/post.json", loi: "không đọc được JSON" },
];

test("timVideo: tra theo slug hoặc id trong post.json, không theo tên thư mục", () => {
  assert.equal(timVideo(muc, "hp-va-da-day").thuMuc, THU_MUC_1);
  assert.equal(timVideo(muc, "V001").thuMuc, THU_MUC_1);
  assert.equal(timVideo(muc, " V002 ").thuMuc, THU_MUC_2);
  assert.equal(timVideo(muc, "ung-thu-vu").post.id, "V002");
});

test("timVideo: không thấy thì undefined; trùng slug/id ở hai thư mục thì ném lỗi", () => {
  assert.equal(timVideo(muc, "V999"), undefined);
  assert.equal(timVideo(muc, "khong-co"), undefined);
  assert.equal(timVideo([], "V001"), undefined);
  assert.throws(() => timVideo([...muc, { thuMuc: "V001 - ban-sao", post: post1 }], "V001"), /trùng/);
});

test("docThuMucVideo: đọc post.json trong thư mục có dấu cách, báo JSON hỏng, bỏ thư mục không có post.json", () => {
  const goc = mkdtempSync(join(tmpdir(), "reel-test-"));
  try {
    mkdirSync(join(goc, THU_MUC_1));
    writeFileSync(join(goc, THU_MUC_1, "post.json"), JSON.stringify(post1));
    mkdirSync(join(goc, "hong"));
    writeFileSync(join(goc, "hong", "post.json"), "{ khong phai json");
    mkdirSync(join(goc, "out"));
    const kq = docThuMucVideo(goc);
    assert.equal(kq.length, 2);
    assert.equal(timVideo(kq, "V001").thuMuc, THU_MUC_1);
    assert.match(kq.find((m) => m.thuMuc === "hong").loi, /không đọc được JSON/);
    assert.deepEqual(docThuMucVideo(join(goc, "khong-co")), []);
  } finally {
    rmSync(goc, { recursive: true, force: true });
  }
});

test("kiemTraPostReel: hợp lệ thì không có lỗi", () => {
  assert.deepEqual(kiemTraPostReel(post1), []);
});

test("kiemTraPostReel: báo đủ lỗi id sai, slug sai, article sai, caption trống", () => {
  const loi = kiemTraPostReel({ id: "001", slug: "Sai Slug", article: "../x", caption: "  \n " });
  assert.equal(loi.length, 4);
  assert.match(loi[0], /id/);
  assert.match(loi[1], /slug/);
  assert.match(loi[2], /article/);
  assert.match(loi[3], /caption/);
  assert.deepEqual(kiemTraPostReel(null), ["post.json không phải object"]);
});

test("taoCaptionReel: chữ + hashtag, gộp dòng gãy, không có link", () => {
  const r = taoCaptionReel(
    { caption: "Câu một dài\nbị gãy dòng.\n\nĐoạn hai." },
    ["Tầm soát", "Điều trị", "Tầm soát"]
  );
  assert.equal(r.caption, "Câu một dài bị gãy dòng.\n\nĐoạn hai.\n\n#TamSoatUngThu #DieuTriUngThu");
  assert.ok(!r.caption.includes("http"));
  assert.deepEqual(r.tagLa, []);
});

test("taoCaptionReel: tag lạ bị bỏ kèm trong tagLa; không có tag thì không thừa dòng trống", () => {
  const r = taoCaptionReel({ caption: "Chữ." }, ["Tầm soát", "Lạ"]);
  assert.deepEqual(r.tagLa, ["Lạ"]);
  assert.equal(r.caption, "Chữ.\n\n#TamSoatUngThu");
  assert.equal(taoCaptionReel({ caption: "Chữ." }, undefined).caption, "Chữ.");
});

test("taoBinhLuan: link bài có UTM, không nêu tên bác sĩ", () => {
  const bl = taoBinhLuan("vi-khuan-hp", "https://bsquyen.vercel.app");
  assert.equal(bl, "Xem bài viết đầy đủ: https://bsquyen.vercel.app/kien-thuc/vi-khuan-hp/?utm_source=facebook&utm_medium=reel");
});

test("khopReel: ghép Reel với bài qua phần chữ caption, bất kể khoảng trắng", () => {
  const posts = [
    { slug: "a", chu: "Câu một.\n\nCâu hai." },
    { slug: "b", chu: "Chuyện khác hẳn." },
  ];
  assert.equal(khopReel("Câu một. Câu hai.\n\n#TamSoatUngThu", posts)?.slug, "a");
  assert.equal(khopReel("Chuyện khác hẳn.\n\n#DieuTriUngThu", posts)?.slug, "b");
  assert.equal(khopReel("Một Reel cũ không liên quan", posts), undefined);
  assert.equal(khopReel(undefined, posts), undefined);
});

test("giờ hẹn Reel: 19:30 giờ VN cùng ngày, merge sau 19:20 dời sang hôm sau", () => {
  const cfg = { gioCoDinh: "19:30", delayPhut: 120 };
  assert.equal(raVN(tinhGioDang(vn("2026-11-25T10:00:00"), cfg)), "2026-11-25 19:30");
  assert.equal(raVN(tinhGioDang(vn("2026-11-25T19:21:00"), cfg)), "2026-11-26 19:30");
  assert.equal(raVN(tinhGioDang(vn("2026-11-25T10:00:00"), { ...cfg, gioHen: "2026-12-01 19:30" })), "2026-12-01 19:30");
});

const LICH = { gioCoDinh: "19:30", delayPhut: 120 };
const BAY_GIO = vn("2026-11-25T10:00:00");

test("tinhGioDangReel: không có ngay_dang thì dùng quy tắc mặc định", () => {
  for (const v of [undefined, null]) {
    const kq = tinhGioDangReel(BAY_GIO, LICH, v);
    assert.equal(raVN(kq.gio), "2026-11-25 19:30");
    assert.equal(kq.nguon, "mac_dinh");
    assert.deepEqual(kq.canhBao, []);
  }
  // Merge sau 19:20 vẫn dời sang hôm sau như cũ
  assert.equal(raVN(tinhGioDangReel(vn("2026-11-25T19:21:00"), LICH).gio), "2026-11-26 19:30");
});

test("tinhGioDangReel: có ngay_dang thì hẹn 19:30 ngày đó, bất kể ngày merge", () => {
  const kq = tinhGioDangReel(BAY_GIO, LICH, "2026-12-01");
  assert.equal(raVN(kq.gio), "2026-12-01 19:30");
  assert.equal(kq.nguon, "ngay_dang");
  assert.deepEqual(kq.canhBao, []);
  // Ngày merge trùng ngay_dang và còn kịp → vẫn 19:30 hôm đó
  assert.equal(raVN(tinhGioDangReel(BAY_GIO, LICH, "2026-11-25").gio), "2026-11-25 19:30");
  // Theo GIO_DANG của workflow, không cứng 19:30
  assert.equal(raVN(tinhGioDangReel(BAY_GIO, { ...LICH, gioCoDinh: "20:15" }, "2026-12-01").gio), "2026-12-01 20:15");
});

test("tinhGioDangReel: gio_hen của workflow_dispatch thắng ngay_dang", () => {
  const kq = tinhGioDangReel(BAY_GIO, { ...LICH, gioHen: "2026-12-05 21:00" }, "2026-12-01");
  assert.equal(raVN(kq.gio), "2026-12-05 21:00");
  assert.equal(kq.nguon, "gio_hen");
  // gio_hen sai/đã qua vẫn báo lỗi như cũ, không rơi về ngay_dang
  assert.throws(() => tinhGioDangReel(BAY_GIO, { ...LICH, gioHen: "2026-11-24 19:30" }, "2026-12-01"), /GIO_HEN/);
});

test("tinhGioDangReel: ngay_dang sai định dạng hoặc không có thật thì ném lỗi", () => {
  for (const sai of ["1/12/2026", "2026-12-1", "2026-12-01 19:30", "2026-13-01", "2026-02-30", "", 20261201, "hôm nay"]) {
    assert.throws(() => tinhGioDangReel(BAY_GIO, LICH, sai), /ngay_dang/, `phải lỗi với ${JSON.stringify(sai)}`);
  }
});

test("tinhGioDangReel: ngày đã qua hoặc 19:30 còn dưới 10 phút thì dùng quy tắc mặc định kèm cảnh báo", () => {
  const qua = tinhGioDangReel(BAY_GIO, LICH, "2026-11-20");
  assert.equal(raVN(qua.gio), "2026-11-25 19:30");
  assert.equal(qua.nguon, "mac_dinh");
  assert.equal(qua.canhBao.length, 1);
  assert.match(qua.canhBao[0], /2026-11-20.*đã qua/);

  // 19:25 cùng ngày: còn 5 phút → dời như quy tắc cũ (hôm sau)
  const sat = tinhGioDangReel(vn("2026-11-25T19:25:00"), LICH, "2026-11-25");
  assert.equal(raVN(sat.gio), "2026-11-26 19:30");
  assert.equal(sat.nguon, "mac_dinh");
  assert.equal(sat.canhBao.length, 1);
});

test("tinhGioDangReel: ngày quá xa giới hạn hẹn giờ của Facebook thì ném lỗi", () => {
  // 25/11 10:00 + 28 ngày = 23/12 10:00 → 19:30 ngày 22/12 còn trong hạn, 19:30 ngày 23/12 thì quá
  assert.equal(raVN(tinhGioDangReel(BAY_GIO, LICH, "2026-12-22").gio), "2026-12-22 19:30");
  assert.throws(() => tinhGioDangReel(BAY_GIO, LICH, "2026-12-23"), /xa quá 28 ngày/);
  assert.throws(() => tinhGioDangReel(BAY_GIO, LICH, "2027-06-01"), /xa quá 28 ngày/);
});

test("tinhGioDangReel: GIO_DANG trống hoặc sai thì báo lỗi rõ khi có ngay_dang", () => {
  assert.throws(() => tinhGioDangReel(BAY_GIO, { gioCoDinh: "", delayPhut: 120 }, "2026-12-01"), /GIO_DANG/);
  assert.throws(() => tinhGioDangReel(BAY_GIO, { gioCoDinh: "25:99", delayPhut: 120 }, "2026-12-01"), /GIO_DANG/);
});

test("kiemTraNgayDang và kiemTraPostReel: ngay_dang tùy chọn, có thì phải đúng dạng", () => {
  assert.equal(kiemTraNgayDang(undefined), null);
  assert.equal(kiemTraNgayDang("2026-12-01"), null);
  assert.match(kiemTraNgayDang("2026-02-30"), /không phải ngày có thật/);
  const post = { id: "V001", slug: "hp", article: "bai", caption: "Câu." };
  assert.deepEqual(kiemTraPostReel(post), []);
  assert.deepEqual(kiemTraPostReel({ ...post, ngay_dang: "2026-12-01" }), []);
  assert.equal(kiemTraPostReel({ ...post, ngay_dang: "01/12/2026" }).length, 1);
});
