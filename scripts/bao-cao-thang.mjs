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
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import matter from "gray-matter";

const LECH_VN_MS = 7 * 3600 * 1000; // Việt Nam UTC+7 quanh năm
const ngayVN = (d) => new Date(d.getTime() + LECH_VN_MS).toISOString().slice(0, 10);

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

/**
 * Bài xuất bản trong tháng. Tính theo NGÀY XUẤT BẢN (lúc merge vào main), không theo field
 * `date`: `date` là ngày viết, còn bài chỉ lên site sau khi bác sĩ duyệt. Bài viết 28/9 mà
 * merge 3/10 thì theo `date` sẽ lọt khỏi mọi báo cáo — tháng 9 chạy lúc nó chưa lên, tháng 10
 * lại loại nó vì `date` là tháng 9. Không có ngày xuất bản (git không đọc được) mới dùng `date`.
 */
export function baiTrongThang(ds, thang) {
  const { tu, den } = khoangThang(thang);
  return ds.filter((b) => {
    if (b.xuatBan) return b.xuatBan >= tu && b.xuatBan < den;
    return b.date && new Date(b.date).toISOString().slice(0, 7) === thang;
  });
}

// Ô bảng và đoạn chữ lấy từ nơi khác: thoát "|" (vỡ bảng), chặn "@ai-đó" (GitHub sẽ báo
// cho người đó) và "#123" (tự thành link tới issue khác).
const escBang = (s) =>
  String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/@/g, "@​")
    .replace(/#(\d)/g, "#​$1")
    .replace(/\s+/g, " ")
    .trim();

export function taoMarkdown({ thang, bai, facebook, jobs, nowMs = Date.now() }) {
  const [nam, t] = thang.split("-");
  // Tháng chưa hết (chạy tay giữa tháng để thử) → tiêu đề khác hẳn, để issue tạm này không
  // bao giờ trùng tên và chặn báo cáo đầy đủ chạy ngày 1 tháng sau.
  const chuaHet = khoangThang(thang).den.getTime() > nowMs;
  const tam = chuaHet ? ` (tạm tính tới ${ngayVN(new Date(nowMs)).split("-").reverse().slice(0, 2).join("/")})` : "";
  const dong = [
    `# Báo cáo tháng ${t}/${nam}${tam}`,
    "",
    chuaHet
      ? "_Bản **tạm**: tháng chưa hết. Báo cáo đầy đủ tự tạo ngày 1 tháng sau._"
      : "_Tự tạo ngày 1 hàng tháng. Issue này là bản lưu lâu dài — Umami chỉ giữ 6 tháng dữ liệu._",
    "",
    "## Nội dung",
    "",
  ];
  if (!bai.length) {
    dong.push("Không có bài mới xuất bản trong tháng.");
  } else {
    dong.push(`**${bai.length} bài mới xuất bản:**`, "");
    bai.forEach((b) => dong.push(`- ${b.ngay} — [${escBang(b.title)}](https://bsquyen.vercel.app/kien-thuc/${b.slug}/)`));
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
    facebook.bai.forEach((p) => {
      const ten = escBang(p.tieuDe) || "(bài không có chữ)";
      dong.push(
        `| ${p.ngay} | ${p.link ? `[${ten}](${p.link})` : ten} | ${p.reaction} | ${p.binhLuan} | ${p.chiaSe}` +
          `${cot.map((c) => ` | ${p.insights[c.ten] ?? "—"}`).join("")} |`
      );
    });
  }
  (facebook.ghiChu || []).forEach((g) => dong.push("", `⚠ ${g}`));

  dong.push("", "## Job đăng Facebook", "");
  if (jobs.loi) {
    dong.push(`⚠ ${jobs.loi}`);
  } else {
    dong.push(
      `${jobs.loiDs.length} lần lỗi · ${jobs.thanhCong} lần chạy xong không lỗi (gồm cả lần chạy thử và lần không có bài mới để đăng) · ${jobs.khac} lần bị huỷ hoặc bỏ qua.`
    );
    if (jobs.loiDs.length) {
      dong.push("", "Lần lỗi — bài liên quan có thể chưa lên page, xem log và chạy lại bằng tay:", "");
      jobs.loiDs.forEach((j) => dong.push(`- ${j.ngay}: [${escBang(j.ten)}](${j.link}) (${j.ketQua})`));
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

// Mỗi cột thử các tên chỉ số theo thứ tự, lấy cái đầu tiên Facebook còn trả. Meta đã thay
// toàn bộ chỉ số "impressions" bằng "views" trên mọi phiên bản API từ 15/11/2025 (tên cũ
// trả lỗi invalid metric), và còn có thể đổi tiếp — nên giữ cả tên mới lẫn tên cũ dự phòng.
export const COT_INSIGHTS = [
  { ten: "Tiếp cận", ungVien: ["post_total_media_view_unique", "post_impressions_unique"] },
  { ten: "Lượt xem", ungVien: ["post_media_view"] },
  { ten: "Bấm vào bài", ungVien: ["post_clicks"] },
];
// Mã lỗi Graph API: 100 = tham số/chỉ số không hợp lệ; 10, 200-299 = thiếu quyền; 190 = token hỏng
const laLoiQuyen = (ma) => ma === 10 || ma === 190 || (ma >= 200 && ma < 300);

/**
 * Đọc JSON NGHIÊM: phản hồi 200 mà thân không phải JSON (trang lỗi HTML của proxy, JSON
 * cụt…) phải thành lỗi. Nuốt lỗi rồi coi như `{}` thì báo cáo ghi "không có bài đăng nào"
 * — số liệu sai mà trông như đúng, tệ hơn nhiều so với một dòng báo lỗi.
 */
async function docJson(res) {
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`phản hồi không phải JSON (HTTP ${res.status})`);
  }
  if (!json || typeof json !== "object") throw new Error(`phản hồi rỗng (HTTP ${res.status})`);
  return json;
}

// Tối đa bấy nhiêu trang kết quả (100 mục/trang). Nhịp ~2 bài/tháng thì 1 trang là dư;
// giới hạn để một vòng lặp phân trang hỏng không chạy mãi.
const TOI_DA_TRANG = 10;

export async function layFacebook(thang, { fetchFn = fetch, env = process.env } = {}) {
  const { FB_PAGE_ID: pageId, FB_PAGE_ACCESS_TOKEN: token } = env;
  if (!pageId || !token) return { loi: "Chưa có secret FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN — bỏ qua phần Facebook." };
  const api = `https://graph.facebook.com/${env.FB_API_VERSION || "v26.0"}`;
  const { tu, den } = khoangThang(thang);

  const goiUrl = async (url) => {
    const res = await fetchFn(url);
    if (!res.ok) {
      const loi = await docJson(res).catch(() => ({}));
      const e = new Error((loi.error && loi.error.message) || `HTTP ${res.status}`);
      e.ma = loi.error && loi.error.code;
      throw e;
    }
    return docJson(res);
  };
  const goi = (duong, params) =>
    goiUrl(`${api}/${duong}?${new URLSearchParams({ ...params, access_token: token })}`);

  const posts = [];
  try {
    let trang = await goi(`${pageId}/posts`, {
      since: String(Math.floor(tu / 1000)),
      until: String(Math.floor(den / 1000)),
      limit: "100",
      fields: "id,message,created_time,permalink_url,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)",
    });
    for (let i = 1; ; i++) {
      posts.push(...(Array.isArray(trang.data) ? trang.data : []));
      const tiep = trang.paging && trang.paging.next; // URL trang sau đã kèm token
      if (!tiep || i >= TOI_DA_TRANG) break;
      trang = await goiUrl(tiep);
    }
  } catch (e) {
    return { loi: `Không đọc được bài đăng của page: ${e.message}` };
  }

  // Mỗi cột: tên chỉ số đã chạy được (dùng lại cho các bài sau) và lý do các tên bị từ chối
  const trangThaiCot = COT_INSIGHTS.map((c) => ({ ...c, chon: null, boQua: new Set(), loi: [] }));
  const bai = [];
  for (const p of posts) {
    const insights = {};
    for (const cot of trangThaiCot) {
      const thu = cot.chon ? [cot.chon] : cot.ungVien.filter((m) => !cot.boQua.has(m));
      for (const ma of thu) {
        try {
          const r = await goi(`${p.id}/insights`, { metric: ma });
          const v = r.data && r.data[0] && r.data[0].values && r.data[0].values[0] && r.data[0].values[0].value;
          if (v === undefined) continue;
          insights[cot.ten] = v;
          cot.chon = ma;
          break;
        } catch (e) {
          cot.loi.push({ ma, maLoi: e.ma, thongDiep: e.message });
          // Chỉ số không hợp lệ thì các bài sau khỏi thử lại tên đó
          if (e.ma === 100) cot.boQua.add(ma);
        }
      }
    }
    const tao = new Date(p.created_time);
    bai.push({
      ngay: Number.isNaN(tao.getTime()) ? "—" : ngayVN(tao),
      tieuDe: (p.message || "").split("\n")[0].slice(0, 70),
      link: p.permalink_url,
      reaction: p.reactions?.summary?.total_count ?? 0,
      binhLuan: p.comments?.summary?.total_count ?? 0,
      chiaSe: p.shares?.count ?? 0,
      insights,
    });
  }

  // Ghi đúng NGUYÊN NHÂN cột nào thiếu — gộp chung "thiếu quyền hoặc đổi tên" thì người đọc
  // đi lấy lại token vô ích trong khi thật ra là Meta đã bỏ chỉ số.
  const ghiChu = [];
  if (bai.length) {
    for (const cot of trangThaiCot.filter((c) => !c.chon)) {
      const quyen = cot.loi.find((l) => laLoiQuyen(l.maLoi));
      if (quyen) {
        ghiChu.push(`Thiếu cột "${cot.ten}": token chưa có quyền read_insights. Chạy lại scripts/lay-token-facebook.mjs với quyền này.`);
      } else if (cot.loi.length && cot.loi.every((l) => l.maLoi === 100)) {
        ghiChu.push(`Thiếu cột "${cot.ten}": Facebook không còn nhận các tên chỉ số ${cot.ungVien.join(", ")} — Meta đã đổi tên, cập nhật COT_INSIGHTS trong scripts/bao-cao-thang.mjs.`);
      } else if (cot.loi.length) {
        ghiChu.push(`Thiếu cột "${cot.ten}": ${cot.loi[0].thongDiep}`);
      }
    }
  }
  return {
    bai: bai.reverse(), // API trả mới nhất trước; báo cáo đọc theo thứ tự thời gian
    cotInsights: trangThaiCot.filter((c) => c.chon).map((c) => ({ ten: c.ten })),
    ghiChu,
  };
}

// Kết quả coi là "không đăng được bài": lỗi, quá giờ, không khởi động được.
const KET_QUA_LOI = { failure: "lỗi", timed_out: "quá giờ", startup_failure: "không khởi động được" };

// Như layFacebook: mọi lỗi (mạng, JSON hỏng, quyền) thành một dòng trong báo cáo. Để lỗi
// văng ra thì cả báo cáo tháng đó không được tạo — mất luôn phần bài viết và Facebook.
export async function layJobs(thang, { fetchFn = fetch, env = process.env } = {}) {
  const { GITHUB_TOKEN: token, REPO: repo } = env;
  if (!token || !repo) return { loi: "Chạy ngoài GitHub Actions — bỏ qua phần job." };
  const { tu, den } = khoangThang(thang);
  // created=A..B là ngày UTC; nới hai đầu một ngày rồi lọc lại chính xác bên dưới
  const truoc = new Date(tu.getTime() - 86400000).toISOString().slice(0, 10);
  const sau = new Date(den.getTime() + 86400000).toISOString().slice(0, 10);

  try {
    const runs = [];
    for (let page = 1; page <= TOI_DA_TRANG; page++) {
      const res = await fetchFn(
        `https://api.github.com/repos/${repo}/actions/workflows/dang-facebook.yml/runs?per_page=100&page=${page}&created=${truoc}..${sau}`,
        { headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" } }
      );
      if (!res.ok) return { loi: `Không đọc được lịch sử job (HTTP ${res.status}).` };
      const json = await docJson(res);
      const ds = Array.isArray(json.workflow_runs) ? json.workflow_runs : [];
      runs.push(...ds);
      if (ds.length < 100) break;
    }
    const trongThang = runs.filter((r) => {
      const t = new Date(r.created_at);
      return t >= tu && t < den;
    });
    return {
      thanhCong: trongThang.filter((r) => r.conclusion === "success").length,
      loiDs: trongThang
        .filter((r) => KET_QUA_LOI[r.conclusion])
        .map((r) => ({ ngay: ngayVN(new Date(r.created_at)), ten: r.display_title, link: r.html_url, ketQua: KET_QUA_LOI[r.conclusion] })),
      khac: trongThang.filter((r) => r.conclusion !== "success" && !KET_QUA_LOI[r.conclusion]).length,
    };
  } catch (e) {
    return { loi: `Không đọc được lịch sử job: ${e.message}` };
  }
}

/** Lúc bài được merge vào nhánh hiện tại (--first-parent: commit merge, không phải commit viết bài). */
function ngayXuatBan(file) {
  try {
    const out = execFileSync("git", ["log", "--first-parent", "--diff-filter=A", "--format=%cI", "HEAD", "--", file], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const dong = out.split("\n").filter(Boolean);
    return dong.length ? new Date(dong[dong.length - 1]) : null;
  } catch {
    return null; // không có git / clone nông → dùng field `date`
  }
}

function docBai() {
  return readdirSync("kien-thuc")
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data } = matter(readFileSync(`kien-thuc/${f}`, "utf8"));
      return { slug: f.replace(/\.md$/, ""), title: data.title, date: data.date, xuatBan: ngayXuatBan(`kien-thuc/${f}`) };
    });
}

async function main() {
  const arg = process.argv.slice(2).find((a) => a.startsWith("--thang="))?.slice(8);
  const thang = arg || process.env.THANG || thangTruoc(Date.now());
  try {
    khoangThang(thang); // kiểm tra định dạng sớm
  } catch (e) {
    console.error(`✖ ${e.message}`);
    process.exitCode = 2;
    return;
  }

  const bai = baiTrongThang(docBai(), thang)
    .map((b) => ({ ...b, ngay: b.xuatBan ? ngayVN(b.xuatBan) : new Date(b.date).toISOString().slice(0, 10) }))
    .sort((a, b) => a.ngay.localeCompare(b.ngay));
  // allSettled làm lưới cuối: một nguồn lỡ văng lỗi chưa lường trước cũng không được làm
  // mất cả báo cáo — nó chỉ thành một dòng "⚠" ở phần của nó.
  const [fb, jb] = await Promise.allSettled([layFacebook(thang), layJobs(thang)]);
  const facebook = fb.status === "fulfilled" ? fb.value : { loi: `Lỗi không lường trước: ${fb.reason && fb.reason.message}` };
  const jobs = jb.status === "fulfilled" ? jb.value : { loi: `Lỗi không lường trước: ${jb.reason && jb.reason.message}` };
  process.stdout.write(taoMarkdown({ thang, bai, facebook, jobs }) + "\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) await main();
