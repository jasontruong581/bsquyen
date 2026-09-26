#!/usr/bin/env node
// Báo cáo tháng cho giai đoạn chạy thử — in Markdown để workflow mở thành một issue.
//
//   node scripts/bao-cao-thang.mjs                # tháng trước (theo giờ Việt Nam)
//   node scripts/bao-cao-thang.mjs --thang=2026-09
//
// Env (đều không bắt buộc — thiếu thì phần đó ghi rõ lý do, báo cáo vẫn ra):
//   FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN, FB_API_VERSION   → số liệu từng bài trên page
//   GITHUB_TOKEN, REPO                                 → job đăng Facebook nào lỗi
//
// Issue là bản lưu LÂU DÀI: Umami gói Hobby chỉ giữ 6 tháng và không có API, nên phần
// Umami để bảng trống cho người điền tay từ dashboard (~2 phút).
import { readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import matter from "gray-matter";

const LECH_VN_MS = 7 * 3600 * 1000; // Việt Nam UTC+7 quanh năm

/** "2026-09" → mốc đầu/cuối tháng theo giờ VN, dạng Date (UTC bên trong). */
export function khoangThang(thang) {
  const m = /^(\d{4})-(\d{2})$/.exec(thang || "");
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) throw new Error(`Tháng "${thang}" không hợp lệ — dùng YYYY-MM.`);
  const nam = Number(m[1]);
  const t = Number(m[2]);
  return {
    tu: new Date(Date.UTC(nam, t - 1, 1) - LECH_VN_MS),
    den: new Date(Date.UTC(nam, t, 1) - LECH_VN_MS), // đầu tháng sau, loại trừ
  };
}

