# Thiết lập workstation mới

Những gì cần có để làm việc với repo này trên một máy mới, kể cả chạy được routine
viết bài tự động.

## 1. Phụ thuộc hệ thống

| Cần | Dùng để làm gì | Cài (Ubuntu/Debian) |
|---|---|---|
| `git` | | `apt install git` |
| Node.js + npm | build Eleventy, **sinh ảnh OG** | nvm hoặc `apt install nodejs npm` |
| `gh` (GitHub CLI) | mở PR | [cli.github.com](https://cli.github.com) → `gh auth login` |
| Claude Desktop / Claude Code | chạy skill + routine | |

Không cần dependency hệ thống nào để tạo ảnh OG. Bước render SVG→PNG chạy trên Node
(`@resvg/resvg-js`, cài sẵn qua `npm install`) và dùng font Be Vietnam Pro nhúng trong
`.claude/skills/bai-kien-thuc/fonts/`, nên ảnh ra **giống nhau trên mọi máy**.

Kiểm tra nhanh:

```bash
for c in git node npm gh; do
  printf "%-14s %s\n" "$c" "$(command -v $c || echo THIẾU)"
done
```

## 2. Lấy repo và kiểm tra build

```bash
git clone https://github.com/jasontruong581/bsquyen.git
cd bsquyen
npm install
npm run build          # phải ghi ra _site/ không lỗi
npm run dev            # xem trước ở localhost
```

## 3. Skill viết bài

Không cần cài gì. Skill nằm **trong repo** ở `.claude/skills/bai-kien-thuc/`, nên
Claude Code tự nhận khi mở phiên làm việc tại thư mục repo. Gọi bằng
`/bai-kien-thuc <chủ đề>` hoặc chỉ cần nói "viết bài Kiến thức về …".

## 4. Routine viết bài tự động

Routine **không nằm trong repo** — nó là scheduled task của Claude Desktop, lưu ở
`~/.claude/scheduled-tasks/viet-bai-kien-thuc-bsquyen/SKILL.md` trên từng máy.

Bản gốc của prompt được giữ trong repo tại **`docs/routine-viet-bai.md`**. Trên máy mới,
mở Claude Code trong repo rồi nói:

> Tạo scheduled task hàng tuần (sáng thứ Hai) từ `docs/routine-viet-bai.md`,
> thay `<ĐƯỜNG-DẪN-REPO>` bằng đường dẫn repo trên máy này.

Không cần copy dotfile giữa các máy.

**Lưu ý về cách routine chạy:**

- Chỉ chạy khi Claude Desktop đang mở. Đến hẹn mà app đóng thì nó chạy vào **lần mở kế
  tiếp** — nên nhịp tuần vẫn giữ được dù máy không bật đúng sáng thứ Hai.
- Chạy trên máy local, không phải cloud. Đây là **lựa chọn có chủ ý**: workflow cần
  `npm` và `gh` đã đăng nhập — cloud agent không có sẵn những thứ này.
- Lần chạy thật đầu tiên trên máy mới có thể hỏi quyền vài tool. Duyệt một lần, các
  lần sau tự áp dụng.
- **Đừng chạy routine trên hai máy cùng lúc.** Cổng chặn dựa trên "có PR bài viết đang
  mở hay không", nên hai máy chạy song song vẫn không tạo 2 PR trùng — nhưng nếu cùng
  khởi động một lúc thì có thể cùng chọn một chủ đề. Chỉ bật routine trên một máy.

## 5. Nếu muốn chạy hoàn toàn không phụ thuộc máy cá nhân

Hướng đúng là **GitHub Actions** thay vì scheduled task: runner chỉ cần Node (pipeline
ảnh OG không còn dependency hệ thống), có `GITHUB_TOKEN` sẵn để mở PR, và chạy theo cron
của GitHub. Đổi lại cần thêm khoá API Claude làm repo secret và chi phí chuyển sang tính
theo API.

Chưa làm, vì workflow này **vốn đã có cổng người duyệt** (bác sĩ đọc PR rồi mới merge),
nên việc bài được viết lúc 9h sáng đúng giờ không mang lại lợi ích gì so với việc nó
được viết khi bạn mở máy.

## 6. Việc đã hoãn có chủ ý

Kích hoạt theo **điều kiện**, không theo mốc ngày:

| Việc | Làm khi | Vì sao chưa làm |
|---|---|---|
| Ô tìm kiếm bài viết | mục Kiến thức **vượt 15 bài** (vượt 1 trang phân trang) | Corpus nhỏ thì phần lớn truy vấn ra 0 kết quả — người đọc hiểu là "trang này không có thứ tôi cần" rồi thoát, tệ hơn một danh sách ngắn cuộn được |
| Đưa 6 trang lọc chủ đề vào `sitemap.njk` | mỗi chủ đề đạt **~4 bài** | Hiện 1–3 bài/chủ đề, còn mỏng. Vẫn crawl được qua link chip |
| Nâng 4 bài tầm soát thành bài trụ cột | đạt **25–30 bài** | Giá trị của pillar là làm trung tâm cho chùm bài vệ tinh; chưa có vệ tinh thì kéo dài bài chỉ làm loãng nội dung |

Khi làm ô tìm kiếm, hai bẫy phải tránh:

1. **Bỏ dấu hai đầu khi so khớp** (NFD + strip dấu + lowercase). Người Việt gõ
   "ung thu da day" phải khớp "ung thư dạ dày". Thiếu bước này thì search coi như không dùng được.
2. **Tìm trên JSON index sinh lúc build, KHÔNG lọc DOM.** Trang danh sách phân trang
   15 bài/trang; lọc DOM chỉ lọc được trang hiện tại → sai âm thầm, càng nhiều bài càng sai.

Chỉ cần index `title` + `description` + `tags` (~10KB gzip ở 100 bài), không index nội dung
bài. Muốn tìm cả trong nội dung về sau thì thay bằng Pagefind, không phải đổi UI.
