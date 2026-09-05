---
name: bai-kien-thuc
description: Viết bài mới cho mục Kiến thức của website BS.CKI Hạnh Quyên (kien-thuc/*.md) — đúng cấu trúc, văn phong và ràng buộc YMYL của các bài đã publish. Dùng khi user yêu cầu viết/thêm bài Kiến thức, bài y khoa cho bệnh nhân về ung bướu, tầm soát ung thư, chăm sóc giảm nhẹ, hoặc nói "viết bài về <chủ đề>" trong repo này. Thay thế /ckm:write:good cho việc này (rẻ hơn ~4 lần).
---

# Viết bài Kiến thức — bsquyen

Skill này thay `/ckm:write:good` cho repo này. `ckm:write:good` tốn >120k token/bài
vì fan-out researcher + planner + copywriter. Khuôn mẫu bài đã ổn định và được
mã hoá sẵn ở đây, nên không cần khám phá lại.

**Ngân sách mục tiêu: 30–40k token/bài** (đo thực tế bài đầu: ~35k). Vượt mức này
nhiều thì xem lại quy trình. Nhưng **đừng cắt việc xác minh số liệu y khoa để về
dưới ngân sách** — thà tốn thêm vài nghìn token còn hơn đăng con số không có nguồn.

## Nguyên tắc tiết kiệm (đọc trước khi làm gì khác)

- **KHÔNG spawn subagent** (researcher/planner/copywriter/content-creator). Viết trực tiếp.
- **KHÔNG đọc lại các bài cũ** để học văn phong — khuôn mẫu đã ở trong file này và
  `templates/bai-viet.md`. Chỉ đọc 1 bài cũ khi cần đối chiếu một chi tiết cụ thể.
- **KHÔNG tra web tràn lan.** Dùng kiến thức y khoa có sẵn cho phần khung và các
  dữ kiện chuẩn mực. Chỉ tra web (tối đa 2–3 lần) khi cần: con số dịch tễ sẽ trích
  dẫn, hoặc mốc tuổi/khoảng cách tầm soát của một hướng dẫn cụ thể. Bài không cần
  nhiều số — xem "Văn phong" bên dưới.
- **Dùng script + template** cho ảnh OG, đừng viết SVG 1200×630 bằng tay.
- Render SVG→PNG chỉ qua script trong `scripts/` — chúng nạp Be Vietnam Pro nhúng
  trong `fonts/` và tắt font hệ thống, nên ảnh ra giống nhau trên mọi máy.
- Ảnh minh họa: chép biến thể từ `references/minh-hoa.md` (đã có palette + layout sẵn),
  render kiểm tra **một lần**, chỉ sửa nếu thật sự sai.

## Quy trình

### 1. Chốt chủ đề & slug (~1k token)

```bash
ls kien-thuc/            # tránh trùng chủ đề đã có
date +%F                 # ngày cho frontmatter
```

Slug kebab-case, không dấu, mô tả chủ đề: `tam-soat-ung-thu-vu`, `dinh-duong-khi-hoa-tri`.

### 2. Chọn khung bài theo loại (~0 token)

Ba loại bài đã có trên site, chọn 1 rồi theo đúng menu section:

**A. Bài tầm soát** (`tam-soat-*`) — xem `templates/bai-viet.md`
1. Lead (không heading) — thực trạng ở VN + vì sao phát hiện sớm đổi khác cục diện
2. `<figure>` ảnh 1
3. `## Vì sao nên tầm soát dù chưa có triệu chứng?` — 3 bullet, mỗi bullet mở bằng **cụm in đậm**
4. `## Yếu tố nguy cơ chính` (nếu có yếu tố xử lý được, vd HP, HPV) — đặt trước phần "ai nên"
5. `## Ai nên tầm soát và từ tuổi nào?` — mốc tuổi in đậm + bullet nhóm nguy cơ cao
6. `<figure>` ảnh 2 (thẻ 3 cột)
7. `## Tầm soát bằng cách nào?` + `###` cho từng phương pháp; kèm đoạn trấn an về nỗi sợ thủ thuật
8. `## Phòng ngừa: những việc bạn chủ động làm được` — bullet
9. `## Dấu hiệu cần đi khám ngay — không đợi tầm soát` — bullet + **đoạn cảnh báo ngược bắt buộc** (xem Văn phong)
10. Blockquote kết

**B. Bài giải thích khái niệm / gỡ hiểu lầm** (vd `cham-soc-giam-nhe-la-gi`)
1. Lead — mở bằng câu bệnh nhân/gia đình thường nói, trong ngoặc kép
2. `## <Khái niệm> là gì?` — định nghĩa theo tổ chức uy tín + một câu "nói đơn giản: ..."
3. `## Những hiểu lầm thường gặp` + mỗi hiểu lầm là `### "câu trong ngoặc kép"`, mở đoạn bằng **Không đúng.**
4. `## <Chủ đề> gồm những gì?` — bullet
5. `## Khi nào nên ...?` — bullet dấu hiệu/tình huống
6. Blockquote kết

**C. Bài hướng dẫn sống chung / chăm sóc** (dinh dưỡng, tác dụng phụ, chăm sóc tại nhà)
1. Lead — tình huống thực tế người bệnh gặp
2. `## Vì sao xảy ra?` — cơ chế, giải thích ngắn gọn dễ hiểu
3. `## Những việc nên làm` — bullet hành động cụ thể
4. `## Những điều cần tránh` — bullet
5. `## Khi nào cần gọi bác sĩ ngay?` — bullet dấu hiệu báo động
6. Blockquote kết

### 3. Viết bài (~10–15k token)

Copy `templates/bai-viet.md` làm điểm khởi đầu. Tuân thủ mục "Văn phong" và "YMYL" dưới đây.

### 4. Ảnh minh họa + ảnh OG (~5–8k token)

Ảnh minh họa (**bắt buộc ít nhất 1 ảnh với mọi bài** — card ở trang danh sách cần
`thumb`; bài tầm soát cần đủ 2 ảnh): đọc `references/minh-hoa.md`, chép layout gần
nhất, đổi hình/chữ. Lưu vào `assets/kien-thuc/<slug>-1.svg`, `-2.svg`. Nếu `-1.svg`
có chữ thì vẽ thêm `-thumb.svg` không chữ để dùng làm `thumb`. Render kiểm tra:

```bash
# rồi Read file PNG
node .claude/skills/bai-kien-thuc/scripts/render-svg.mjs assets/kien-thuc/<slug>-1.svg /tmp/check.png 760
```

Ảnh OG (bắt buộc, mọi bài) — dùng script, **không viết SVG bằng tay**:

```bash
node .claude/skills/bai-kien-thuc/scripts/tao-anh-og.mjs <slug> "Dòng tiêu đề 1" "Dòng 2 nhấn màu" "Phụ đề một dòng"
```

Script tự canh cỡ chữ, xuất `assets/kien-thuc/<slug>-og.png` (1200×630, <200KB) và
in ra đường dẫn PNG — Read nó **một lần** để xác nhận, không lặp.

### 5. Kiểm tra (~3k token)

```bash
npm run build 2>&1 | tail -5
grep -c '<figure>' _site/kien-thuc/<slug>/index.html          # đúng số ảnh
grep -o '<meta property="og:image"[^>]*>' _site/kien-thuc/<slug>/index.html
grep -o '<slug>[^<]*' _site/sitemap.xml                       # bài đã vào sitemap
```

Chỉ mở preview browser (`preview_start` với `eleventy-output`, port 8081) khi có
ảnh minh họa mới hoặc thay đổi layout — để kiểm ảnh load được và không lỗi console.
Bài chỉ có chữ thì bỏ bước này.

### 6. Commit + PR (~2k token)

```bash
git checkout main && git pull --ff-only
git checkout -b feat/bai-<slug>
git add kien-thuc/<slug>.md assets/kien-thuc/<slug>-*
# Nếu chủ đề lấy từ hàng đợi: chuyển dòng đó từ bảng "Hàng đợi" sang bảng
# "Đã xuất bản" trong docs/chu-de-bai-viet.md, rồi add file đó vào cùng commit.
git add docs/chu-de-bai-viet.md
git commit -m "feat: add <topic> article with illustrations"
git push -u origin feat/bai-<slug>
gh pr create --base main --title "feat: bài Kiến thức — <Tiêu đề>" --body "..."
```

**KHÔNG BAO GIỜ merge.** Bác sĩ duyệt nội dung trên Vercel preview URL rồi user tự merge.
PR body: tóm tắt nội dung, tài sản kèm theo, nguồn tham khảo, kết quả kiểm tra, và
dòng nhắc "⚠️ Chờ bác sĩ duyệt nội dung trước khi merge".

## Frontmatter — hợp đồng bắt buộc

```yaml
---
title: "<Chủ đề>: <câu hỏi phụ dẫn dắt>?"
description: "<1–2 câu, 150–200 ký tự, nêu đúng những câu hỏi bài trả lời — đây là article-lead hiện trên trang và meta description>"
date: YYYY-MM-DD
tags:
  - "<1 tag chính, chọn từ 6 tag cố định>"
cta: tam-soat | tai-nha        # bỏ dòng này nếu dùng CTA mặc định
image: /assets/kien-thuc/<slug>-og.png
thumb: /assets/kien-thuc/<slug>-1.svg
facebook: |
  <caption Facebook — chỉ phần chữ, xem mục dưới>
sources:
  - title: "<Tổ chức> — <Tên tài liệu> (<năm nếu có>)"
    url: "https://..."
---
```

- `tags`: **chỉ dùng 6 tag cố định** — `Tầm soát` · `Dấu hiệu` · `Chăm sóc giảm nhẹ` ·
  `Điều trị` · `Dinh dưỡng` · `Phòng ngừa`. Mỗi bài 1 tag chính; tag thứ hai chỉ khi
  bài thật sự phủ hai cụm. **Không tự tạo tag mới** — tag lẻ chỉ có 1–2 bài thì vô dụng
  khi lọc. Tag hiện thành chip ở đầu bài và trên card danh sách.
- `cta`: chọn lời mời hành động khớp ý định người đọc.
  `tam-soat` (bài tầm soát/phòng ngừa → mời nhắn Zalo hỏi trước, hạ rào cản) ·
  `tai-nha` (bài chăm sóc giảm nhẹ/người chăm sóc → mời gọi ngay, khám tại nhà) ·
  bỏ trống = CTA chung. Bảng suy ra `tags` + `cta` theo cụm chủ đề nằm ở
  `docs/chu-de-bai-viet.md`.

- `title` theo công thức đã dùng: `"Tầm soát ung thư dạ dày: Ai nên tầm soát, khi nào và bằng cách nào?"`,
  `"Chăm sóc giảm nhẹ là gì? Những hiểu lầm thường gặp"`.
- `sources`: **2–4 nguồn**, ưu tiên WHO, IARC/GLOBOCAN, NCI, ACS, USPSTF, AGA/NCCN,
  Bộ Y tế, PubMed/NCBI. Không dùng blog, không dùng trang bán dịch vụ.
- `updated: YYYY-MM-DD` chỉ thêm khi sửa bài đáng kể về sau.
- `image` bỏ được, nhưng khi đó share link chỉ ra ảnh chân dung mặc định — nên luôn tạo.
- `thumb`: ảnh hiện trên card ở trang danh sách và trang lọc chủ đề, khung 200×125.
  Trỏ vào `-1.svg` **nếu ảnh đó không có chữ**; ảnh nhiều chữ thu nhỏ còn ~180px thì
  chữ thành vệt mờ. Khi `-1.svg` có chữ, vẽ thêm bản không chữ `-thumb.svg` (xem
  `references/minh-hoa.md`). Bỏ `thumb` thì card về dạng chỉ có chữ, lệch với các bài
  khác — luôn khai báo.
- `facebook`: caption cho bài đăng Facebook tự động — xem mục ngay dưới. Thiếu field này
  thì job đăng Facebook **fail có báo lỗi**, bài vẫn lên web bình thường nhưng không lên page.
- Layout tự lo `<h1>`, ngày, breadcrumb, lead, khối nguồn, CTA đặt lịch, disclaimer.
  **Đừng viết lại những phần này trong body.**

### Caption Facebook (`facebook:`)

Page Facebook **tự đăng bài này khi PR được merge**, dùng đúng caption trong frontmatter.
Bác sĩ duyệt caption cùng lúc duyệt bài — nên viết cẩn thận đúng như viết thân bài.

**Chỉ viết phần chữ.** Script tự nối link bài và hashtag suy từ `tags` — đừng gõ tay hai
thứ đó vào caption. Domain sắp đổi sang `bsquyen.com`; link gõ tay nghĩa là 50–100 file
phải sửa lại.

Khung 4 phần, 400–700 ký tự:

1. **Câu mở** — câu hỏi bệnh nhân hay hỏi, hoặc một hiểu lầm. Facebook cắt caption ở
   khoảng 125 ký tự rồi mới hiện "Xem thêm", nên câu này phải đứng được một mình.
2. **2–3 dòng nội dung** — nêu đúng thứ bài trả lời. Không chép lại `description`:
   câu đó viết cho Google, đọc khô.
3. **Một câu trấn an hoặc mời đọc.**
4. Hết. **Không chèn số điện thoại / Zalo / địa chỉ** — trang bài đã có CTA, nhắc lại ở
   đây là thêm một chỗ nữa phải sửa mỗi khi đổi thông tin liên hệ.

Ràng buộc YMYL giữ nguyên như thân bài: không hứa kết quả điều trị, không testimonial,
không liều thuốc, không giá dịch vụ. Thêm một ràng buộc riêng của mạng xã hội:
**không giật tít doạ người đọc** — kiểu "dấu hiệu chết người", "ai cũng mắc mà không
biết". Trang này là của một bác sĩ, không phải trang tin câu view.

Emoji: tối đa 1–2, hoặc không dùng. Không đặt emoji ở câu mở.

**Xuống dòng.** Cứ hard-wrap ~76 ký tự như thân bài. Script đăng Facebook tự gộp các
dòng trong cùng một đoạn lại thành dòng liền — nếu để nguyên thì Facebook hiện đúng chỗ
ngắt và caption thành câu cụt giữa chừng. Muốn ngắt đoạn thật thì **để một dòng trống**.


## Văn phong

Ràng buộc hình thức:

- **Hard-wrap ~76 ký tự/dòng.** Cả 3 bài hiện tại đều vậy — giữ nhất quán để diff sạch.
- Ngôi thứ hai "bạn"; gia đình người bệnh gọi là "người thân". Không "quý khách", không "chúng tôi" tự đề cao.
- `**in đậm**` cho thuật ngữ chốt và cho phán quyết ngắn (`**Không đúng.**`). Không in đậm cả câu dài.
- Dấu gạch ngang em dash `—` dùng nhiều để chèn giải thích. Đây là nhịp đặc trưng của các bài đã có.
- Thuật ngữ y khoa: tiếng Việt trước, ngoặc kèm tên quốc tế/viết tắt ở lần đầu —
  `vi khuẩn **Helicobacter pylori (HP)**`, `dị sản ruột`, rồi các lần sau dùng dạng ngắn.
- Câu bệnh nhân thường nói đặt trong ngoặc kép: `"vậy là hết cách rồi"`, `"chỉ giai đoạn cuối mới cần"`.
- Dẫn nguồn ngay trong câu khi nêu khuyến cáo: `Theo Tổ chức Y tế Thế giới (WHO), ...`,
  `các hướng dẫn quốc tế (Hiệp hội Ung thư Hoa Kỳ, USPSTF) khuyến cáo ...`.
- Blockquote `>` **chỉ dùng 1–2 lần/bài**: một lần kết bài, tối đa một lần giữa bài
  để chốt ý quan trọng. Câu kết reframe hy vọng hoặc mời hành động nhẹ nhàng,
  không hối thúc, không hứa hẹn.

Ràng buộc nội dung:

- **Ít số, đúng số.** Các bài hiện tại nói `"nằm trong nhóm dẫn đầu"`, `"khoảng 10 năm"`,
  `"5–15 phút"` — định tính hoặc khoảng, không rải tỉ lệ phần trăm. Mỗi con số đưa vào
  phải khớp một nguồn trong `sources`. Không có nguồn thì diễn đạt định tính.
- **Đoạn cảnh báo ngược bắt buộc** sau mọi danh sách dấu hiệu: nói rõ các dấu hiệu này
  *không* đồng nghĩa với ung thư, nhiều bệnh lành tính gây triệu chứng tương tự, nhưng
  vẫn cần bác sĩ thăm khám. Đây là điểm phân biệt bài của bác sĩ với bài SEO gây hoang mang.
- **Chủ động hoá**: mỗi bài phải có ít nhất một phần nói rõ người đọc *làm được gì*.
- Giọng trấn an nhưng không xoa dịu giả tạo. Gọi tên nỗi sợ cụ thể rồi giải thích
  (vd: sợ nội soi đau → nói rõ có gây mê nhẹ, thời gian thực tế bao lâu).

## Ràng buộc YMYL — không thương lượng

Nội dung y tế + quy định quảng cáo y tế VN:

- **Không hứa hẹn kết quả điều trị.** Không "chữa khỏi", "khỏi hẳn", "hiệu quả 100%".
  Dùng "khả năng điều trị thành công cao hơn", "điều trị hiệu quả hơn".
- **Không testimonial bệnh nhân**, không case study có thể nhận dạng, không ảnh bệnh nhân.
  Site dùng section "Cam kết đồng hành" thay thế.
- **Không giá dịch vụ** (thay đổi liên tục, khác nhau theo cơ sở, dễ thành quảng cáo sai).
- **Không liều thuốc, không phác đồ cụ thể.** Nói "bác sĩ sẽ chỉ định phác đồ phù hợp".
- **Không so sánh hạ thấp** cơ sở/bác sĩ khác.
- Không tự nhận là chỉ định điều trị — disclaimer đã có trong layout, không cần nhắc lại trong body.
- Thông tin liên hệ đã nằm trong layout/CTA. Nếu buộc phải nhắc trong body, lấy đúng
  từ `CLAUDE.md` (SĐT/Zalo, email, địa chỉ, giờ làm việc) — không tự bịa.

## Checklist trước khi báo xong

- [ ] Frontmatter đủ `title`, `description`, `date`, `tags`, `image`, `thumb`, `facebook`, `sources` (2–4 nguồn uy tín)
- [ ] `tags` chỉ dùng 6 tag cố định, không bịa tag mới; `cta` khớp cụm chủ đề (hoặc bỏ trống)
- [ ] Không trùng chủ đề bài đã có
- [ ] Hard-wrap ~76 ký tự; blockquote ≤ 2
- [ ] Có đoạn cảnh báo ngược sau danh sách dấu hiệu
- [ ] Có phần người đọc chủ động làm được
- [ ] Mọi con số đều truy được về một nguồn trong `sources`
- [ ] Không hứa kết quả / không testimonial / không giá / không liều thuốc
- [ ] Ảnh: alt mô tả rõ nghĩa, figcaption kết bằng "(Ảnh minh họa)", SVG hoặc raster ≤200KB
- [ ] `thumb` trỏ vào file có thật và **không có chữ**; xem thử card ở `/kien-thuc/`
- [ ] `facebook` dài 400–700 ký tự, câu mở đứng được một mình trong 125 ký tự đầu,
      **không** chứa link / hashtag / số điện thoại
- [ ] `npm run build` sạch, bài vào sitemap, `og:image` trỏ đúng file tồn tại
- [ ] Nếu chủ đề lấy từ hàng đợi: đã chuyển dòng sang bảng "Đã xuất bản" trong `docs/chu-de-bai-viet.md`
- [ ] Đã push branch + mở PR, **chưa merge**, PR có dòng chờ bác sĩ duyệt
