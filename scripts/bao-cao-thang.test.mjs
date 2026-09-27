// Chạy: npm test
import assert from "node:assert/strict";
import { test } from "node:test";

import { baiTrongThang, khoangThang, layFacebook, layJobs, taoMarkdown, thangTruoc } from "./bao-cao-thang.mjs";

const vn = (s) => Date.parse(`${s}+07:00`);
const JSON_RES = (ok, json, status = ok ? 200 : 400) => ({ ok, status, text: async () => JSON.stringify(json) });

test("khoảng tháng tính theo giờ Việt Nam", () => {
  const { tu, den } = khoangThang("2026-09");
  assert.equal(tu.toISOString(), "2026-08-31T17:00:00.000Z"); // 00:00 1/9 giờ VN
  assert.equal(den.toISOString(), "2026-09-30T17:00:00.000Z"); // 00:00 1/10 giờ VN
  assert.equal(khoangThang("2026-12").den.toISOString(), "2026-12-31T17:00:00.000Z");
  assert.throws(() => khoangThang("2026-13"), /không hợp lệ/);
  assert.throws(() => khoangThang("9/2026"), /không hợp lệ/);
});

test("tháng trước theo lịch VN — kể cả lúc ngày UTC vẫn là tháng cũ", () => {
  // 09:00 ngày 1/10 giờ VN (lịch chạy thật) → báo cáo tháng 9
  assert.equal(thangTruoc(vn("2026-10-01T09:00:00")), "2026-09");
  // 06:00 ngày 1/10 giờ VN = 23:00 ngày 30/9 UTC → vẫn phải là tháng 9
  assert.equal(thangTruoc(vn("2026-10-01T06:00:00")), "2026-09");
  assert.equal(thangTruoc(vn("2027-01-01T09:00:00")), "2026-12");
});

test("bài tính theo NGÀY XUẤT BẢN (merge), không theo ngày viết", () => {
  const ds = [
    // viết cuối tháng 9, bác sĩ duyệt xong merge đầu tháng 10 → thuộc tháng 10
    { slug: "viet-t9-dang-t10", date: new Date("2026-09-28"), xuatBan: new Date(vn("2026-10-03T10:00:00")) },
    // merge 23:30 giờ VN ngày 30/9 = 16:30 UTC → vẫn là tháng 9
    { slug: "dang-khuya-30-9", date: new Date("2026-09-20"), xuatBan: new Date(vn("2026-09-30T23:30:00")) },
    // không có ngày xuất bản (git không đọc được) → dùng date
    { slug: "khong-co-git", date: new Date("2026-09-15") },
    { slug: "khong-ngay" },
  ];
  assert.deepEqual(baiTrongThang(ds, "2026-09").map((b) => b.slug), ["dang-khuya-30-9", "khong-co-git"]);
  assert.deepEqual(baiTrongThang(ds, "2026-10").map((b) => b.slug), ["viet-t9-dang-t10"]);
});

// fetch giả cho Graph API. `insights` quyết định từng tên chỉ số trả gì.
function fbGia(insights) {
  return async (url) => {
    const u = new URL(url);
    if (u.pathname.endsWith("/posts")) {
      assert.ok(u.searchParams.get("since") && u.searchParams.get("until"), "phải lọc theo tháng");
      return JSON_RES(true, {
        data: [
          { id: "p2", message: "Bài thứ hai\nthân", created_time: "2026-09-26T12:30:00+0000", permalink_url: "https://fb/p2", reactions: { summary: { total_count: 5 } }, comments: { summary: { total_count: 1 } } },
          { id: "p1", message: "Bài thứ nhất", created_time: "2026-09-10T12:30:00+0000", permalink_url: "https://fb/p1", shares: { count: 2 }, reactions: { summary: { total_count: 9 } }, comments: { summary: { total_count: 0 } } },
        ],
      });
    }
    if (u.pathname.endsWith("/insights")) return insights(u.searchParams.get("metric"));
    throw new Error("url lạ " + url);
  };
}
const ENV_FB = { FB_PAGE_ID: "1", FB_PAGE_ACCESS_TOKEN: "t" };
const coGiaTri = () => JSON_RES(true, { data: [{ values: [{ value: 123 }] }] });
const loiFb = (code, message) => () => JSON_RES(false, { error: { code, message } });

