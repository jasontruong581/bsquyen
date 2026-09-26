#!/usr/bin/env node
// Tóm tắt duyệt bài Kiến thức cho PR — in ra Markdown để workflow đăng thành một comment.
//
//   node scripts/tom-tat-duyet.mjs --files=kien-thuc/a.md,kien-thuc/b.md   # chạy tay
//   node scripts/tom-tat-duyet.mjs --khong-kiem-link                        # bỏ gọi mạng
//
// Trong GitHub Actions: đọc PR_BASE / PR_HEAD / REPO từ env, tự dò bài bị đổi.
//
// Gom về một chỗ đúng những thứ bác sĩ cần duyệt mà không phải lục từng file: caption
// Facebook y như sẽ đăng, các ảnh, tình trạng link nguồn, và câu dễ vướng quy định quảng
// cáo y tế. Mọi cảnh báo chỉ để GỢI Ý — không chặn merge, bác sĩ là người quyết.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import matter from "gray-matter";

import { SITE_URL, taoCaption } from "./caption-facebook.mjs";

const require = createRequire(import.meta.url);
const CHU_DE = require("../_data/chuDe.js");

export const DAU_HIEU = "<!-- tom-tat-duyet -->";
const DO_DAI_CAPTION = [400, 700];
const DO_DAI_XEM_THEM = 125; // Facebook cắt caption ở khoảng này rồi mới hiện "Xem thêm"
// Comment GitHub tối đa 65 536 ký tự. PR đụng hàng loạt bài (vd tạo lại mọi ảnh OG) thì
// chỉ trình bày đầy đủ bấy nhiêu bài, còn lại gom thành danh sách ngắn.
const TOI_DA_BAI_DAY_DU = 8;

// Mỗi nhóm: [tên hiển thị, regex]. Cố ý bắt rộng — báo nhầm vài câu hợp lệ còn hơn sót
// một lời hứa hẹn điều trị. Bác sĩ đọc câu được trích và tự quyết.
// Không bắt "giá" hay "chi phí" trơn: dính "giá trị", "đánh giá", "chi phí thấp" hợp lệ.
const MAU_NOI_DUNG = [
  ["Hứa hẹn kết quả điều trị", /chữa khỏi|khỏi hẳn|khỏi hoàn toàn|dứt điểm|chắc chắn khỏi|đảm bảo (khỏi|chữa)|cam kết (khỏi|chữa)|thần dược|100\s?%/i],
  ["Có thể là lời chứng thực của người bệnh", /(bệnh nhân|người bệnh) của (tôi|chúng tôi)|nhờ (bác sĩ|phòng khám)[^.]{0,40}(khỏi|đỡ)|đã khỏi bệnh/i],
  ["Giật tít, dễ gây hoang mang", /chết người|ai cũng mắc|báo động đỏ|cực kỳ nguy hiểm|gây sốc|kẻ giết người/i],
  ["Có liều thuốc (skill không cho ghi liều)", /\d+([.,]\d+)?\s?(mg|mcg|µg|ml)\b/i],
  // "triệu"/"nghìn" chỉ tính khi đi kèm đơn vị tiền — "hơn 1 triệu ca mắc mới" là số liệu
  ["Có giá tiền / khuyến mãi (quy định quảng cáo y tế)", /\d[\d.,]*\s?((nghìn|ngàn|triệu)\s?)?(đ|đồng|vnđ|vnd)(?!\p{L})|giá (khám|dịch vụ|gói)|khuyến mãi|giảm giá|ưu đãi/iu],
];
const MAU_CAPTION = [
  // Không bắt "quyên" trơn: dính "quyên góp".
  ["Caption nêu tên bác sĩ (page mang thương hiệu riêng)", /hạnh quyên|hanh quyen|(bs|bác sĩ|b\.s)\.?\s*(ck\s?(i|1)\.?\s*)?quyên|bs\.?\s?ck\s?(i|1)\b|bsquyen/i],
  ["Caption có số điện thoại / Zalo / địa chỉ (trang bài đã có)", /(?<!\d)(\+?84|0)[\s.-]?\d{2,3}[\s.-]?\d{3}[\s.-]?\d{3,4}(?!\d)|zalo\.me|297a|bùi hữu nghĩa/i],
  ["Caption có link (script tự nối link bài)", /https?:\/\//i],
  ["Caption có hashtag (script tự nối từ tags)", /(^|\s)#[^\s#]/],
];

// Giờ đăng lấy từ chính workflow đăng, để comment không nói sai khi ai đó đổi GIO_DANG.
function moTaGioDang() {
  try {
    const yml = readFileSync(".github/workflows/dang-facebook.yml", "utf8");
    const gio = /GIO_DANG:\s*"([^"]*)"/.exec(yml)?.[1];
    if (gio) return `hẹn ${gio} (giờ VN) ngày merge; merge sát giờ đó (dưới 10 phút) thì sang hôm sau`;
    const phut = /DELAY_PHUT:\s*"?(\d+)/.exec(yml)?.[1];
    if (phut) return `hẹn ${phut} phút sau khi merge`;
  } catch { /* không đọc được workflow thì nói chung chung */ }
  return "hẹn giờ theo cấu hình job đăng Facebook";
}

