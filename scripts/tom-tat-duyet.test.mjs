// Chạy: npm test
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

import matter from "gray-matter";

import { gonCaption, taoCaption } from "./caption-facebook.mjs";
import { cauMo, doSlug, kiemTraBai, kiemTraLink, taoMarkdown, timMau, DAU_HIEU } from "./tom-tat-duyet.mjs";

const CAPTION_CHUAN =
  "Nhiều người nghĩ tầm soát chỉ dành cho người có triệu chứng. Thực ra tầm soát có ý nghĩa nhất " +
  "khi cơ thể còn khoẻ, vì lúc đó phát hiện sớm giúp việc điều trị nhẹ nhàng hơn nhiều. Bài viết " +
  "giải thích ai nên bắt đầu, bắt đầu từ tuổi nào, và bao lâu làm lại một lần theo các hướng dẫn " +
  "quốc tế hiện hành. Nếu bạn đang phân vân, hãy mang theo tiền sử gia đình khi đi khám để bác sĩ " +
  "tư vấn đúng mức nguy cơ của mình. Đọc chậm, hỏi kỹ, và đừng ngại hỏi lại những gì chưa rõ nhé.";

const DATA_CHUAN = {
  title: "Tầm soát: ai nên làm?",
  description: "Mô tả",
  date: new Date("2026-09-28"),
  tags: ["Tầm soát"],
  thumb: "/assets/kien-thuc/x-1.svg",
  image: "/assets/kien-thuc/x-og.png",
  facebook: CAPTION_CHUAN,
};
const coHet = () => true;
const muc = (kq) => kq.canhBao.map((c) => c.muc).join(" | ");

test("caption: gộp dòng gãy, giữ ngắt đoạn, nối link có UTM và hashtag", () => {
  assert.equal(gonCaption("dòng một\ncòn tiếp\n\nđoạn hai"), "dòng một còn tiếp\n\nđoạn hai");
  const c = taoCaption({ facebook: "A\nB", tags: ["Tầm soát", "Tag lạ"] }, "bai", "https://x.vn");
  assert.equal(c.caption, "A B\n\nhttps://x.vn/kien-thuc/bai/?utm_source=facebook\n\n#TamSoatUngThu");
  assert.deepEqual(c.tagLa, ["Tag lạ"]);
});

test("bài chuẩn: không lỗi, không cảnh báo", () => {
  const kq = kiemTraBai({ data: DATA_CHUAN, noiDung: "Nội dung bình thường.", slug: "x", coFile: coHet });
  assert.deepEqual(kq.loi, []);
  assert.deepEqual(kq.canhBao, []);
});

test("thiếu field, tag lạ, thiếu file ảnh → lỗi", () => {
  const { facebook, ...thieu } = DATA_CHUAN;
  const kq = kiemTraBai({
    data: { ...thieu, tags: ["Ung thư"] },
    noiDung: "",
    slug: "x",
    coFile: (p) => !p.endsWith("-fb.png"),
  });
  const s = kq.loi.join(" | ");
  assert.match(s, /Thiếu `facebook`/);
  assert.match(s, /Tag lạ "Ung thư"/);
  assert.match(s, /ảnh Facebook/);
});

test("YMYL: bắt lời hứa kết quả, lời chứng thực, giật tít trong thân bài", () => {
  const kq = kiemTraBai({
    data: DATA_CHUAN,
    noiDung: "Phương pháp này chữa khỏi 100% bệnh. Bệnh nhân của tôi đã khỏi bệnh. Dấu hiệu chết người.",
    slug: "x",
    coFile: coHet,
  });
  const s = muc(kq);
  assert.match(s, /Hứa hẹn kết quả/);
  assert.match(s, /lời chứng thực/);
  assert.match(s, /Giật tít/);
  assert.ok(kq.canhBao.every((c) => c.noi === "thân bài"));
  assert.ok(kq.canhBao[0].cau.includes("chữa khỏi"), "phải trích câu để bác sĩ đọc");
});

test("caption: tên bác sĩ, số điện thoại, link, hashtag, độ dài → cảnh báo", () => {
  const xau = "Gọi BS.CKI Hạnh Quyên 0776 196 601 hoặc xem https://a.vn #TamSoat";
  const kq = kiemTraBai({ data: { ...DATA_CHUAN, facebook: xau }, noiDung: "", slug: "x", coFile: coHet });
  const s = muc(kq);
  assert.match(s, /tên bác sĩ/);
  assert.match(s, /số điện thoại/);
  assert.match(s, /có link/);
  assert.match(s, /có hashtag/);
  assert.match(s, /Caption dài \d+ ký tự/);
});