test("Facebook đủ quyền: đủ 3 cột, bài xếp theo thời gian", async () => {
  const fb = await layFacebook("2026-09", { fetchFn: fbGia(coGiaTri), env: ENV_FB });
  assert.equal(fb.loi, undefined);
  assert.deepEqual(fb.bai.map((b) => b.link), ["https://fb/p1", "https://fb/p2"]);
  assert.equal(fb.bai[0].chiaSe, 2);
  assert.equal(fb.bai[1].reaction, 5);
  assert.deepEqual(fb.cotInsights.map((c) => c.ten), ["Tiếp cận", "Lượt xem", "Bấm vào bài"]);
  assert.deepEqual(fb.ghiChu, []);
});

test("chỉ số cũ bị Meta khai tử: tự dùng tên mới, không báo nhầm là thiếu quyền", async () => {
  const daThu = [];
  const insights = (m) => {
    daThu.push(m);
    return m === "post_total_media_view_unique" ? loiFb(100, "(#100) invalid metric")() : coGiaTri();
  };
  const fb = await layFacebook("2026-09", { fetchFn: fbGia(insights), env: ENV_FB });
  assert.ok(fb.cotInsights.some((c) => c.ten === "Tiếp cận"), "phải rơi về tên dự phòng");
  assert.deepEqual(fb.ghiChu, []);
  // tên bị từ chối (#100) ở bài đầu thì bài sau không thử lại
  assert.equal(daThu.filter((m) => m === "post_total_media_view_unique").length, 1);
});

test("mọi tên của một cột đều bị khai tử: ghi chú nói ĐÚNG lý do (đổi tên, không phải token)", async () => {
  const insights = (m) => (m === "post_clicks" ? coGiaTri() : loiFb(100, "(#100) invalid metric")());
  const fb = await layFacebook("2026-09", { fetchFn: fbGia(insights), env: ENV_FB });
  assert.deepEqual(fb.cotInsights.map((c) => c.ten), ["Bấm vào bài"]);
  assert.equal(fb.ghiChu.length, 2);
  assert.ok(fb.ghiChu.every((g) => /không còn nhận các tên chỉ số/.test(g) && !/read_insights/.test(g)));
});

test("token thiếu read_insights: vẫn có reaction/bình luận/chia sẻ, ghi chú đúng lý do, không fail", async () => {
  const fb = await layFacebook("2026-09", { fetchFn: fbGia(loiFb(10, "(#10) requires read_insights")), env: ENV_FB });
  assert.equal(fb.bai.length, 2);
  assert.deepEqual(fb.cotInsights, []);
  assert.ok(fb.ghiChu.length && fb.ghiChu.every((g) => /read_insights/.test(g)));
  const md = taoMarkdown({ thang: "2026-09", bai: [], facebook: fb, jobs: { loi: "x" }, nowMs: vn("2026-10-01T09:00:00") });
  assert.match(md, /\| Reaction \| Bình luận \| Chia sẻ \|/);
  assert.match(md, /⚠ Thiếu cột "Tiếp cận": token chưa có quyền read_insights/);
});

test("phản hồi 200 nhưng không phải JSON: báo lỗi, KHÔNG báo nhầm là không có bài", async () => {
  const hong = async () => ({ ok: true, status: 200, text: async () => "<html>bad gateway</html>" });
  assert.match((await layFacebook("2026-09", { fetchFn: hong, env: ENV_FB })).loi, /không phải JSON/);
  const rong = async () => ({ ok: true, status: 200, text: async () => "null" });
  assert.match((await layFacebook("2026-09", { fetchFn: rong, env: ENV_FB })).loi, /rỗng/);
});

test("thiếu secret hoặc token hỏng: báo cáo vẫn ra, chỉ ghi lý do", async () => {
  assert.match((await layFacebook("2026-09", { env: {} })).loi, /Chưa có secret/);
  const hong = async () => JSON_RES(false, { error: { code: 190, message: "Invalid OAuth access token" } });
  assert.match((await layFacebook("2026-09", { fetchFn: hong, env: ENV_FB })).loi, /Invalid OAuth/);
});

