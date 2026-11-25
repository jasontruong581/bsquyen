// Chạy: npm test
import assert from "node:assert/strict";
import { test } from "node:test";

import { tinhGioDang } from "./gio-dang.mjs";
import { khopReel, kiemTraPostReel, slugMoiTuDiff, taoBinhLuan, taoCaptionReel } from "./reel-logic.mjs";

const vn = (s) => Date.parse(`${s}+07:00`);
const raVN = (unix) => new Date(unix * 1000 + 7 * 3600e3).toISOString().slice(0, 16).replace("T", " ");

test("slugMoiTuDiff: lấy slug từ video/<slug>/post.json, bỏ dòng khác", () => {
  const out = [
    "video/hp-va-da-day/post.json",
    "video/ung-thu-vu/post.json",
    "video/hp-va-da-day/script.json",
    "video/a/b/post.json",
    "kien-thuc/bai.md",
    "",
  ].join("\n");
  assert.deepEqual(slugMoiTuDiff(out), ["hp-va-da-day", "ung-thu-vu"]);
  assert.deepEqual(slugMoiTuDiff(""), []);
});

test("kiemTraPostReel: hợp lệ thì không có lỗi", () => {
  const post = { slug: "hp", article: "vi-khuan-hp", caption: "Một câu." };
  assert.deepEqual(kiemTraPostReel(post, "hp"), []);
});

test("kiemTraPostReel: báo đủ lỗi slug lệch, article sai, caption trống", () => {
  const loi = kiemTraPostReel({ slug: "khac", article: "../x", caption: "  \n " }, "hp");
  assert.equal(loi.length, 3);
  assert.match(loi[0], /không khớp/);
  assert.match(loi[1], /article/);
  assert.match(loi[2], /caption/);
  assert.deepEqual(kiemTraPostReel(null, "hp"), ["post.json không phải object"]);
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
