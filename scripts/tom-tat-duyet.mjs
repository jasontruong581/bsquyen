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

import { taoCaption } from "./caption-facebook.mjs";

const require = createRequire(import.meta.url);
const CHU_DE = require("../_data/chuDe.js");

export const DAU_HIEU = "<!-- tom-tat-duyet -->";
const SITE_URL = (process.env.SITE_URL || "https://bsquyen.vercel.app").replace(/\/$/, "");
const DO_DAI_CAPTION = [400, 700];
const DO_DAI_CAU_MO = 125; // Facebook cắt caption ở khoảng này rồi mới hiện "Xem thêm"

// Mỗi nhóm: [tên hiển thị, regex]. Cố ý bắt rộng — báo nhầm vài câu hợp lệ còn hơn sót
// một lời hứa hẹn điều trị. Bác sĩ đọc câu được trích và tự quyết.
const MAU_THAN_BAI = [
  ["Hứa hẹn kết quả điều trị", /chữa khỏi|khỏi hẳn|khỏi hoàn toàn|dứt điểm|chắc chắn khỏi|đảm bảo (khỏi|chữa)|cam kết (khỏi|chữa)|thần dược|100\s?%/i],
  ["Có thể là lời chứng thực của người bệnh", /(bệnh nhân|người bệnh) của (tôi|chúng tôi)|nhờ (bác sĩ|phòng khám)[^.]{0,40}(khỏi|đỡ)|đã khỏi bệnh/i],
  ["Giật tít, dễ gây hoang mang", /chết người|ai cũng mắc|báo động đỏ|cực kỳ nguy hiểm|gây sốc|kẻ giết người/i],
];
const MAU_CAPTION = [
  ["Caption nêu tên bác sĩ (page mang thương hiệu riêng)", /hạnh quyên|bs\.?\s?cki|bác sĩ quyên|bsquyen/i],
  ["Caption có số điện thoại / Zalo / địa chỉ (trang bài đã có)", /0\d{9}|0\d{3}[\s.]\d{3}[\s.]\d{3}|zalo\.me|297a/i],
  ["Caption có link (script tự nối link bài)", /https?:\/\//i],
  ["Caption có hashtag (script tự nối từ tags)", /(^|\s)#[^\s#]/],
];

/** Trả về danh sách {muc, cau} — cau là đoạn trích quanh chỗ khớp để bác sĩ đọc nhanh. */
export function timMau(van, mau) {
  const ketQua = [];
  for (const [muc, re] of mau) {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    for (const m of String(van).matchAll(g)) {
      const dau = Math.max(0, m.index - 50);
      const cuoi = Math.min(van.length, m.index + m[0].length + 50);
      const cau = van.slice(dau, cuoi).replace(/\s+/g, " ").trim();
      ketQua.push({ muc, cau: `${dau > 0 ? "…" : ""}${cau}${cuoi < van.length ? "…" : ""}` });
    }
  }
  return ketQua;
}

/**
 * Câu mở của caption = tới dấu kết câu đầu tiên, tính cả ngoặc đóng ngay sau nó —
 * caption hay mở bằng câu bệnh nhân hỏi trong ngoặc kép: "…thật hả bác sĩ?" — Có, …
 */
export function cauMo(chu) {
  const m = /^[\s\S]*?[.?!…]["”’»)]*(?=\s|$)/.exec(chu.trim());
  return (m ? m[0] : chu.split("\n")[0]).trim();
}

/**
 * Kiểm tra một bài. Không đọc đĩa hay gọi mạng — nhận sẵn dữ liệu, trả về lỗi (thiếu thứ
 * bắt buộc) và cảnh báo (nên xem lại). `coFile(path)` cho biết file ảnh có tồn tại không.
 */
export function kiemTraBai({ data, noiDung, slug, coFile }) {
  const loi = [];
  const canhBao = [];

  for (const f of ["title", "description", "date", "tags", "thumb", "image", "facebook"]) {
    if (!data[f] || (Array.isArray(data[f]) && !data[f].length)) loi.push(`Thiếu \`${f}\` trong frontmatter`);
  }
  for (const t of data.tags || []) {
    if (!CHU_DE.includes(t)) loi.push(`Tag lạ "${t}" — chỉ dùng 6 tag cố định: ${CHU_DE.join(", ")}`);
  }
  for (const [ten, duong] of [
    ["thumb", data.thumb],
    ["image (ảnh OG)", data.image],
    ["ảnh Facebook", `/assets/kien-thuc/${slug}-fb.png`],
  ]) {
    if (duong && !coFile(duong.replace(/^\//, ""))) loi.push(`Không thấy file ${ten}: \`${duong}\``);
  }

  canhBao.push(...timMau(noiDung, MAU_THAN_BAI).map((x) => ({ ...x, noi: "thân bài" })));

  if (data.facebook) {
    const { chu } = taoCaption(data, slug, SITE_URL);
    canhBao.push(...timMau(chu, [...MAU_THAN_BAI, ...MAU_CAPTION]).map((x) => ({ ...x, noi: "caption" })));
    if (chu.length < DO_DAI_CAPTION[0] || chu.length > DO_DAI_CAPTION[1]) {
      canhBao.push({ muc: `Caption dài ${chu.length} ký tự (nên ${DO_DAI_CAPTION.join("–")})`, noi: "caption" });
    }
    const mo = cauMo(chu);
    if (mo.length > DO_DAI_CAU_MO) {
      canhBao.push({
        muc: `Câu mở dài ${mo.length} ký tự — Facebook cắt ở ~${DO_DAI_CAU_MO}, người đọc không thấy hết trước "Xem thêm"`,
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
    if ([401, 403, 429].includes(res.status)) return { trangThai: "chan", ma: res.status };
    if (!res.ok) return { trangThai: "chet", ma: res.status };
    const dich = res.url && res.url !== url ? res.url : null;
    return dich ? { trangThai: "chuyen", ma: res.status, dich } : { trangThai: "song", ma: res.status };
  } catch (e) {
    // Lỗi SSL phía trang (vd moh.gov.vn dùng khoá DH quá yếu): OpenSSL của Node từ chối,
    // nhưng trình duyệt vẫn mở được — không phải link chết.
    const ma = (e.cause && e.cause.code) || "";
    if (/SSL|TLS|CERT|UNABLE_TO_VERIFY|DEPTH_ZERO/.test(ma)) return { trangThai: "ssl", ma };
    return { trangThai: "chet", ma: e.name === "TimeoutError" ? "hết giờ" : "không kết nối được" };
  }
}

const HIEN_LINK = {
  song: () => "✓ còn sống",
  chuyen: (k) => `↪ chuyển tới <${k.dich}>`,
  chan: (k) => `⚠ trang chặn kiểm tra tự động (${k.ma}) — mở tay xem`,
  ssl: () => "⚠ không kiểm được tự động (cấu hình SSL cũ phía trang) — mở tay xem",
  chet: (k) => `✗ **lỗi (${k.ma})**`,
};

const escBang = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");

export function taoMarkdown({ bai, sha, repo }) {
  const raw = (p) => `https://raw.githubusercontent.com/${repo}/${sha}/${p.replace(/^\//, "")}`;
  const dong = [
    DAU_HIEU,
    "## 📋 Tóm tắt duyệt bài",
    "",
    `_Tự tạo cho commit \`${sha.slice(0, 7)}\`, cập nhật mỗi khi PR có commit mới. Cảnh báo chỉ để gợi ý, không chặn merge._`,
  ];

  for (const b of bai) {
    const { data, slug, kiemTra, links, daXuatBan, phutDoc } = b;
    dong.push("", "---", "", `### ${data.title || slug}`, "");
    dong.push(
      `\`${slug}\` · Chủ đề: ${(data.tags || []).join(", ") || "—"} · CTA: ${data.cta || "mặc định"} · ~${phutDoc} phút đọc`
    );
    if (daXuatBan) {
      dong.push("", "> ℹ️ Bài **đã xuất bản** — sửa bài không đăng lại lên Facebook.");
    }

    dong.push("", "#### Cần xem lại");
    if (!kiemTra.loi.length && !kiemTra.canhBao.length) {
      dong.push("", "✓ Không thấy gì đáng lưu ý.");
    } else {
      dong.push("");
      kiemTra.loi.forEach((l) => dong.push(`- ✗ ${l}`));
      kiemTra.canhBao.forEach((c) =>
        dong.push(`- ⚠ **${c.muc}** _(${c.noi})_${c.cau ? `\n  > ${c.cau}` : ""}`)
      );
    }

    if (data.facebook && !daXuatBan) {
      const { chu, caption } = taoCaption(data, slug, SITE_URL);
      const mo = cauMo(chu);
      dong.push(
        "",
        "#### Bài đăng Facebook",
        "",
        "Đúng từng chữ như sẽ lên page, hẹn 19:30 ngày merge.",
        "",
        `**Người đọc thấy trước "Xem thêm":** ${mo.slice(0, DO_DAI_CAU_MO)}${mo.length > DO_DAI_CAU_MO ? "…" : ""}`,
        "",
        `<details><summary>Caption đầy đủ (${caption.length} ký tự)</summary>`,
        "",
        "```text",
        caption,
        "```",
        "",
        "</details>"
      );
    }

    dong.push("", "#### Ảnh", "", "| Facebook | Share link (OG) | Thumbnail |", "|---|---|---|");
    const anh = (p) => (p ? `<img src="${raw(p)}" width="220">` : "—");
    dong.push(`| ${anh(`assets/kien-thuc/${slug}-fb.png`)} | ${anh(data.image)} | ${anh(data.thumb)} |`);

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
  }

  dong.push(
    "",
    "---",
    "",
    "#### Bác sĩ xác nhận",
    "",
    "- [ ] Nội dung y khoa chính xác, số liệu khớp nguồn",
    "- [ ] Không hứa hẹn kết quả điều trị, không lời chứng thực",
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
  const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();

  const files = filesArg
    ? filesArg.split(",")
    : git("diff", "--name-only", `${base}...${head}`).split("\n").filter(Boolean);
  const coBai = (s) => existsSync(`kien-thuc/${s}.md`);
  const slugs = doSlug(files, coBai);
  if (!slugs.length) {
    console.error("Không có bài Kiến thức nào bị đổi — không tạo tóm tắt.");
    return;
  }

  const bai = [];
  for (const slug of slugs) {
    const { data, content } = matter(readFileSync(`kien-thuc/${slug}.md`, "utf8"));
    // Có trên nhánh gốc rồi = đã xuất bản (merge = xuất bản)
    let daXuatBan = false;
    if (base) {
      try { git("cat-file", "-e", `${base}:kien-thuc/${slug}.md`); daXuatBan = true; } catch { /* bài mới */ }
    }
    const links = khongKiemLink
      ? []
      : await Promise.all((data.sources || []).map((s) => (s.url ? kiemTraLink(s.url) : null)));
    bai.push({
      slug,
      data,
      daXuatBan,
      links,
      phutDoc: Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length / 250)),
      kiemTra: kiemTraBai({ data, noiDung: content, slug, coFile: existsSync }),
    });
  }
  const sha = head === "HEAD" ? git("rev-parse", "HEAD") : head;
  process.stdout.write(taoMarkdown({ bai, sha, repo }) + "\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) await main();