/**
 * Mỗi nhóm khớp trả về MỘT mục {muc, cau, soCho}: cau là đoạn trích quanh chỗ khớp đầu
 * tiên. Gộp theo nhóm vì các mẫu trong nhóm hay cùng nằm một câu ("chữa khỏi 100%",
 * "BS.CKI Hạnh Quyên") — liệt kê từng chỗ thì comment toàn dòng trùng nhau.
 */
export function timMau(van, mau) {
  const ketQua = [];
  // NFC: bộ gõ "Unicode tổ hợp" gửi dấu rời, regex có dấu sẽ không khớp nếu không chuẩn hoá
  van = String(van).normalize("NFC");
  for (const [muc, re] of mau) {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    const khop = [...van.matchAll(g)];
    if (!khop.length) continue;
    const m = khop[0];
    const dau = Math.max(0, m.index - 50);
    const cuoi = Math.min(van.length, m.index + m[0].length + 50);
    const cau = van.slice(dau, cuoi).replace(/\s+/g, " ").trim();
    ketQua.push({ muc, soCho: khop.length, cau: `${dau > 0 ? "…" : ""}${cau}${cuoi < van.length ? "…" : ""}` });
  }
  return ketQua;
}

/**
 * Câu mở của caption = tới dấu kết câu đầu tiên trong ĐOẠN đầu, tính cả ngoặc đóng ngay
 * sau nó — caption hay mở bằng câu bệnh nhân hỏi trong ngoặc kép: "…thật hả bác sĩ?" — Có…
 */
export function cauMo(chu) {
  const doanDau = chu.trim().split(/\n{2,}/)[0];
  const m = /^[\s\S]*?[.?!…]["”’»)]*(?=\s|$)/.exec(doanDau);
  return (m ? m[0] : doanDau).trim();
}

/** Thời gian đọc — cùng cách tính với filter thoiGianDoc của site (bỏ thẻ HTML, ~250 tiếng/phút). */
export function phutDoc(noiDung) {
  const soTieng = String(noiDung).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(soTieng / 250));
}

/**
 * Kiểm tra một bài. Không đọc đĩa hay gọi mạng — nhận sẵn dữ liệu, trả về lỗi (thiếu thứ
 * bắt buộc) và cảnh báo (nên xem lại). `coFile(path)` cho biết file ảnh có tồn tại không.
 * Bài đã xuất bản thì bỏ qua mọi thứ về Facebook: sửa bài không đăng lại lên page, và các
 * bài xuất bản trước khi có job Facebook vốn không có caption hay ảnh Facebook.
 */