test("phân trang: đọc tiếp paging.next", async () => {
  let lan = 0;
  const fetchFn = async (url) => {
    const u = new URL(url);
    if (u.pathname.endsWith("/insights")) return coGiaTri();
    lan++;
    const bai = (id) => ({ id, created_time: "2026-09-10T00:00:00+0000", message: id });
    return lan === 1
      ? JSON_RES(true, { data: [bai("a")], paging: { next: "https://graph.facebook.com/v26.0/next-page" } })
      : JSON_RES(true, { data: [bai("b")] });
  };
  const fb = await layFacebook("2026-09", { fetchFn, env: ENV_FB });
  assert.equal(fb.bai.length, 2);
});

test("job đăng Facebook: đếm theo tháng giờ VN; quá giờ / không khởi động được cũng là lỗi", async () => {
  const runs = [
    { created_at: "2026-08-31T16:59:00Z", conclusion: "failure" }, // 23:59 31/8 VN — tháng trước
    { created_at: "2026-08-31T17:00:00Z", conclusion: "success" }, // 00:00 1/9 VN
    { created_at: "2026-09-21T16:23:02Z", conclusion: "failure", display_title: "Merge #28", html_url: "https://gh/28" },
    { created_at: "2026-09-22T01:00:00Z", conclusion: "timed_out", display_title: "Merge #29", html_url: "https://gh/29" },
    { created_at: "2026-09-26T05:26:00Z", conclusion: "cancelled" },
    { created_at: "2026-09-30T17:00:00Z", conclusion: "success" }, // 00:00 1/10 VN — tháng sau
  ];
  const j = await layJobs("2026-09", { fetchFn: async () => JSON_RES(true, { workflow_runs: runs }), env: { GITHUB_TOKEN: "t", REPO: "o/r" } });
  assert.equal(j.thanhCong, 1);
  assert.equal(j.khac, 1);
  assert.deepEqual(j.loiDs.map((l) => [l.ngay, l.ketQua]), [["2026-09-21", "lỗi"], ["2026-09-22", "quá giờ"]]);
});

test("job: lỗi mạng hay JSON hỏng thành một dòng, không làm mất cả báo cáo", async () => {
  const env = { GITHUB_TOKEN: "t", REPO: "o/r" };
  const mang = async () => { throw new TypeError("fetch failed"); };
  assert.match((await layJobs("2026-09", { fetchFn: mang, env })).loi, /fetch failed/);
  const hong = async () => ({ ok: true, status: 200, text: async () => "{cụt" });
  assert.match((await layJobs("2026-09", { fetchFn: hong, env })).loi, /không phải JSON/);
});

test("tháng chưa hết: tiêu đề khác hẳn, để issue thử không chặn báo cáo đầy đủ", () => {
  const tham = { thang: "2026-09", bai: [], facebook: { bai: [], cotInsights: [] }, jobs: { thanhCong: 0, loiDs: [], khac: 0 } };
  const tam = taoMarkdown({ ...tham, nowMs: vn("2026-09-27T10:00:00") }).split("\n")[0];
  const du = taoMarkdown({ ...tham, nowMs: vn("2026-10-01T09:00:00") }).split("\n")[0];
  assert.equal(du, "# Báo cáo tháng 09/2026");
  assert.equal(tam, "# Báo cáo tháng 09/2026 (tạm tính tới 27/09)");
  assert.notEqual(tam, du);
});

test("markdown: đủ các phần, thoát ký tự đặc biệt, bảng Umami để trống", () => {
  const md = taoMarkdown({
    thang: "2026-09",
    bai: [{ ngay: "2026-09-25", title: "Vắc-xin | phòng @ai #12", slug: "vac-xin" }],
    facebook: { bai: [{ ngay: "2026-09-25", tieuDe: "", link: "", reaction: 1, binhLuan: 0, chiaSe: 0, insights: {} }], cotInsights: [] },
    jobs: { thanhCong: 3, loiDs: [], khac: 0 },
    nowMs: vn("2026-10-01T09:00:00"),
  });
  for (const phan of ["# Báo cáo tháng 09/2026", "## Nội dung", "## Facebook", "## Job đăng Facebook", "## Umami", "`bam-goi`"]) {
    assert.ok(md.includes(phan), `thiếu: ${phan}`);
  }
  assert.match(md, /Vắc-xin \\\| phòng @​ai #​12/, "phải thoát |, @ và #số");
  assert.match(md, /\(bài không có chữ\)/);
  assert.match(md, /0 lần lỗi · 3 lần chạy xong không lỗi/);
});
