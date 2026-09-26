// Chạy: npm test
import assert from "node:assert/strict";
import { test } from "node:test";

import { baiTrongThang, khoangThang, layFacebook, layJobs, taoMarkdown, thangTruoc } from "./bao-cao-thang.mjs";

const vn = (s) => Date.parse(`${s}+07:00`);

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

test("lọc bài theo tháng", () => {
  const ds = [
    { slug: "a", date: new Date("2026-08-31") },
    { slug: "b", date: new Date("2026-09-01") },
    { slug: "c", date: new Date("2026-09-30") },
    { slug: "d", date: new Date("2026-10-01") },
    { slug: "e" },
  ];
  assert.deepEqual(baiTrongThang(ds, "2026-09").map((b) => b.slug), ["b", "c"]);
});

// fetch giả: trả JSON theo đường dẫn; insights có thể bị từ chối (token thiếu read_insights)
function fbGia({ choInsights }) {
  return async (url) => {
    const u = new URL(url);
    const tra = (ok, json) => ({ ok, status: ok ? 200 : 400, json: async () => json });
    if (u.pathname.endsWith("/posts")) {
      assert.ok(u.searchParams.get("since") && u.searchParams.get("until"), "phải lọc theo tháng");
      return tra(true, {
        data: [
          {
            id: "p2",
            message: "Bài thứ hai\nthân",
            created_time: "2026-09-26T12:30:00+0000",
            permalink_url: "https://fb/p2",
            reactions: { summary: { total_count: 5 } },
            comments: { summary: { total_count: 1 } },
          },
          {
            id: "p1",
            message: "Bài thứ nhất",
            created_time: "2026-09-10T12:30:00+0000",
            permalink_url: "https://fb/p1",
            shares: { count: 2 },
            reactions: { summary: { total_count: 9 } },
            comments: { summary: { total_count: 0 } },
          },
        ],
      });
    }
    if (u.pathname.endsWith("/insights")) {
      if (!choInsights) return tra(false, { error: { message: "(#10) requires read_insights" } });
      return tra(true, { data: [{ values: [{ value: 123 }] }] });
    }
    throw new Error("url lạ " + url);
  };
}
const ENV_FB = { FB_PAGE_ID: "1", FB_PAGE_ACCESS_TOKEN: "t" };

test("Facebook đủ quyền: có cột tiếp cận, bài xếp theo thời gian", async () => {
  const fb = await layFacebook("2026-09", { fetchFn: fbGia({ choInsights: true }), env: ENV_FB });
  assert.equal(fb.loi, undefined);
  assert.deepEqual(fb.bai.map((b) => b.link), ["https://fb/p1", "https://fb/p2"]);
  assert.equal(fb.bai[0].chiaSe, 2);
  assert.equal(fb.bai[1].reaction, 5);
  assert.deepEqual(fb.cotInsights.map((c) => c.ma), ["post_impressions_unique", "post_clicks"]);
  assert.equal(fb.ghiChu, "");
});

test("Facebook thiếu read_insights: vẫn có reaction/bình luận/chia sẻ, ghi chú lý do, không fail", async () => {
  const fb = await layFacebook("2026-09", { fetchFn: fbGia({ choInsights: false }), env: ENV_FB });
  assert.equal(fb.bai.length, 2);
  assert.deepEqual(fb.cotInsights, []);
  assert.match(fb.ghiChu, /read_insights/);
  const md = taoMarkdown({ thang: "2026-09", bai: [], facebook: fb, jobs: { loi: "x" } });
  assert.match(md, /\| Reaction \| Bình luận \| Chia sẻ \|/);
  assert.doesNotMatch(md, /Tiếp cận/);
});

test("thiếu secret hoặc token hỏng: báo cáo vẫn ra, chỉ ghi lý do", async () => {
  assert.match((await layFacebook("2026-09", { env: {} })).loi, /Chưa có secret/);
  const hong = async () => ({ ok: false, status: 400, json: async () => ({ error: { message: "Invalid OAuth access token" } }) });
  assert.match((await layFacebook("2026-09", { fetchFn: hong, env: ENV_FB })).loi, /Invalid OAuth/);
});

test("job đăng Facebook: đếm theo tháng giờ VN, liệt kê lần lỗi", async () => {
  const runs = [
    { created_at: "2026-08-31T16:59:00Z", conclusion: "failure" }, // 23:59 31/8 VN — tháng trước
    { created_at: "2026-08-31T17:00:00Z", conclusion: "success" }, // 00:00 1/9 VN
    { created_at: "2026-09-21T16:23:02Z", conclusion: "failure", display_title: "Merge #28", html_url: "https://gh/28" },
    { created_at: "2026-09-26T05:26:00Z", conclusion: "cancelled" },
    { created_at: "2026-09-30T17:00:00Z", conclusion: "success" }, // 00:00 1/10 VN — tháng sau
  ];
  const gia = async () => ({ ok: true, json: async () => ({ workflow_runs: runs }) });
  const j = await layJobs("2026-09", { fetchFn: gia, env: { GITHUB_TOKEN: "t", REPO: "o/r" } });
  assert.equal(j.thanhCong, 1);
  assert.equal(j.khac, 1);
  assert.deepEqual(j.loiDs, [{ ngay: "2026-09-21", ten: "Merge #28", link: "https://gh/28" }]);
});

test("markdown: có đủ các phần, bảng Umami để trống cho người điền", () => {
  const md = taoMarkdown({
    thang: "2026-09",
    bai: [{ ngay: "2026-09-25", title: "Vắc-xin | phòng ung thư", slug: "vac-xin" }],
    facebook: { bai: [], cotInsights: [] },
    jobs: { thanhCong: 3, loiDs: [], khac: 0 },
  });
  for (const phan of ["# Báo cáo tháng 09/2026", "## Nội dung", "## Facebook", "## Job đăng Facebook", "## Umami", "`bam-goi`"]) {
    assert.ok(md.includes(phan), `thiếu: ${phan}`);
  }
  assert.match(md, /3 lần thành công · 0 lần lỗi/);
});
