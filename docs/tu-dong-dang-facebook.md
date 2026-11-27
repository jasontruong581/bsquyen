# Tự động đăng bài Kiến thức lên Facebook Page

Khi một PR bài viết được merge vào `main`, GitHub Actions đăng bài đó lên Facebook Page
dưới dạng **bài ảnh hẹn giờ lúc 19:30 (giờ Việt Nam) cùng ngày merge**. Merge sau 19:20
thì bài dời sang 19:30 hôm sau — Facebook đòi giờ hẹn cách hiện tại ít nhất 10 phút, và
giữ giờ đăng cố định có lợi hơn là đăng lệch giờ. Trước giờ đăng bạn sửa, đổi giờ hoặc huỷ
được trong Meta Business Suite; không làm gì thì bài tự lên.

- Workflow: `.github/workflows/dang-facebook.yml`
- Script: `scripts/dang-facebook.mjs`
- Caption: field `facebook:` trong frontmatter bài viết — bác sĩ duyệt cùng lúc duyệt bài

## Job chạy khi nào

Chỉ khi có file `kien-thuc/*.md` **được thêm mới** ở commit đẩy lên `main`
(`git diff --diff-filter=A`). Sửa một bài đã có **không** làm bài đăng lại.

Chạy tay được: tab **Actions → Đăng bài mới lên Facebook → Run workflow**, nhập `slug`
và chọn `dry_run`. Mặc định `dry_run` bật, phải tự tắt mới đăng thật.

## Chuẩn bị một lần

Cần đúng hai secret trong repo: `FB_PAGE_ID` và `FB_PAGE_ACCESS_TOKEN`.

### 1. Page ID

Page: **Hiểu Đúng Y Khoa**, Page ID **`1326029250593644`**
(Meta Business Suite → Cài đặt → Trang cá nhân → chọn page → *ID Trang*).

⚠️ **Đừng lấy số trong URL `facebook.com/profile.php?id=...`.** Page tạo theo New Pages
Experience hiện URL kèm một ID khác (ở đây là `61594348400419`) — đó không phải ID mà
Graph API dùng. Số đúng là số Business Suite gọi là *ID Trang*, và `GET /me/accounts`
trả về đúng số đó.

Script `lay-token-facebook.mjs` ở mục dưới tự đọc ID từ `/me/accounts`, nên cách chắc
chắn nhất là để nó điền hộ thay vì chép tay.

### 2. Tạo Meta app

1. Vào <https://developers.facebook.com/apps> → **Create App** → loại **Business**
2. Thêm sản phẩm **Facebook Login**
3. **Publish app sang chế độ Live** (Developer Dashboard → mục *Đăng* / Publish; Meta đòi
   Privacy Policy URL và Category trước)

⚠️ **App phải Live, không để Development.** Bài đăng qua app đang ở Development chỉ hiện
với người có vai trò trong app (admin/developer/tester); người ngoài không thấy dù bài
vẫn nằm trên page. Gặp thật: cả loạt bài đầu tiên lên page mà không ai xem được.

**Không cần App Review** để đăng lên chính page của bạn: App Review chỉ bắt buộc khi
*người khác* cấp quyền cho app. Chuyển Live không phải qua duyệt.

*(Meta thỉnh thoảng đòi Business Verification cho một số quyền. Nếu bị chặn ở bước 3 thì
làm xác minh doanh nghiệp trong Business Manager rồi quay lại.)*

### 3. Lấy Page Access Token vĩnh viễn

