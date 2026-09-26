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
  sources: [{ title: "WHO", url: "https://www.who.int/" }],
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

test("nhiều mẫu cùng nhóm trong một câu: gộp thành một cảnh báo, kèm số chỗ", () => {
  const kq = kiemTraBai({
    data: { ...DATA_CHUAN, facebook: CAPTION_CHUAN + " Liên hệ BS.CKI Hạnh Quyên." },
    noiDung: "Phương pháp này chữa khỏi 100% bệnh.",
    slug: "x",
    coFile: coHet,
  });
  const hua = kq.canhBao.filter((c) => c.muc.startsWith("Hứa hẹn"));
  assert.equal(hua.length, 1);
  assert.equal(hua[0].soCho, 2);
  assert.equal(kq.canhBao.filter((c) => /tên bác sĩ/.test(c.muc)).length, 1);
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
  // fetch tự thêm "/" cuối host — không được tính là chuyển hướng
  assert.equal((await kiemTraLink("https://a", { fetchFn: gia({ ok: true, status: 200, url: "https://a/", redirected: false }) })).trangThai, "song");
  assert.equal((await kiemTraLink("https://a", { fetchFn: gia({ ok: true, status: 200, url: "https://b", redirected: true }) })).trangThai, "chuyen");
  assert.equal((await kiemTraLink("https://a", { fetchFn: gia({ ok: false, status: 403 }) })).trangThai, "chan");
  assert.equal((await kiemTraLink("https://a", { fetchFn: gia({ ok: false, status: 404 }) })).trangThai, "chet");
  const loiSsl = async () => {
    throw Object.assign(new TypeError("fetch failed"), { cause: { code: "ERR_SSL_DH_KEY_TOO_SMALL" } });
  };
  assert.equal((await kiemTraLink("https://a", { fetchFn: loiSsl })).trangThai, "ssl");
});

test("markdown: có dấu hiệu để workflow tìm lại comment, bài đã xuất bản không hiện caption", () => {
  const b = { slug: "x", data: DATA_CHUAN, links: [], phutDoc: 3, kiemTra: { loi: [], canhBao: [] } };
  const md = taoMarkdown({ bai: [{ ...b, daXuatBan: false }], sha: "a".repeat(40), repo: "o/r", gioDang: "x" });
  assert.ok(md.startsWith(DAU_HIEU));
  assert.match(md, /Bài đăng Facebook/);
  const cu = taoMarkdown({ bai: [{ ...b, daXuatBan: true }], sha: "a".repeat(40), repo: "o/r", gioDang: "x" });
  assert.doesNotMatch(cu, /Bài đăng Facebook/);
  assert.match(cu, /đã xuất bản/);
});

test("bài đã duyệt: không lỗi nào, và số cảnh báo khoá ở mức đã biết (chặn regex bị nới quá rộng)", () => {
  const canhBao = [];
  for (const f of readdirSync("kien-thuc").filter((f) => f.endsWith(".md"))) {
    const slug = f.replace(/\.md$/, "");
    const { data, content } = matter(readFileSync(`kien-thuc/${f}`, "utf8"));
    // Mọi bài ở đây đều đã xuất bản — bot sẽ kiểm chúng với daXuatBan = true
    const kq = kiemTraBai({ data, noiDung: content, slug, coFile: existsSync, daXuatBan: true });
    assert.deepEqual(kq.loi, [], `${slug}: ${kq.loi.join("; ")}`);
    canhBao.push(...kq.canhBao.map((c) => `${slug}: ${c.muc} — ${c.cau || ""}`));
  }
  // Cảnh báo duy nhất đã biết: "Điều trị dứt điểm vi khuẩn HP" (thuật ngữ hợp lệ, bắt rộng
  // có chủ đích). Thêm/nới mẫu mà con số này tăng thì mẫu đang bắt nhầm bài đã duyệt.
  assert.equal(canhBao.length, 1, canhBao.join("\n"));
  assert.match(canhBao[0], /tam-soat-ung-thu-da-day: Hứa hẹn/);
});

test("bài đã xuất bản: bỏ qua caption và ảnh Facebook (bài cũ không có, và không đăng lại)", () => {
  const { facebook, ...cu } = DATA_CHUAN;
  const kq = kiemTraBai({ data: cu, noiDung: "", slug: "x", coFile: (p) => !p.endsWith("-fb.png"), daXuatBan: true });
  assert.deepEqual(kq.loi, []);
  const moi = kiemTraBai({ data: cu, noiDung: "", slug: "x", coFile: (p) => !p.endsWith("-fb.png"), daXuatBan: false });
  assert.equal(moi.loi.length, 2); // thiếu facebook + thiếu ảnh Facebook
});