export function kiemTraBai({ data, noiDung, slug, coFile, daXuatBan = false }) {
  const loi = [];
  const canhBao = [];

  const batBuoc = ["title", "description", "date", "tags", "thumb", "image"];
  if (!daXuatBan) batBuoc.push("facebook");
  for (const f of batBuoc) {
    if (!data[f] || (Array.isArray(data[f]) && !data[f].length)) loi.push(`Thiếu \`${f}\` trong frontmatter`);
  }
  for (const t of data.tags || []) {
    if (!CHU_DE.includes(t)) loi.push(`Tag lạ "${t}" — chỉ dùng 6 tag cố định: ${CHU_DE.join(", ")}`);
  }
  const anh = [
    ["thumb", data.thumb],
    ["image (ảnh OG)", data.image],
  ];
  if (!daXuatBan) anh.push(["ảnh Facebook", `/assets/kien-thuc/${slug}-fb.png`]);
  for (const [ten, duong] of anh) {
    if (duong && !coFile(duong.replace(/^\//, ""))) loi.push(`Không thấy file ${ten}: \`${duong}\``);
  }
  if (!(data.sources || []).length) {
    canhBao.push({ muc: "Chưa có nguồn tham khảo (skill yêu cầu 2–4 nguồn uy tín)", noi: "frontmatter" });
  }

  // Tiêu đề và mô tả là chữ người đọc thấy nhiều nhất: kết quả Google, thẻ share, card danh sách
  for (const [noi, van] of [
    ["tiêu đề", data.title],
    ["mô tả", data.description],
    ["thân bài", noiDung],
  ]) {
    if (van) canhBao.push(...timMau(van, MAU_NOI_DUNG).map((x) => ({ ...x, noi })));
  }

  if (data.facebook && !daXuatBan) {
    const { chu } = taoCaption(data, slug, SITE_URL);
    canhBao.push(...timMau(chu, [...MAU_NOI_DUNG, ...MAU_CAPTION]).map((x) => ({ ...x, noi: "caption" })));
    if (chu.length < DO_DAI_CAPTION[0] || chu.length > DO_DAI_CAPTION[1]) {
      canhBao.push({ muc: `Caption dài ${chu.length} ký tự (nên ${DO_DAI_CAPTION.join("–")})`, noi: "caption" });
    }
    const mo = cauMo(chu);
    if (mo.length > DO_DAI_XEM_THEM) {
      canhBao.push({
        muc: `Câu mở dài ${mo.length} ký tự — Facebook cắt ở ~${DO_DAI_XEM_THEM}, người đọc không thấy hết câu trước "Xem thêm"`,
        noi: "caption",
      });
    }
  }
  return { loi, canhBao };
}

/** Kiểm tra link nguồn. Nhiều trang y tế chặn bot (403) — tách riêng khỏi "link chết". */
export async function kiemTraLink(url, { fetchFn = fetch, giay = 12 } = {}) {
  try {
    const res = await fetchFn(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(giay * 1000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; bsquyen-kiem-tra-nguon)" },
    });
    // Chỉ cần mã trạng thái — huỷ phần thân để không tải hết cả file PDF về
    if (res.body && res.body.cancel) res.body.cancel().catch(() => {});
    if ([401, 403, 429].includes(res.status)) return { trangThai: "chan", ma: res.status };
    if (!res.ok) return { trangThai: "chet", ma: res.status };
    // res.redirected, không so res.url với url: fetch tự thêm "/" cuối host và bỏ #fragment,
    // so chuỗi thì link bình thường cũng bị báo là chuyển hướng
    return res.redirected ? { trangThai: "chuyen", ma: res.status, dich: res.url } : { trangThai: "song", ma: res.status };
  } catch (e) {
    // Lỗi SSL/chứng chỉ phía trang (vd moh.gov.vn dùng khoá DH quá yếu): OpenSSL của Node
    // từ chối, trình duyệt có thể vẫn mở được — không kết luận là link chết.
    const ma = (e.cause && e.cause.code) || "";
    if (/SSL|TLS|CERT|UNABLE_TO_VERIFY|DEPTH_ZERO/.test(ma)) return { trangThai: "ssl", ma };
    return { trangThai: "chet", ma: e.name === "TimeoutError" ? "hết giờ" : "không kết nối được" };
  }
}

const HIEN_LINK = {
  song: () => "✓ còn sống",
  chuyen: (k) => `↪ chuyển tới <${k.dich}>`,
  chan: (k) => `⚠ trang chặn kiểm tra tự động (${k.ma}) — mở tay xem`,
  ssl: (k) => `⚠ không kiểm được tự động (lỗi SSL/chứng chỉ phía trang: ${k.ma}) — mở tay xem`,
  chet: (k) => `✗ **lỗi (${k.ma})**`,
};

const escBang = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");

function phanBai(b, { raw, gioDang, coFile }) {
  const { data, slug, kiemTra, links, daXuatBan } = b;
  const dong = ["", "---", "", `### ${data.title || slug}`, ""];
  dong.push(`\`${slug}\` · Chủ đề: ${(data.tags || []).join(", ") || "—"} · CTA: ${data.cta || "mặc định"} · ~${b.phutDoc} phút đọc`);
  if (b.loiDoc) {
    dong.push("", `- ✗ **Không đọc được frontmatter:** ${b.loiDoc}`);
    return dong;
  }
  if (daXuatBan) dong.push("", "> ℹ️ Bài **đã xuất bản** — sửa bài không đăng lại lên Facebook.");

  dong.push("", "#### Cần xem lại");
  if (!kiemTra.loi.length && !kiemTra.canhBao.length) {
    dong.push("", "✓ Không thấy gì đáng lưu ý.");
  } else {
    dong.push("");
    kiemTra.loi.forEach((l) => dong.push(`- ✗ ${l}`));
    kiemTra.canhBao.forEach((c) => {
      const them = c.soCho > 1 ? `, ${c.soCho} chỗ — trích chỗ đầu` : "";
      dong.push(`- ⚠ **${c.muc}** _(${c.noi}${them})_${c.cau ? `\n  > ${c.cau}` : ""}`);
    });
  }

  if (data.facebook && !daXuatBan) {
    const { chu, caption } = taoCaption(data, slug, SITE_URL);
    dong.push(
      "",
      "#### Bài đăng Facebook",
      "",
      `Đúng từng chữ như sẽ lên page — ${gioDang}.`,
      "",
      // Người đọc thấy ~125 ký tự đầu của caption, không phải "câu đầu"
      `**Người đọc thấy trước "Xem thêm":** ${chu.slice(0, DO_DAI_XEM_THEM).replace(/\s+/g, " ")}${chu.length > DO_DAI_XEM_THEM ? "…" : ""}`,
      "",
      `<details><summary>Caption đầy đủ (${caption.length} ký tự)</summary>`,
      "",
      "````text", // 4 dấu: caption lỡ chứa ``` cũng không phá khung
      caption,
      "````",
      "",
      "</details>"
    );
  }

  dong.push("", "#### Ảnh", "", "| Facebook | Share link (OG) | Thumbnail |", "|---|---|---|");
  const anh = (p) => (p && coFile(p.replace(/^\//, "")) ? `<img src="${raw(p)}" width="220">` : "—");
  const anhFb = daXuatBan ? null : `assets/kien-thuc/${slug}-fb.png`;
  dong.push(`| ${anh(anhFb)} | ${anh(data.image)} | ${anh(data.thumb)} |`);

  const nguon = data.sources || [];
  dong.push("", "#### Nguồn tham khảo", "");
  if (!nguon.length) {
    dong.push("⚠ Bài chưa có nguồn tham khảo.");
  } else {
    dong.push("| # | Nguồn | Link |", "|---|---|---|");
    nguon.forEach((s, i) => {
      const k = links[i];
      const tt = !s.url ? "không có link" : k ? HIEN_LINK[k.trangThai](k) : "chưa kiểm";
      dong.push(`| ${i + 1} | ${escBang(s.url ? `[${s.title}](${s.url})` : s.title)} | ${escBang(tt)} |`);
    });
  }
  return dong;
}

export function taoMarkdown({ bai, sha, repo, gioDang = moTaGioDang(), coFile = existsSync }) {
  const raw = (p) => `https://raw.githubusercontent.com/${repo}/${sha}/${p.replace(/^\//, "")}`;
  const dong = [
    DAU_HIEU,
    "## 📋 Tóm tắt duyệt bài",
    "",
    `_Tự tạo cho commit \`${sha.slice(0, 7)}\`, cập nhật mỗi khi PR có commit mới. Cảnh báo chỉ để gợi ý, không chặn merge._`,
  ];

  bai.slice(0, TOI_DA_BAI_DAY_DU).forEach((b) => dong.push(...phanBai(b, { raw, gioDang, coFile })));

  const conLai = bai.slice(TOI_DA_BAI_DAY_DU);
  if (conLai.length) {
    dong.push("", "---", "", `### ${conLai.length} bài khác trong PR này`, "", "_Gom gọn để comment không vượt giới hạn của GitHub. Link nguồn của các bài này không được kiểm._", "");
    conLai.forEach((b) => {
      const n = b.loiDoc ? 1 : b.kiemTra.loi.length;
      const w = b.loiDoc ? 0 : b.kiemTra.canhBao.length;
      dong.push(`- \`${b.slug}\` — ${n || w ? `${n} lỗi, ${w} cảnh báo` : "✓ không có gì đáng lưu ý"}`);
    });
  }

  dong.push(
    "",
    "---",
    "",
    "#### Bác sĩ xác nhận",
    "",
    "- [ ] Nội dung y khoa chính xác, số liệu khớp nguồn",
    "- [ ] Không hứa hẹn kết quả điều trị, không lời chứng thực, không giá tiền hay liều thuốc",
    "- [ ] Caption Facebook ổn, không nêu tên bác sĩ",
    "- [ ] Ảnh minh họa phù hợp",
    "",
    "Xem bài như người đọc thấy: link **Preview** do Vercel đăng trong PR này."
  );
  return dong.join("\n");
}

/** Bài bị đổi trong PR: từ file .md, hoặc từ ảnh assets/kien-thuc/<slug>-*. */
export function doSlug(files, coBai) {
  const slugs = new Set();
  for (const f of files) {
    let m = /^kien-thuc\/([^/]+)\.md$/.exec(f);
    if (m && coBai(m[1])) slugs.add(m[1]);
    m = /^assets\/kien-thuc\/([^/]+)-[^-/]+\.\w+$/.exec(f);
    if (m) {
      // tên ảnh là <slug>-<đuôi>; thử bỏ dần từng đoạn cuối tới khi khớp một bài
      const phan = m[1].split("-");
      for (let n = phan.length; n > 0; n--) {
        const s = phan.slice(0, n).join("-");
        if (coBai(s)) { slugs.add(s); break; }
      }
    }
  }
  return [...slugs].sort();
}

async function main() {
  const argv = process.argv.slice(2);
  const filesArg = argv.find((a) => a.startsWith("--files="))?.slice(8);
  const khongKiemLink = argv.includes("--khong-kiem-link");
  const base = process.env.PR_BASE;
  const head = process.env.PR_HEAD || "HEAD";
  const repo = process.env.REPO || "jasontruong581/bsquyen";
  const git = (...a) => execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

  if (!filesArg && !base) {
    console.error("Cần --files=... khi chạy tay, hoặc env PR_BASE khi chạy trong GitHub Actions.");
    process.exitCode = 2;
    return;
  }
  const files = filesArg ? filesArg.split(",") : git("diff", "--name-only", `${base}...${head}`).split("\n").filter(Boolean);
  const coBai = (s) => existsSync(`kien-thuc/${s}.md`);
  const slugs = doSlug(files, coBai);
  if (!slugs.length) {
    console.error("Không có bài Kiến thức nào bị đổi — không tạo tóm tắt.");
    return;
  }

  const bai = [];
  for (const [i, slug] of slugs.entries()) {
    // Có trên nhánh gốc rồi = đã xuất bản (merge = xuất bản)
    let daXuatBan = false;
    if (base) {
      try { git("cat-file", "-e", `${base}:kien-thuc/${slug}.md`); daXuatBan = true; } catch { /* bài mới */ }
    }
    let parsed;
    try {
      parsed = matter(readFileSync(`kien-thuc/${slug}.md`, "utf8"));
    } catch (e) {
      // YAML hỏng: báo ngay trong comment thay vì làm job fail không để lại gì
      bai.push({ slug, data: {}, daXuatBan, links: [], phutDoc: 0, loiDoc: e.message.split("\n")[0] });
      continue;
    }
    const { data, content } = parsed;
    const kiemLink = !khongKiemLink && i < TOI_DA_BAI_DAY_DU;
    const links = kiemLink ? await Promise.all((data.sources || []).map((s) => (s.url ? kiemTraLink(s.url) : null))) : [];
    bai.push({
      slug,
      data,
      daXuatBan,
      links,
      phutDoc: phutDoc(content),
      kiemTra: kiemTraBai({ data, noiDung: content, slug, coFile: existsSync, daXuatBan }),
    });
  }
  const sha = head === "HEAD" ? git("rev-parse", "HEAD") : head;
  process.stdout.write(taoMarkdown({ bai, sha, repo }) + "\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) await main();