Vào **Graph API Explorer** (<https://developers.facebook.com/tools/explorer>):

1. Chọn app vừa tạo, chọn **User Token**, cấp **ba** quyền:
   `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`

   Thiếu `pages_show_list` thì bước sau trả về danh sách page **rỗng** dù bạn là admin
   của page. Lỗi này không có thông báo gì — chỉ là không thấy page nào.

   Nên thêm quyền thứ tư **`read_insights`** (không bắt buộc để đăng): có nó thì báo cáo
   tháng có thêm lượt tiếp cận và lượt bấm vào bài — xem `bao-cao-thang.md`. Nhớ thêm quyền
   này vào use case của app trước (nút **+ Thêm**), không thì Explorer lặng lẽ bỏ nó đi.
   Đừng thêm `pages_manage_engagement`: nó kéo theo `pages_read_user_content` và làm hộp
   thoại báo lỗi *Invalid Scopes*.

2. **Generate Access Token** → đăng nhập → **tick chọn đúng page** trong hộp thoại
3. Copy token vừa hiện ra. Đây là *short-lived user token*, sống 1–2 giờ — đủ cho bước 4.

### 4. Đổi thành Page Access Token vĩnh viễn

Ba bước còn lại (đổi sang long-lived, tìm đúng page, kiểm tra hạn dùng) đều dễ sai, nên
có script làm hộ:

```bash
node scripts/lay-token-facebook.mjs
```

Script hỏi **App ID**, **App Secret** (Meta app → Settings → Basic) và **short-lived user
token** vừa lấy, rồi:

1. đổi short-lived → long-lived user token
2. gọi `/me/accounts`, cho bạn chọn page, lấy Page Access Token của page đó
3. gọi `debug_token` xác nhận token **không có hạn dùng** — sai là nó dừng và báo, chứ
   không để bạn nạp nhầm một token sẽ chết sau vài giờ
4. `gh secret set FB_PAGE_ID` và `FB_PAGE_ACCESS_TOKEN`

Token đi qua stdin sang `gh`, **không in ra màn hình** và không nằm lại trong lịch sử
terminal. Không có `gh` thì chạy `node scripts/lay-token-facebook.mjs --chi-in` để in ra
rồi tự dán vào **Settings → Secrets and variables → Actions**.

> ⚠️ Token là mật khẩu của page. **Đừng dán vào chat, commit, hay PR.**

Điểm mấu chốt script đang bảo vệ bạn: Page Access Token chỉ **vĩnh viễn** khi được dẫn
xuất từ một user token **long-lived**. Lấy từ short-lived thì page token cũng chết theo
sau vài giờ — đây là lý do phổ biến nhất khiến job đang chạy tốt bỗng hỏng, và nhìn bằng
mắt thì hai token trông y hệt nhau.

Muốn tự kiểm bất cứ lúc nào: <https://developers.facebook.com/tools/debug/accesstoken> —
ô **Expires** phải ghi *Never*.

## Chạy thử trước khi dùng thật

```bash
node scripts/dang-facebook.mjs --slug=tam-soat-ung-thu-vu --dry-run
```

In ra caption hoàn chỉnh (đã nối link + hashtag) và kiểm tra URL bài/ảnh có live chưa,
**không gọi Facebook**. Chạy được kể cả khi chưa có token.

Khi đã nạp secret, chạy `Run workflow` với `dry_run` tắt trên một bài cũ để kiểm tra
đường đi thật. Bài sẽ nằm ở mục *Đã lên lịch* — vào Business Suite huỷ là xong, không
có gì lên page.

## Đăng lại bài cũ theo lịch tự đặt

Run workflow có thêm ô `gio_hen` (giờ VN, dạng `2026-11-09 19:30`). Có ô này thì bài hẹn
đúng thời điểm đó, thay cho 19:30 hôm nay; giờ đã qua hoặc cách dưới 10 phút thì job báo
lỗi, không tự dời. Mỗi lần chạy một bài, nên đăng lại nhiều bài thì chạy mỗi bài một lần
với `gio_hen` cách nhau theo ý muốn (vd 2 ngày/bài).

Facebook từ chối giờ hẹn quá xa (`(#100) The specified scheduled publish time is invalid`).
Đo thực tế: hẹn được khi còn cách ≤ 28 ngày 19 giờ, bị từ chối ở 29 ngày 23 giờ — chặt hơn
con số 30 ngày trong tài liệu Meta. Nên chỉ hẹn bài còn cách **tối đa 28 ngày**, bài xa hơn
thì hẹn bù sau. Lần bị từ chối chỉ để lại ảnh chưa đăng, không tạo bài, chạy lại an toàn.

## Caption được ghép thế nào

```
<field `facebook:` trong frontmatter, đã gộp dòng gãy thành đoạn liền>

<link bài>

<hashtag suy từ `tags`>
```

**Bài đăng không nêu tên bác sĩ** — không hashtag tên, không chữ trên ảnh. Page mang
thương hiệu riêng "Hiểu Đúng Y Khoa". Ràng buộc này cho caption nằm trong skill
`bai-kien-thuc`, mục Caption Facebook.

Frontmatter **chỉ chứa phần chữ**. Link và hashtag nối lúc đăng, vì:

- link gõ tay trong frontmatter nghĩa là đổi domain phải sửa 50–100 file bài viết
- hashtag suy từ `tags` thì luôn nhất quán, không lệch dần theo thời gian

Nguồn hard-wrap ~76 ký tự theo quy ước repo; script tự gộp các dòng gãy lại thành đoạn,
chỉ giữ ngắt đoạn ở chỗ có dòng trống. Nhờ vậy caption trên Facebook không bị câu cụt.

Caption và bảng hashtag dựng ở `scripts/caption-facebook.mjs` — dùng chung với bot tóm tắt
duyệt PR, nên caption bác sĩ đọc trên PR đúng từng chữ với caption được đăng. Bảng hashtag khớp 6 tag cố định ở `_data/chuDe.js`.
Tag lạ bị bỏ qua kèm cảnh báo, không làm job fail.

## Khi có sự cố

Job fail thì GitHub gửi mail cho chủ repo. Log ở tab **Actions**.

| Triệu chứng | Nguyên nhân thường gặp |
|---|---|
| `thiếu field facebook` | Bài merge mà quên caption. Bài vẫn lên web. Bổ sung `facebook:` rồi Run workflow với slug đó. |
| `Thiếu assets/kien-thuc/<slug>-fb.png` | Bài merge mà quên ảnh Facebook. Tạo bằng lệnh in trong log, merge, rồi Run workflow với slug đó. Cố ý không dùng ảnh OG thay thế vì ảnh OG có tên bác sĩ. |
| `Token hoặc Page ID không dùng được` | Token hết hạn hoặc bị thu hồi (đổi mật khẩu Facebook, gỡ app). Lấy lại token theo bước 3. |
| `không lên sau 5 phút` | Vercel deploy fail hoặc quá chậm. Kiểm tra deploy, rồi Run workflow lại với slug đó. |
| Lỗi nhắc tới version | Phiên bản Graph API hết hạn ~2 năm sau khi ra. Đang pin `v26.0` (ra 29/07/2026). Đổi `FB_API_VERSION` trong workflow theo <https://developers.facebook.com/docs/graph-api/changelog>. |
| `/me/accounts` không thấy page nào | User token thiếu `pages_show_list`, hoặc lúc đăng nhập chưa tick chọn page. Lấy lại token từ bước 3. |
| `Token thiếu quyền pages_manage_posts` | App chưa bật quyền trong use case *Quản lý mọi thứ trên Trang* (Explorer vẫn tạo token, chỉ lặng lẽ bỏ quyền đó), hoặc bị bỏ tick trong hộp thoại đăng nhập. Bật quyền, lấy token mới, chạy lại script — secret mới ghi đè secret cũ. |

| `Missing or invalid image file` (code 324, `is_transient: true`) | Facebook lấy ảnh hụt ngay sau lúc deploy, dù ảnh vẫn tải được. Bước tải ảnh tự thử lại 3 lần, cách 30 giây; vẫn lỗi thì Run workflow lại với slug đó. |

Job **không** tự chạy lại cả lượt. Cố ý: đăng nhầm hai lần lên page tệ hơn là đăng trễ.
Riêng bước tải ảnh (ảnh ở trạng thái chưa đăng) được thử lại khi Facebook báo lỗi tạm
thời, vì lặp bước đó không thể làm bài lên page hai lần.

## Bảo trì

- **Đổi domain sang bsquyen.com**: sửa `SITE_URL` trong `.github/workflows/dang-facebook.yml`.
  Đã có trong checklist đổi domain ở `website-placeholders-and-deploy-guide.md`.
- **Đổi giờ đăng**: `GIO_DANG` trong workflow, dạng `HH:MM` theo giờ Việt Nam. Để trống
  (`GIO_DANG: ""`) thì chuyển sang chế độ đăng sau `DELAY_PHUT` phút kể từ lúc merge
  (≥ 10). Logic tính giờ nằm ở `scripts/gio-dang.mjs`; máy chạy Actions ở UTC nên giờ
  luôn quy đổi theo UTC+7 cố định, không phụ thuộc múi giờ của máy.
- **Ảnh đăng lên** là `assets/kien-thuc/<slug>-fb.png`, vuông 1080×1080 cho feed điện
  thoại, tạo bằng `.claude/skills/bai-kien-thuc/scripts/tao-anh-facebook.mjs`. Ảnh dùng
  hình minh họa của chính bài (field `thumb`) nên mỗi bài một hình. Ảnh OG 1200×630 vẫn
  dùng cho website (thẻ preview khi share link), không đăng lên page.

## Đăng Reels

Bài đăng ảnh gần như không có lượt xem, nên video dọc từ bài Kiến thức được đăng thành
**Reel hẹn giờ lúc 19:30 (giờ Việt Nam)**, cùng quy tắc giờ như bài ảnh (merge sau 19:20
thì dời sang hôm sau; module dùng chung `scripts/gio-dang.mjs`). Pipeline dựng video nằm
ở `video/`; phần này chỉ nói về khâu đăng.

- Workflow đăng: `.github/workflows/dang-reel.yml` · Script: `scripts/dang-reel.mjs`
- Workflow bình luận: `.github/workflows/binh-luan-reel.yml` · Script: `scripts/binh-luan-reel.mjs`
- Tải mp4 lên Release (chạy ở máy local): `scripts/tai-video-len-release.mjs`
- Logic thuần (dò video mới, tra video theo slug/id, caption, bình luận, ghép Reel với bài): `scripts/reel-logic.mjs`, có test

### Quy ước thư mục video

Mỗi video một thư mục `video/V001 - YYYY-MM-DD - <slug>/` (tên **có dấu cách**), ví dụ
`video/V001 - 2026-11-25 - hp-va-da-day/`. Trong đó:

- `post.json` = `{"id": "V001", "slug": "hp-va-da-day", "article": "...", "caption": "..."}`
  (`article` là slug bài Kiến thức tương ứng, **tùy chọn**: video không gắn bài, như series
  3D về cơ thể, bỏ trường này — xem *Caption và bình luận*). **`id` và `slug` lấy từ nội dung
  post.json, không suy từ tên thư mục**; thư mục chỉ để người đọc.
- `post.json` còn nhận trường tùy chọn `"ngay_dang": "YYYY-MM-DD"` — xem mục *Hẹn ngày đăng* dưới đây.
- mp4 render ở local nằm tại `<thư mục>/out/<slug>.mp4`.
- Release vẫn là tag `video-<slug>`, asset `<slug>.mp4`.

Mọi chỗ cần chỉ định một video (`--slug=`, input `slug` của workflow, tham số của
`tai-video-len-release.mjs`) nhận **slug** (`hp-va-da-day`) hoặc **id** (`V001`) và tìm thư
mục bằng cách quét `video/*/post.json`.

### Hẹn ngày đăng (`ngay_dang`)

Muốn đăng đều (vd 3 ngày một video) thì chuẩn bị video trước, merge PR lúc nào cũng được
và Reel vẫn lên đúng ngày: thêm vào `post.json`

```json
{"id": "V003", "slug": "...", "article": "...", "caption": "...", "ngay_dang": "2026-12-04"}
```

Reel được hẹn **19:30 (giờ VN, theo `GIO_DANG`) ngày `ngay_dang`**. Thứ tự ưu tiên khi chọn giờ:

1. Ô `gio_hen` của Run workflow (giờ riêng, `YYYY-MM-DD HH:MM`).
2. `ngay_dang` trong `post.json`.
3. Quy tắc cũ: 19:30 cùng ngày merge, merge sau 19:20 thì dời sang hôm sau.

Kiểm tra (logic ở `tinhGioDangReel` trong `scripts/reel-logic.mjs`, dùng lại `scripts/gio-dang.mjs`):

| Trường hợp | Kết quả |
|---|---|
| Sai dạng / ngày không có thật (`01/12/2026`, `2026-02-30`) | Job **dừng**, báo rõ lỗi `ngay_dang` |
| 19:30 ngày đó đã qua, hoặc còn dưới 10 phút | **Không lỗi**: dùng quy tắc cũ (19:30 gần nhất hợp lệ) và in cảnh báo `⚠` trong log |
| Xa hơn 28 ngày kể từ lúc job chạy (giới hạn hẹn giờ của Facebook, xem mục đăng lại bài cũ) | Job **dừng**, báo rõ; merge muộn hơn hoặc chọn ngày gần hơn |

Ví dụ lịch 3 ngày/video, ba video chuẩn bị xong cùng lúc:

| Video | `ngay_dang` | Reel lên lúc |
|---|---|---|
| V010 | `2026-12-01` | 19:30 01/12 |
| V011 | `2026-12-04` | 19:30 04/12 |
| V012 | `2026-12-07` | 19:30 07/12 |

Lưu ý: merge trễ quá ngày hẹn thì Reel không còn đúng ngày (rơi về quy tắc cũ, có cảnh báo);
mỗi video nằm trong PR riêng nên nên merge trước ngày hẹn vài ngày. Dry-run
(`node scripts/dang-reel.mjs --slug=<slug|V001> --dry-run`) in dòng
`Lịch đăng: … — nguồn: gio_hen | ngay_dang | mặc định` để biết giờ cuối cùng đến từ đâu.

### Luồng mỗi video

```
render ──► node scripts/tai-video-len-release.mjs <slug|V001> ──► PR video ──► merge ──► Reel hẹn 19:30 ──► bình luận link bài
           (Release video-<slug>, asset <slug>.mp4)             (video/<V001 - ... - slug>/post.json)
```

1. Render ra `video/<thư mục>/out/<slug>.mp4`.
2. `node scripts/tai-video-len-release.mjs <slug|V001>`: tạo (hoặc ghi đè, `--clobber`) Release
   `video-<slug>` kèm file `<slug>.mp4`. **Làm bước này trước khi merge**: mp4 không nằm
   trong git, job đăng tải nó từ Release.
3. Mở PR có `video/<thư mục>/post.json` như trên. Chủ kênh duyệt, **merge = xuất bản**.
4. Job **Đăng Reel Kiến thức lên Facebook** chạy khi `video/*/post.json` được **thêm mới**
   vào `main` (sửa post.json cũ không đăng lại), tải mp4 từ Release và hẹn Reel.
   Trước giờ đăng, sửa/đổi giờ/huỷ được trong Meta Business Suite → Nội dung → Đã lên lịch.
5. Sau giờ đăng, job **Bình luận link bài lên Reel của Page** đăng bình luận đầu tiên.

Chạy tay: **Actions → Đăng Reel Kiến thức lên Facebook → Run workflow**, nhập `slug` (slug
hoặc id như `V001`; và `gio_hen` dạng `2026-12-01 19:30` nếu muốn giờ riêng); mặc định
`dry_run` bật. Thử ở máy: `node scripts/dang-reel.mjs --slug=<slug|V001> --dry-run` (có thể
đặt `GIO_DANG=19:30` để giờ hiện ra giống workflow) — in caption, giờ hẹn, nội dung bình
luận, không tải video và không gọi Facebook.

### Video dài hơn 90 giây

API Reels (`/video_reels`) chỉ nhận video 3–90 giây. Job **đo thời lượng từ chính mp4**
(hộp `moov/mvhd`, hàm `thoiLuongMp4` trong `scripts/reel-logic.mjs`, không cần ffprobe) rồi chọn đường đăng:

| Thời lượng | Đường đăng |
|---|---|
| ≤ 90,0 s | `/video_reels` như cũ |
| > 90,0 s | `POST graph-video.facebook.com/<ver>/<page-id>/videos`: chunked upload (`upload_phase` start → transfer → finish), finish kèm `description` = caption, `published=false`, `unpublished_content_type=SCHEDULED`, `scheduled_publish_time` |

Giờ hẹn tính y hệt Reel (`gio_hen` > `ngay_dang` > 19:30, giới hạn 28 ngày). Từ 6/2025
Facebook hiển thị video dọc của Page như Reel nên bài vẫn ra dạng Reel trên feed. Dry-run in
thời lượng và đường đăng nếu mp4 đã có ở `video/<thư mục>/out/<slug>.mp4` trên máy; chưa có
thì chỉ báo ngưỡng (job thật mới tải Release và đo). Tên tham số lấy theo tài liệu Graph API
`/{page-id}/videos`; chưa đăng thử video dài thật, nên lần đầu hãy hẹn rồi kiểm tra trong
Meta Business Suite → Đã lên lịch. Job bình luận đọc thêm `/<page-id>/videos` để thấy video
đăng theo đường này.

### Caption và bình luận

- **Caption** = `caption` trong post.json (gộp dòng gãy như bài ảnh) + hashtag suy từ `tags`
  của bài `kien-thuc/<article>.md`, qua bảng hashtag ở `scripts/caption-facebook.mjs`.
  Video không có `article` dùng hashtag mặc định `#HieuDungYKhoa`.
  **Không có link**, không nêu tên bác sĩ.
- **Link bài** đi vào bình luận đầu tiên của Page:
  `Xem bài viết đầy đủ: <SITE_URL>/kien-thuc/<article>/?utm_source=facebook&utm_medium=reel`.
  Không có `article` thì bình luận trỏ về trang Kiến thức chung:
  `Thêm kiến thức dễ hiểu về cơ thể: <SITE_URL>/kien-thuc/?utm_source=facebook&utm_medium=reel`.
- Reel đang hẹn giờ chưa công khai nên chưa có chỗ bình luận; repo videobds cũng chỉ bình
  luận lên Reel đã công khai. Vì vậy bình luận do job riêng làm **sau** giờ đăng, theo cách
  đã chạy ở videobds: chạy lúc 20:20 và 22:20
  giờ VN, bù 08:20 hôm sau. Job ghép Reel với `video/<thư mục>/post.json` bằng phần chữ của
  caption và bỏ qua Reel đã có bình luận của Page, nên chạy lại không bình luận lặp; Reel
  không khớp video nào thì không đụng tới.
- Job bình luận **chỉ chạy theo lịch khi biến repo `BINH_LUAN_REEL` = `on`** (Settings →
  Secrets and variables → Actions → Variables). Chạy tay luôn được, `dry_run` mặc định bật.
  Tới khi bật biến này, link bài phải đăng bằng tay hoặc chạy tay job sau giờ đăng.

### Quyền token cho Reels

- **Đăng Reel** (`/video_reels`): dùng đúng ba quyền đã có ở bước 3 phía trên
  (`pages_show_list`, `pages_manage_posts`, `pages_read_engagement`) — repo videobds đăng Reel
  thật với bộ quyền này. Không cần cấp lại token.
- **Bình luận** từ Page cần thêm **`pages_manage_engagement`**. Cảnh báo ở bước 3 (thêm quyền
  này trực tiếp trong Explorer làm hộp thoại báo *Invalid Scopes*) vẫn đúng với cách thêm đó;
  videobds đã cấp được bằng cách bật quyền trong use case *Quản lý mọi thứ trên Trang* của
  app rồi chạy lại `node scripts/lay-token-facebook.mjs` để ghi đè secret
  `FB_PAGE_ACCESS_TOKEN`. Chưa thử với app của page này. Chưa cấp thì job đăng Reel vẫn chạy
  bình thường; chỉ job bình luận báo thiếu quyền (mã 10/200/283), và
  `lay-token-facebook.mjs` hiện chỉ kiểm hai quyền `pages_manage_posts`, `pages_read_engagement`
  nên sẽ không báo thiếu quyền này.
- Graph API dùng cùng `FB_API_VERSION` (`v26.0`) với job bài ảnh — đổi version thì đổi cả
  ba workflow (`dang-facebook.yml`, `dang-reel.yml`, `binh-luan-reel.yml`). Đổi domain thì
  sửa `SITE_URL` ở `dang-facebook.yml`, `dang-reel.yml`, `binh-luan-reel.yml`.

### Khi có sự cố (Reels)

Job không tự chạy lại: đăng nhầm hai lần tệ hơn đăng trễ. Trước khi chạy lại sau lỗi, xem
danh sách bài đang hẹn giờ mà job in ra ở đầu log (hoặc Business Suite → Đã lên lịch) để
chắc Reel chưa lên lịch.

| Triệu chứng | Nguyên nhân thường gặp |
|---|---|
| `Không tải được release video-<slug>` / `không có file <slug>.mp4` | Chưa chạy `tai-video-len-release.mjs`, hoặc tên asset khác `<slug>.mp4`. Tải lên rồi Run workflow với slug đó. |
| `post.json chưa đạt` | Thiếu/sai `id`, `slug`, `article` hoặc `caption`. Sửa trên `main` rồi Run workflow với slug hoặc id. |
| `trỏ tới bài "…" nhưng không thấy kien-thuc/….md` | `article` sai hoặc bài chưa merge. |
| `video_status=error` / `publish_status=error` | Facebook từ chối file (Reel chỉ nhận 9:16, 3–90 giây, codec/âm thanh hợp lệ). Log in nguyên văn lý do. |
| `Token hoặc Page ID không dùng được` | Như bài ảnh: lấy lại token theo bước 3–4. |
| Lỗi giờ hẹn | Giờ hẹn phải cách hiện tại ≥ 10 phút và không quá ~28 ngày (đo thực tế, xem mục đăng lại bài cũ). |
| Reel lên rồi mà không có bình luận | Chưa bật `BINH_LUAN_REEL`, token thiếu `pages_manage_engagement`, hoặc caption trên Facebook đã bị sửa nên không còn khớp post.json. Chạy tay job bình luận (dry run trước). |