test("chữ 'bác sĩ' theo nghĩa chung không bị coi là nêu tên", () => {
  const cap = CAPTION_CHUAN.replace("Đọc chậm", "Hỏi thẳng bác sĩ điều trị, đọc chậm");
  const kq = kiemTraBai({ data: { ...DATA_CHUAN, facebook: cap }, noiDung: "", slug: "x", coFile: coHet });
  assert.doesNotMatch(muc(kq), /tên bác sĩ/);
});

test("câu mở: tính cả ngoặc kép đóng sau dấu hỏi", () => {
  assert.equal(cauMo('"Có thật hả bác sĩ?" — Có, và nhiều thứ nữa.'), '"Có thật hả bác sĩ?"');
  assert.equal(cauMo("Câu một. Câu hai."), "Câu một.");
  assert.equal(cauMo("Không có dấu câu"), "Không có dấu câu");
});

test("timMau trích đoạn quanh chỗ khớp", () => {
  const [kq] = timMau("a".repeat(80) + " chữa khỏi " + "b".repeat(80), [["x", /chữa khỏi/i]]);
  assert.ok(kq.cau.startsWith("…") && kq.cau.endsWith("…") && kq.cau.includes("chữa khỏi"));
});

test("doSlug: từ file .md và từ ảnh, bỏ file không phải bài", () => {
  const co = (s) => ["tam-soat-ung-thu-vu", "vac-xin-phong-ung-thu"].includes(s);
  assert.deepEqual(
    doSlug(
      [
        "kien-thuc/tam-soat-ung-thu-vu.md",
        "assets/kien-thuc/vac-xin-phong-ung-thu-fb.png",
        "kien-thuc/index.njk",
        "kien-thuc/tim-kiem.json.njk",
        "css/kien-thuc.css",
      ],
      co
    ),
    ["tam-soat-ung-thu-vu", "vac-xin-phong-ung-thu"]
  );
});

test("kiemTraLink phân loại: sống / chuyển / chặn / chết / SSL", async () => {
  const gia = (res) => async () => res;
  assert.equal((await kiemTraLink("https://a", { fetchFn: gia({ ok: true, status: 200, url: "https://a" }) })).trangThai, "song");
  assert.equal((await kiemTraLink("https://a", { fetchFn: gia({ ok: true, status: 200, url: "https://b" }) })).trangThai, "chuyen");
  assert.equal((await kiemTraLink("https://a", { fetchFn: gia({ ok: false, status: 403 }) })).trangThai, "chan");
  assert.equal((await kiemTraLink("https://a", { fetchFn: gia({ ok: false, status: 404 }) })).trangThai, "chet");
  const loiSsl = async () => {
    throw Object.assign(new TypeError("fetch failed"), { cause: { code: "ERR_SSL_DH_KEY_TOO_SMALL" } });
  };
  assert.equal((await kiemTraLink("https://a", { fetchFn: loiSsl })).trangThai, "ssl");
});

test("markdown: có dấu hiệu để workflow tìm lại comment, bài đã xuất bản không hiện caption", () => {
  const b = { slug: "x", data: DATA_CHUAN, links: [], phutDoc: 3, kiemTra: { loi: [], canhBao: [] } };
  const md = taoMarkdown({ bai: [{ ...b, daXuatBan: false }], sha: "a".repeat(40), repo: "o/r" });
  assert.ok(md.startsWith(DAU_HIEU));
  assert.match(md, /Bài đăng Facebook/);
  const cu = taoMarkdown({ bai: [{ ...b, daXuatBan: true }], sha: "a".repeat(40), repo: "o/r" });
  assert.doesNotMatch(cu, /Bài đăng Facebook/);
  assert.match(cu, /đã xuất bản/);
});

test("mọi bài đã xuất bản: không có LỖI (bài cũ trước khi có caption thì chỉ thiếu facebook)", () => {
  for (const f of readdirSync("kien-thuc").filter((f) => f.endsWith(".md"))) {
    const slug = f.replace(/\.md$/, "");
    const { data, content } = matter(readFileSync(`kien-thuc/${f}`, "utf8"));
    const { loi } = kiemTraBai({ data, noiDung: content, slug, coFile: existsSync });
    const conLai = loi.filter((l) => !/Thiếu `facebook`|ảnh Facebook/.test(l));
    assert.deepEqual(conLai, [], `${slug}: ${conLai.join("; ")}`);
  }
});