test("quét cả tiêu đề và mô tả, không chỉ thân bài", () => {
  const kq = kiemTraBai({
    data: { ...DATA_CHUAN, title: "Thần dược chữa khỏi ung thư", description: "Giảm giá 50%" },
    noiDung: "",
    slug: "x",
    coFile: coHet,
  });
  assert.ok(kq.canhBao.some((c) => c.noi === "tiêu đề" && /Hứa hẹn/.test(c.muc)));
  assert.ok(kq.canhBao.some((c) => c.noi === "mô tả" && /giá tiền/.test(c.muc)));
});

test("tên bác sĩ trong caption: bắt các cách viết hay gặp, không bắt 'quyên góp'", () => {
  const coTen = (cap) =>
    kiemTraBai({ data: { ...DATA_CHUAN, facebook: CAPTION_CHUAN + " " + cap }, noiDung: "", slug: "x", coFile: coHet })
      .canhBao.some((c) => /tên bác sĩ/.test(c.muc));
  for (const cap of ["BS Quyên", "Bs. Quyên", "BS.CK1", "BS.CK I Hạnh Quyên", "Hanh Quyen", "bác sĩ Quyên", "bsquyen"]) {
    assert.ok(coTen(cap), `phải bắt: ${cap}`);
  }
  assert.ok(!coTen("Kêu gọi quyên góp cho bệnh nhân nghèo."), "không được bắt 'quyên góp'");
});

test("số điện thoại / địa chỉ trong caption: nhiều cách viết", () => {
  const coSo = (cap) =>
    kiemTraBai({ data: { ...DATA_CHUAN, facebook: CAPTION_CHUAN + " " + cap }, noiDung: "", slug: "x", coFile: coHet })
      .canhBao.some((c) => /số điện thoại/.test(c.muc));
  for (const cap of ["0776196601", "0776 196 601", "0776-196-601", "+84 776 196 601", "84776196601", "Bùi Hữu Nghĩa"]) {
    assert.ok(coSo(cap), `phải bắt: ${cap}`);
  }
  assert.ok(!coSo("Năm 2024 có khoảng 24.000 ca."), "số liệu thống kê không phải số điện thoại");
});

test("liều thuốc và giá tiền: bắt, nhưng số liệu thống kê thì không", () => {
  const muc = (noiDung) => kiemTraBai({ data: DATA_CHUAN, noiDung, slug: "x", coFile: coHet }).canhBao.map((c) => c.muc).join(" | ");
  assert.match(muc("Uống morphin 10 mg mỗi 4 giờ."), /liều thuốc/);
  assert.match(muc("Gói tầm soát chỉ 1.500.000 đồng."), /giá tiền/);
  assert.match(muc("Chỉ 2 triệu đồng."), /giá tiền/);
  assert.match(muc("Đang có khuyến mãi."), /giá tiền/);
  assert.doesNotMatch(muc("Mỗi năm có hơn 1 triệu ca mắc mới và 24 nghìn ca tử vong."), /giá tiền/);
  assert.doesNotMatch(muc("Chi phí thấp, giá trị lớn, được đánh giá cao."), /giá tiền/);
});

test("comment: ảnh không tồn tại hiện '—' thay vì ảnh vỡ; dòng 'Xem thêm' là 125 ký tự đầu", () => {
  const b = { slug: "x", data: DATA_CHUAN, links: [], phutDoc: 3, kiemTra: { loi: [], canhBao: [] }, daXuatBan: false };
  const md = taoMarkdown({ bai: [b], sha: "a".repeat(40), repo: "o/r", gioDang: "hẹn 19:30", coFile: (p) => !p.endsWith("-fb.png") });
  assert.match(md, /\| — \| <img src="[^"]+x-og\.png"/);
  const dongXemThem = md.split("\n").find((l) => l.includes('trước "Xem thêm"'));
  assert.ok(dongXemThem.includes(CAPTION_CHUAN.slice(0, 125)), "phải hiện 125 ký tự đầu, không chỉ câu đầu");
});

test("PR đụng hàng loạt bài: chỉ trình bày đầy đủ 8 bài, còn lại gom thành danh sách", () => {
  const b = (i) => ({ slug: `bai-${i}`, data: DATA_CHUAN, links: [], phutDoc: 3, kiemTra: { loi: [], canhBao: [] }, daXuatBan: true });
  const md = taoMarkdown({ bai: Array.from({ length: 30 }, (_, i) => b(i)), sha: "a".repeat(40), repo: "o/r", gioDang: "x", coFile: coHet });
  assert.equal((md.match(/^### Tầm soát/gm) || []).length, 8);
  assert.match(md, /### 22 bài khác trong PR này/);
  assert.ok(md.length < 65536, `comment dài ${md.length}, vượt giới hạn GitHub`);
});

test("frontmatter lỗi: báo trong comment thay vì làm job chết", () => {
  const md = taoMarkdown({ bai: [{ slug: "hong", data: {}, links: [], phutDoc: 0, loiDoc: "bad indentation" }], sha: "a".repeat(40), repo: "o/r", gioDang: "x" });
  assert.match(md, /Không đọc được frontmatter:\*\* bad indentation/);
});
