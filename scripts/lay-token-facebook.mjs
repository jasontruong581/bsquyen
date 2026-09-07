#!/usr/bin/env node
// Lấy Page Access Token vĩnh viễn cho job đăng Facebook, rồi nạp thẳng vào GitHub Secrets.
//
//   node scripts/lay-token-facebook.mjs
//
// Hỏi 3 thứ (hoặc đọc từ env FB_APP_ID / FB_APP_SECRET / FB_USER_TOKEN):
//   App ID, App Secret          — Meta app → Settings → Basic
//   Short-lived user token      — Graph API Explorer, cấp pages_show_list +
//                                 pages_manage_posts + pages_read_engagement
//
// Rồi tự làm phần dễ sai:
//   1. đổi short-lived user token → long-lived user token
//   2. GET /me/accounts → lấy Page Access Token của đúng page
//   3. debug_token → xác nhận token KHÔNG có hạn dùng
//   4. gh secret set FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN (token đi qua stdin, không in ra)
//
// Token không bao giờ hiện trên màn hình trừ khi chạy với --chi-in.
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const API = `https://graph.facebook.com/${process.env.FB_API_VERSION || "v26.0"}`;
const chiIn = process.argv.includes("--chi-in");

// Ném lỗi rồi để event loop cạn tự nhiên, thay vì process.exit(): trên Windows,
// exit cưỡng bức lúc stdin còn mở làm libuv bắn assertion ngay sau thông báo lỗi.
class LoiDung extends Error {}
const chet = (msg) => {
  throw new LoiDung(msg);
};

/** Hỏi một giá trị; che khi gõ nếu là bí mật. Bỏ qua nếu env đã có. */
async function hoi(nhan, bien, che) {
  if (process.env[bien]) {
    console.log(`${nhan}: (lấy từ env ${bien})`);
    return process.env[bien].trim();
  }
  if (!stdin.isTTY) chet(`Thiếu env ${bien} — chạy script trong terminal để nhập tay.`);

  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  if (che) {
    // Nuốt ký tự vừa gõ để token không nằm lại trên màn hình.
    rl._writeToOutput = (s) => {
      if (!s.includes(nhan)) return;
      rl.output.write(s);
    };
  }
  const giaTri = (await rl.question(`${nhan}: `)).trim();
  rl.close();
  if (che) stdout.write("\n");
  if (!giaTri) chet(`${nhan} để trống.`);
  return giaTri;
}

async function goi(duongDan, mota) {
  const res = await fetch(`${API}/${duongDan}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) chet(`${mota} thất bại:\n${JSON.stringify(json, null, 2)}`);
  return json;
}

function datSecret(ten, giaTri) {
  const kq = spawnSync("gh", ["secret", "set", ten], { input: giaTri, encoding: "utf8" });
  if (kq.error?.code === "ENOENT") {
    chet(
      "Không thấy lệnh `gh`. Cài GitHub CLI rồi chạy lại,\n" +
        "  hoặc chạy `node scripts/lay-token-facebook.mjs --chi-in` để in token ra và tự dán vào\n" +
        "  Settings → Secrets and variables → Actions."
    );
  }
  if (kq.status !== 0) chet(`gh secret set ${ten} lỗi:\n${kq.stderr || kq.stdout}`);
  console.log(`  ✓ Đã nạp secret ${ten}`);
}

async function main() {
  console.log("Lấy Page Access Token vĩnh viễn cho job đăng Facebook.\n");

  const appId = await hoi("App ID", "FB_APP_ID", false);
  const appSecret = await hoi("App Secret", "FB_APP_SECRET", true);
  const userTokenNgan = await hoi("Short-lived user token", "FB_USER_TOKEN", true);

  console.log("\n[1/4] Đổi sang long-lived user token…");
  const doi = await goi(
    `oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&fb_exchange_token=${encodeURIComponent(userTokenNgan)}`,
    "Đổi token"
  );
  const userTokenDai = doi.access_token;

  console.log("[2/4] Đọc danh sách page…");
  const dsPage = await goi(
    `me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(userTokenDai)}`,
    "Gọi /me/accounts"
  );
  const pages = dsPage.data || [];
  if (!pages.length) {
    chet(
      "Tài khoản không quản lý page nào mà app này thấy được.\n" +
        "  Kiểm tra: user token đã cấp quyền `pages_show_list` chưa, và lúc đăng nhập\n" +
        "  đã tick chọn đúng page chưa."
    );
  }

  let page = pages[0];
  if (pages.length > 1) {
    console.log("\nCác page tài khoản này quản lý:");
    pages.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}  (id ${p.id})`));
    const chon = Number(await hoi("Chọn số thứ tự page cần đăng", "FB_PAGE_CHON", false));
    if (!pages[chon - 1]) chet("Số thứ tự không hợp lệ.");
    page = pages[chon - 1];
  }
  console.log(`\nPage đã chọn: ${page.name}  (id ${page.id})`);

  console.log("[3/4] Kiểm tra hạn dùng của Page Access Token…");
  const debug = await goi(
    `debug_token?input_token=${encodeURIComponent(page.access_token)}` +
      `&access_token=${appId}|${encodeURIComponent(appSecret)}`,
    "debug_token"
  );
  const hetHan = debug.data?.expires_at;
  if (hetHan !== 0) {
    // Đây là lỗi hay gặp nhất: lỡ lấy page token từ user token ngắn hạn.
    const luc = hetHan ? new Date(hetHan * 1000).toLocaleString("vi-VN") : "không rõ";
    chet(
      `Token này CÓ hạn dùng (${luc}) — job sẽ chết khi tới hạn.\n` +
        "  Nguyên nhân gần như luôn là: user token nhập vào đã là token cũ/đã đổi rồi.\n" +
        "  Lấy một short-lived user token MỚI từ Graph API Explorer rồi chạy lại."
    );
  }
  console.log("  ✓ Token không có hạn dùng");

  const quyen = debug.data?.scopes || [];
  for (const can of ["pages_manage_posts", "pages_read_engagement"]) {
    if (!quyen.includes(can)) console.warn(`  ⚠ Token thiếu quyền ${can} — job sẽ lỗi khi đăng.`);
  }

  if (chiIn) {
    console.log("\n[4/4] In ra để tự dán vào GitHub Secrets:\n");
    console.log(`FB_PAGE_ID=${page.id}`);
    console.log(`FB_PAGE_ACCESS_TOKEN=${page.access_token}`);
    console.log("\n⚠ Token vừa in nằm trong lịch sử terminal — xoá màn hình sau khi dán.");
    return;
  }

  console.log("[4/4] Nạp vào GitHub Secrets…");
  datSecret("FB_PAGE_ID", page.id);
  datSecret("FB_PAGE_ACCESS_TOKEN", page.access_token);

  console.log(
    "\nXong. Chạy thử: Actions → Đăng bài mới lên Facebook → Run workflow,\n" +
      "nhập slug một bài cũ và TẮT dry_run. Bài sẽ nằm ở mục Đã lên lịch trong\n" +
      "Business Suite — vào huỷ là xong, không có gì lên page."
  );
}

try {
  await main();
} catch (e) {
  console.error(`\n✖ ${e instanceof LoiDung ? e.message : e.stack}`);
  process.exitCode = 1;
}