/** Tháng trước của thời điểm `nowMs`, tính theo lịch VN (chạy ngày 1 thì báo cáo tháng vừa xong). */
export function thangTruoc(nowMs) {
  const vn = new Date(nowMs + LECH_VN_MS);
  const d = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Bài có `date` trong tháng. Frontmatter date là ngày (không giờ) → so theo ngày lịch. */
export function baiTrongThang(ds, thang) {
  return ds.filter((b) => b.date && new Date(b.date).toISOString().slice(0, 7) === thang);
}

const escBang = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();

export function taoMarkdown({ thang, bai, facebook, jobs }) {
  const [nam, t] = thang.split("-");
  const dong = [
    `# Báo cáo tháng ${t}/${nam}`,
    "",
    "_Tự tạo ngày 1 hàng tháng. Issue này là bản lưu lâu dài — Umami chỉ giữ 6 tháng dữ liệu._",
    "",
    "## Nội dung",
    "",
  ];
  if (!bai.length) {
    dong.push("Không có bài mới trong tháng.");
  } else {
    dong.push(`**${bai.length} bài mới:**`, "");
    bai.forEach((b) => dong.push(`- ${b.ngay} — [${b.title}](https://bsquyen.vercel.app/kien-thuc/${b.slug}/)`));
  }

  dong.push("", "## Facebook — page Hiểu Đúng Y Khoa", "");
  if (facebook.loi) {
    dong.push(`⚠ ${facebook.loi}`);
  } else if (!facebook.bai.length) {
    dong.push("Không có bài đăng nào trong tháng.");
  } else {
    const cot = facebook.cotInsights;
    dong.push(
      `| Ngày | Bài | Reaction | Bình luận | Chia sẻ${cot.map((c) => ` | ${c.ten}`).join("")} |`,
      `|---|---|---|---|---${cot.map(() => "|---").join("")}|`
    );
    facebook.bai.forEach((p) =>
      dong.push(
        `| ${p.ngay} | [${escBang(p.tieuDe)}](${p.link}) | ${p.reaction} | ${p.binhLuan} | ${p.chiaSe}` +
          `${cot.map((c) => ` | ${p.insights[c.ma] ?? "—"}`).join("")} |`
      )
    );
    if (facebook.ghiChu) dong.push("", `_${facebook.ghiChu}_`);
  }

  dong.push("", "## Job đăng Facebook", "");
  if (jobs.loi) {
    dong.push(`⚠ ${jobs.loi}`);
  } else {
    dong.push(`${jobs.thanhCong} lần thành công · ${jobs.loiDs.length} lần lỗi · ${jobs.khac} lần khác (bị huỷ, bỏ qua).`);
    if (jobs.loiDs.length) {
      dong.push("", "Lần lỗi — bài liên quan có thể chưa lên page, xem log và chạy lại bằng tay:", "");
      jobs.loiDs.forEach((j) => dong.push(`- ${j.ngay}: [${escBang(j.ten)}](${j.link})`));
    }
  }

  dong.push(
    "",
    "## Umami — điền tay từ [dashboard](https://cloud.umami.is)",
    "",
    "Chọn khoảng thời gian = cả tháng này, rồi điền:",
    "",
    "| Chỉ số | Số | Ghi chú |",
    "|---|---|---|",
    "| Lượt xem trang | | |",
    "| Người xem (visitors) | | |",
    "| Lượt đến từ Facebook (UTM `utm_source=facebook`) | | |",
    "| Lượt đến từ chia sẻ (UTM `utm_source=chia-se`) | | |",
    "| Sự kiện `bam-goi` | | vị trí nhiều nhất: |",
    "| Sự kiện `bam-zalo` | | vị trí nhiều nhất: |",
    "| Sự kiện `dat-lich-soan` | | |",
    "| Bài được xem nhiều nhất | | |",
    "",
    "## Ghi chú của tháng",
    "",
    "_Điều gì đã thay đổi, điều gì cần thử tháng sau._"
  );
  return dong.join("\n");
}

// Chỉ số insights thử lần lượt, lấy cái nào Facebook còn trả. Meta hay đổi tên/khai tử
// metric giữa các phiên bản Graph API, nên không giả định cái nào chắc chắn tồn tại.
const METRIC = [
  ["post_impressions_unique", "Tiếp cận"],
  ["post_clicks", "Bấm vào bài"],
];

export async function layFacebook(thang, { fetchFn = fetch, env = process.env } = {}) {
  const { FB_PAGE_ID: pageId, FB_PAGE_ACCESS_TOKEN: token } = env;
  if (!pageId || !token) return { loi: "Chưa có secret FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN — bỏ qua phần Facebook." };
  const api = `https://graph.facebook.com/${env.FB_API_VERSION || "v26.0"}`;
  const { tu, den } = khoangThang(thang);

  const goi = async (duong, params) => {
    const qs = new URLSearchParams({ ...params, access_token: token });
    const res = await fetchFn(`${api}/${duong}?${qs}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error?.message || `HTTP ${res.status}`);
    return json;
  };

  let posts;
  try {
    posts = await goi(`${pageId}/posts`, {
      since: String(Math.floor(tu / 1000)),
      until: String(Math.floor(den / 1000)),
      limit: "100",
      fields: "id,message,created_time,permalink_url,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)",
    });
  } catch (e) {
    return { loi: `Không đọc được bài đăng của page: ${e.message}` };
  }

  const bai = [];
  const coMetric = new Set();
  let thieuInsights = false;
  for (const p of posts.data || []) {
    const insights = {};
    for (const [ma] of METRIC) {
      try {
        const r = await goi(`${p.id}/insights`, { metric: ma });
        const v = r.data?.[0]?.values?.[0]?.value;
        if (v !== undefined) { insights[ma] = v; coMetric.add(ma); }
      } catch {
        thieuInsights = true;
      }
    }
    bai.push({
      ngay: new Date(new Date(p.created_time).getTime() + LECH_VN_MS).toISOString().slice(0, 10),
      tieuDe: (p.message || "").split("\n")[0].slice(0, 70),
      link: p.permalink_url,
      reaction: p.reactions?.summary?.total_count ?? 0,
      binhLuan: p.comments?.summary?.total_count ?? 0,
      chiaSe: p.shares?.count ?? 0,
      insights,
    });
  }
  return {
    bai: bai.reverse(), // API trả mới nhất trước; báo cáo đọc theo thứ tự thời gian
    cotInsights: METRIC.filter(([ma]) => coMetric.has(ma)).map(([ma, ten]) => ({ ma, ten })),
    ghiChu: thieuInsights
      ? "Thiếu một số chỉ số tiếp cận/lượt bấm: token chưa có quyền read_insights, hoặc Meta đã đổi tên chỉ số. Chạy lại scripts/lay-token-facebook.mjs với quyền read_insights."
      : "",
  };
}

export async function layJobs(thang, { fetchFn = fetch, env = process.env } = {}) {
  const { GITHUB_TOKEN: token, REPO: repo } = env;
  if (!token || !repo) return { loi: "Chạy ngoài GitHub Actions — bỏ qua phần job." };
  const { tu, den } = khoangThang(thang);
  const ngay = (d) => new Date(d.getTime() + LECH_VN_MS).toISOString().slice(0, 10);
  // created=A..B là ngày UTC; nới hai đầu một ngày rồi lọc lại chính xác bên dưới
  const truoc = new Date(tu.getTime() - 86400000).toISOString().slice(0, 10);
  const sau = new Date(den.getTime() + 86400000).toISOString().slice(0, 10);
  const res = await fetchFn(
    `https://api.github.com/repos/${repo}/actions/workflows/dang-facebook.yml/runs?per_page=100&created=${truoc}..${sau}`,
    { headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" } }
  );
  if (!res.ok) return { loi: `Không đọc được lịch sử job (HTTP ${res.status}).` };
  const runs = ((await res.json()).workflow_runs || []).filter((r) => {
    const t = new Date(r.created_at);
    return t >= tu && t < den;
  });
  return {
    thanhCong: runs.filter((r) => r.conclusion === "success").length,
    loiDs: runs
      .filter((r) => r.conclusion === "failure")
      .map((r) => ({ ngay: ngay(new Date(r.created_at)), ten: r.display_title, link: r.html_url })),
    khac: runs.filter((r) => !["success", "failure"].includes(r.conclusion)).length,
  };
}

function docBai() {
  return readdirSync("kien-thuc")
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data } = matter(readFileSync(`kien-thuc/${f}`, "utf8"));
      return { slug: f.replace(/\.md$/, ""), title: data.title, date: data.date };
    });
}

async function main() {
  const arg = process.argv.slice(2).find((a) => a.startsWith("--thang="))?.slice(8);
  const thang = arg || process.env.THANG || thangTruoc(Date.now());
  khoangThang(thang); // kiểm tra định dạng sớm

  const bai = baiTrongThang(docBai(), thang)
    .map((b) => ({ ...b, ngay: new Date(b.date).toISOString().slice(0, 10) }))
    .sort((a, b) => a.ngay.localeCompare(b.ngay));
  const [facebook, jobs] = await Promise.all([layFacebook(thang), layJobs(thang)]);
  process.stdout.write(taoMarkdown({ thang, bai, facebook, jobs }) + "\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) await main();
