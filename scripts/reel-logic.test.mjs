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
  laKhoaVideo,
  taoBinhLuan,
  taoCaptionReel,
  thuMucMoiTuDiff,
  timVideo,
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
