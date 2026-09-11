# Ảnh minh họa — thư viện motif, palette & animation

Rút từ toàn bộ SVG của các bài đã publish. Mỗi bài cần 2 ảnh: `-1.svg` (hero, đặt
sau đoạn mở) và `-2.svg` (thân bài). **Chọn layout gần nhất trong 7 layout dưới đây
rồi đổi hình/chữ — đừng thiết kế lại từ đầu.**

## Chọn layout theo dạng nội dung

| Nội dung cần thể hiện | Layout | Khung |
|---|---|---|
| Giải phẫu + thủ thuật phát hiện tổn thương | **A** | 760×440 |
| 3 nhóm / 3 phương pháp / 3 mức / 3 bước | **B** | 760×320 |
| Tiến trình theo thời gian, càng lâu càng nặng | **C** | 760×440 |
| Hai thứ chạy song song, một thứ dài hơn | **D** | 760×440 |
| So sánh đúng/sai, bác bỏ tin truyền miệng | **E** | 760×440 |
| Mức độ tăng dần theo bậc | **F** | 760×440 |
| Đường đi trong cơ thể + nhiều vị trí nguồn gốc | **G** | 760×440 |

Ảnh `-2.svg` gần như luôn là **B**. Ảnh `-1.svg` chọn theo bảng trên.

## Palette (không đổi màu ngoài danh sách này)

| Vai trò | Mã |
|---|---|
| Nền ảnh minh họa | `#fff9f4` |
| Khối trang trí ấm (góc phải dưới) | `#fdeee2` |
| Khối trang trí lạnh (góc trái trên) | `#e8f1fa` |
| Cơ quan/giải phẫu (fill) | `#f2a56e` |
| Nét viền cơ quan | `#e08b4f` |
| Lòng ống/khoang rỗng | `#fdeee2` |
| Cam thương hiệu (tổn thương, nhấn) | `#f26e21` |
| Cam đậm (nét viền vật nhấn) | `#d85a10` |
| Điểm sáng (highlight nhỏ) | `#ffd9bd` |
| Navy (dụng cụ, chữ tiêu đề) | `#123b63` |
| Chữ phụ / vật "lạnh", bị bác bỏ | `#5b6b7b` |
| Viền thẻ | `#ecdfd3` |
| Trắng | `#ffffff` |

Bảng này trùng khớp với biến CSS trong `css/styles.css`. Nhưng SVG nhúng qua
`<img src="...svg">` chạy trong document riêng và **không nhận được CSS custom
property của trang**, nên màu buộc phải viết thẳng vào từng file — bảng trên là
nguồn duy nhất, đừng thử tham chiếu `var(--orange)`.

Nền OG (chỉ dùng cho ảnh og): gradient `#173f66` → `#0e2c49`, khối `#1c4a76`,
chữ phụ `#9fb6cc` / `#c9d7e5`, nhấn `#f2a56e`.

## Quy ước chung

- Thẻ mở: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="..." role="img" aria-label="<mô tả>">`
- SVG có chữ: thêm `font-family="'Be Vietnam Pro', system-ui, sans-serif"` trên thẻ `<svg>`
- Không dùng ảnh raster, không nhúng font, không script — chỉ shape + text (+ `<style>` nếu có animation)
- Comment tiếng Việt trong SVG để lần sau sửa nhanh
- Kèm `width`/`height` trong `<img>` khớp `viewBox` để tránh layout shift
- Khung nền dùng chung cho mọi layout 760×440:

  ```
  <rect width="760" height="440" fill="#fff9f4"/>
  <circle cx="690" cy="380" r="110" fill="#fdeee2"/>
  <circle cx="70" cy="65" r="80" fill="#e8f1fa"/>
  ```

  Layout 760×320 (B) chỉ có `<rect>` nền, không có khối trang trí.

---

## Layout A — Giải phẫu + dụng cụ + tổn thương · `0 0 760 440`

Nguồn: `tam-soat-ung-thu-da-day-1`, `-dai-truc-trang-1`, `-gan-1`, `-vu-1`, `-co-tu-cung-1`

```
Cơ quan: path fill="#f2a56e" stroke="#e08b4f" stroke-width="4" stroke-linejoin="round"
Lòng cơ quan: path fill="#fdeee2" (nhỏ hơn, nằm trong)
Nếp niêm mạc: <g stroke="#f2a56e" stroke-width="6" stroke-linecap="round" opacity=".55" fill="none">
Dụng cụ (ống soi): stroke="#123b63" stroke-width="14" stroke-linecap="round"
Chùm sáng: <path fill="#ffd9bd" opacity=".85"/>  (tam giác từ đầu dụng cụ tới tổn thương)
Tổn thương: <circle r="15" fill="#f26e21" stroke="#d85a10" stroke-width="5"/>
            + <circle r="4" fill="#ffd9bd"/> lệch trên-trái làm highlight
Huy hiệu dấu tích góc phải trên:
  <circle cx="640" cy="105" r="36" fill="#f26e21"/>
  <path d="M623 105 l13 13 l23 -26" fill="none" stroke="#fff" stroke-width="8"
        stroke-linecap="round" stroke-linejoin="round"/>
```

Bẫy: **đặt chùm sáng TRƯỚC tổn thương** trong thứ tự vẽ, nếu không tam giác sáng
phủ lên tổn thương. Và giữ dụng cụ cách tổn thương một khoảng — vẽ chồng nhau thì
người xem không đọc ra là "đang soi thấy".

## Layout B — Thẻ 3 cột · `0 0 760 320`

Nguồn: mọi file `-2.svg`. Cột 3 luôn được nhấn (nền ấm + viền cam) vì là cột
"cần hành động" hoặc bước can thiệp sâu nhất.

```
<rect width="760" height="320" fill="#fff9f4"/>

Thẻ 1: <rect x="20"  y="20" width="226" height="280" rx="18" fill="#ffffff" stroke="#ecdfd3"/>
Thẻ 2: <rect x="267" y="20" width="226" height="280" rx="18" fill="#ffffff" stroke="#ecdfd3"/>
Thẻ 3: <rect x="514" y="20" width="226" height="280" rx="18" fill="#fdeee2" stroke="#f2a56e"/>

Tâm ngang mỗi thẻ: x = 133 / 380 / 627
Icon: nằm trong vùng y ≈ 47–160, cao ~110px, dùng cam #f26e21 + nét #d85a10
Chữ (đều text-anchor="middle"):
  y="205" font-size="21|22" font-weight="700" fill="#123b63"   ← tiêu đề thẻ
  y="235" font-size="16|17" fill="#5b6b7b"                      ← mô tả phụ
  y="272" font-size="17|18" font-weight="700" fill="#d85a10"    ← hành động/tần suất
Ghi chú chân ảnh (nếu cần):
  <text x="380" y="313" text-anchor="middle" font-size="12" fill="#5b6b7b">*...</text>
```

Giới hạn ký tự để không tràn thẻ 226px: tiêu đề ≤ 18 ký tự, mô tả phụ ≤ 30,
hành động ≤ 22. Quá dài thì rút chữ, **đừng** giảm cỡ chữ dưới mức trong bảng.

## Layout C — Trục thời gian leo thang · `0 0 760 440`

Nguồn: `dau-hieu-canh-bao-ung-thu-1`. Ba mốc thời gian, mốc càng muộn thì vòng
tròn càng lớn và càng ấm — đọc ra "càng dai dẳng càng cần khám".

```
Tiêu đề: <text x="380" y="52" text-anchor="middle" font-size="24" font-weight="700" fill="#123b63">
Phụ đề:  <text x="380" y="82" text-anchor="middle" font-size="16" fill="#5b6b7b">

Trục + mũi tên:
  <path d="M80 280 H655" stroke="#ecdfd3" stroke-width="8" stroke-linecap="round" fill="none"/>
  <path d="M655 264 l30 16 l-30 16 Z" fill="#ecdfd3"/>

Mốc 1 (cx=170, r=26): <circle fill="#fdeee2" stroke="#f2a56e" stroke-width="4"/>
                      + <circle r="7" fill="#f2a56e"/> ở tâm
Mốc 2 (cx=380, r=32): <circle fill="#f2a56e" stroke="#e08b4f" stroke-width="4"/>
Mốc 3 (cx=590, r=40): <circle fill="#f26e21" stroke="#d85a10" stroke-width="5"/>
                      + <circle cx="577" cy="267" r="9" fill="#ffd9bd"/> highlight
Mọi mốc cùng cy="280".

Nhãn dưới mỗi mốc (text-anchor="middle", x = cx của mốc):
  y="345" font-size="20" font-weight="700" fill="#123b63"
  y="375" font-size="16" fill="#5b6b7b"
          ← mốc cuối đổi thành font-size="17" font-weight="700" fill="#d85a10"
Ghi chú nguồn: <text x="380" y="425" text-anchor="middle" font-size="12" fill="#5b6b7b">
Chuông cảnh báo phía trên mốc 3: xem thư viện icon (đặt tâm x=590, đáy y≈196)
```

Bẫy: giữ đúng ba mức bán kính 26/32/40 — chênh ít hơn thì mắt không thấy sự
"lớn dần", chênh nhiều hơn thì mốc 1 trông như lỗi.

## Layout D — Hai dải song song · `0 0 760 440`

Nguồn: `cham-soc-giam-nhe-la-gi-1`. Một mốc khởi đầu bên trái, hai dải chạy sang
phải; dải dưới (thứ được nhấn) **dài hơn** dải trên để nói "đồng hành lâu hơn".

```
Mốc khởi đầu (cx≈110):
  <g stroke="#123b63" stroke-width="9" stroke-linecap="round" opacity=".25">
    <path d="M150 200 L176 166"/>  <path d="M150 240 L176 274"/>
  </g>                                       ← hai tia toả ra hai dải
  <circle cx="110" cy="220" r="38" fill="#ffffff" stroke="#123b63" stroke-width="9"/>
  <circle cx="110" cy="220" r="13" fill="#123b63"/>

Dải trên:  <rect x="176" y="118" width="420" height="92" rx="46"
                 fill="#f2a56e" stroke="#e08b4f" stroke-width="5"/>
Dải dưới:  <rect x="176" y="230" width="524" height="92" rx="46"
                 fill="#f26e21" stroke="#d85a10" stroke-width="5"/>

Chấm nhịp trong dải (gợi ý "tiếp diễn"), fill="#ffffff" opacity=".5":
  dải trên: cx 380, 480 · cy 164 · r 10
  dải dưới: cx 380, 480, 580 · cy 276 · r 10
Icon đầu mỗi dải: <circle cx="218" cy="164|276" r="30" fill="#ffffff"/> + hình bên trong
```

Bẫy: layout này **không có chữ** — nghĩa nằm hết ở figcaption và ở độ dài hai dải.
Vì không có `<text>` nên dùng được luôn làm `thumb`, không cần file thumb riêng.

## Layout E — Đối lập hai bong bóng · `0 0 760 440`

Nguồn: `hieu-lam-pho-bien-ve-ung-thu-1`. Bên trái lạnh + gạch chéo (tin truyền
miệng), bên phải ấm + dấu tích (bằng chứng y khoa).

```
Khối trang trí ở layout này lệch nhẹ: circle 700/392 r=104 và 44/44 r=70

Bong bóng SAI (trái):
  <rect x="48" y="64" width="280" height="170" rx="26" fill="#e8f1fa" stroke="#5b6b7b" stroke-width="3"/>
  đuôi: <path d="M96 234 v34 l40 -34 Z" fill="#e8f1fa" stroke="#5b6b7b"
              stroke-width="3" stroke-linejoin="round"/>
  3 dòng chữ mờ: <g fill="#5b6b7b" opacity=".32"> chứa
                 rect x=78 · y=132/162/192 · width=196/216/140 · height=14 · rx=7
  huy hiệu ✗: <circle cx="298" cy="98" r="26" fill="#5b6b7b"/>
              <path d="M288 88 l20 20 M308 88 l-20 20" fill="none" stroke="#ffffff"
                    stroke-width="7" stroke-linecap="round"/>

Bong bóng ĐÚNG (phải) — soi gương:
  <rect x="432" y="64" width="280" height="170" rx="26" fill="#fdeee2" stroke="#f2a56e" stroke-width="3"/>
  đuôi: <path d="M664 234 v34 l-40 -34 Z" .../>
  3 dòng chữ: <g fill="#f2a56e" opacity=".55"> chứa rect x=462 (cùng y/width/height)
  huy hiệu ✓: <circle cx="684" cy="98" r="26" fill="#f26e21"/>
              <path d="M672 98 l9 10 l16 -19" fill="none" stroke="#ffffff"
                    stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>

Nhãn dưới mỗi bong bóng (text-anchor="middle", x=188 / 572):
  y="300" font-size="23" font-weight="700" fill="#123b63"
  y="328" font-size="16" fill="#5b6b7b"
Thông điệp chân ảnh: kính lúp nhỏ ở (238,386) + <text x="306" y="396" font-size="23"
  font-weight="700" fill="#123b63">
```

Bẫy: ba dòng chữ mờ phải **cùng độ dài hai bên** (196/216/140) — lệch thì trông
như một bên "nhiều thông tin hơn", không phải ý muốn nói.

## Layout F — Bậc thang 3 mức · `0 0 760 440`

Nguồn: `kiem-soat-dau-ung-thu-1`. Ba thẻ cùng đáy `y=372`, cao dần; thẻ 3 nhấn
cam đặc và chữ trắng. Có một dải nền chung phía dưới cho ý "áp dụng ở cả ba bậc".

```
Tiêu đề căn trái: <text x="52" y="62" font-size="26" font-weight="800" fill="#123b63">
Phụ đề:           <text x="52" y="92" font-size="15" fill="#5b6b7b">

Bậc 1: <rect x="52"  y="282" width="200" height="90"  rx="14" fill="#ffffff" stroke="#ecdfd3" stroke-width="3"/>
Bậc 2: <rect x="272" y="207" width="200" height="165" rx="14" fill="#fdeee2" stroke="#f2a56e" stroke-width="3"/>
Bậc 3: <rect x="492" y="132" width="200" height="240" rx="14" fill="#f26e21" stroke="#d85a10" stroke-width="3"/>

Tâm ngang: x = 152 / 372 / 592 · mọi thẻ cùng đáy y=372
Chữ trong thẻ (text-anchor="middle"), dòng tiêu đề cách đỉnh thẻ ~37px:
  tiêu đề  font-size="19" font-weight="700"  fill="#123b63"  (thẻ 3: "#ffffff")
  mô tả    font-size="16"                    fill="#5b6b7b"  (thẻ 3: "#ffd9bd")
  mô tả 2  font-size="15"                    fill="#5b6b7b"  (thẻ 3: "#ffd9bd")

Dải nền chung: <rect x="52" y="386" width="640" height="42" rx="14" fill="#e8f1fa"/>
               <text x="372" y="413" text-anchor="middle" font-size="16" fill="#123b63">
```

Bẫy: chiều cao 90/165/240 là bước đều ~75px. Đổi chiều cao thì phải đổi luôn `y`
để giữ đáy `y=372`, nếu không ba thẻ lệch chân.

## Layout G — Đường ống + hai nguồn · `0 0 760 440`

Nguồn: `di-cau-ra-mau-tri-hay-ung-thu-1`. Ống tiêu hoá vẽ **3 lớp cùng một path**
(viền → thân → lòng), hai nguồn tổn thương ở hai vị trí khác nhau trên ống, mỗi
nguồn một nhãn đối xứng hai bên.

```
Ống 3 lớp — cùng một d, khác stroke-width (vẽ theo đúng thứ tự này):
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="..." stroke="#e08b4f" stroke-width="54"/>   ← viền
    <path d="..." stroke="#f2a56e" stroke-width="46"/>   ← thân
    <path d="..." stroke="#fdeee2" stroke-width="22"/>   ← lòng ống
  </g>
Path đã dùng (đại tràng ngang → xuống → sigma → trực tràng):
  M230 80 H430 Q500 80 500 150 V240 Q500 275 455 285 Q400 295 400 330 V405

Nguồn 1 (trong lòng ống): <circle r="15" fill="#f26e21" stroke="#d85a10" stroke-width="5"/>
                          + <circle r="4" fill="#ffd9bd"/> highlight
Nguồn 2 (cuối ống, dạng chùm): 3 <circle r="9" fill="#f26e21" stroke="#d85a10" stroke-width="4"/>

Nhãn mỗi nguồn = 1 gạch nối + 3 dòng chữ:
  gạch: <path d="..." stroke="#123b63" stroke-width="3" stroke-linecap="round"/>
  dòng 1 font-size="20" font-weight="700" fill="#123b63"   ← tên nguồn
  dòng 2 font-size="15"                   fill="#5b6b7b"   ← vị trí
  dòng 3 font-size="15" font-weight="700" fill="#d85a10"   ← biểu hiện
  Nhãn bên trái dùng text-anchor="end", bên phải để mặc định.

Thẻ ý chính (nếu cần): <rect x="40" y="150" width="270" height="132" rx="18"
  fill="#ffffff" stroke="#ecdfd3"/> + 3 dòng text-anchor="middle" x="175"
  y=192 (fs21 bold navy) / y=222 (fs20 bold cam) / y=256 (fs16 muted)
```

Bẫy: `stroke-width` phải giảm đều 54→46→22, và lớp lòng ống dùng đúng màu khối
trang trí `#fdeee2` — dùng `#fff9f4` thì ống trông như bị khoét rỗng ra nền.

---

## Thư viện icon (chép lại được)

Mọi icon dưới đây đã ship trong bài thật. Toạ độ ghi theo file gốc — dịch bằng
`transform="translate(dx,dy)"` thay vì tính lại từng số.

```
Vi khuẩn xoắn (HP) — tam-soat-ung-thu-da-day-2:
  <path d="M108 70 q28 12 0 26 q-28 14 0 28 q28 14 0 28" fill="none"
        stroke="#f26e21" stroke-width="12" stroke-linecap="round"/>
  + 4 <path> roi ngắn stroke="#d85a10" stroke-width="6" stroke-linecap="round"

Vòng tuổi:
  <circle cx="380" cy="108" r="42" fill="none" stroke="#f2a56e" stroke-width="10"/>
  <text x="380" y="118" text-anchor="middle" font-size="30" font-weight="800" fill="#f26e21">40+</text>

Cây gia đình (tiền sử):
  2 <circle r="16" fill="#f26e21"/> cạnh nhau + <path> nối chữ T
  + 1 <circle r="14" fill="#f2a56e"/> phía dưới

Ống nghiệm (xét nghiệm):
  <rect width="40" height="105" rx="20" fill="#e8f1fa" stroke="#123b63" stroke-width="6"/>
  + <path> phần dịch fill="#f26e21" + <rect rx="7" fill="#123b63"/> nắp

Chuông cảnh báo (dấu hiệu cần khám) — dùng ở cả layout B và C:
  <path d="M627 60 a34 34 0 0 1 34 34 v28 l12 18 h-92 l12 -18 v-28 a34 34 0 0 1 34 -34 Z"
        fill="#f26e21" stroke="#d85a10" stroke-width="5" stroke-linejoin="round"/>
  + <circle cx="627" cy="151" r="10" fill="#d85a10"/> làm quả chuông
  (bản ở layout C dịch sang tâm x=590)

Kính lúp lớn (phát hiện sớm):
  <circle r="88" fill="#ffffff" stroke="#123b63" stroke-width="10"/> + clipPath phóng to bên trong
  + tay cầm <path stroke="#123b63" stroke-width="22" stroke-linecap="round"/>

Kính lúp nhỏ (kiểm chứng / khám tại chỗ) — hieu-lam-1, di-cau-2:
  <circle cx="238" cy="386" r="32" fill="#ffffff" stroke="#123b63" stroke-width="8"/>
  <path d="M262 410 l24 24" stroke="#123b63" stroke-width="15" stroke-linecap="round"/>
  + <circle r="7" fill="#ffd9bd"/> highlight lệch trên-trái
  Biến thể "soi thấy tổn thương": thay highlight bằng
  <circle r="14" fill="#f26e21" stroke="#d85a10" stroke-width="4"/> ở tâm

Lam kính + tế bào bất thường (Pap) — co-tu-cung-2:
  <rect x="86" y="60" width="94" height="100" rx="12" fill="#e8f1fa" stroke="#123b63" stroke-width="6"/>
  <g fill="#fdeee2" stroke="#f2a56e" stroke-width="4">     ← 4 tế bào bình thường
    <circle cx="110" cy="88" r="12"/>  <circle cx="156" cy="90" r="12"/>
    <circle cx="108" cy="132" r="12"/> <circle cx="154" cy="134" r="12"/>
  </g>
  <circle cx="132" cy="111" r="15" fill="#f26e21" stroke="#d85a10" stroke-width="4"/>  ← bất thường
  Bản nhỏ (thẻ 3): rect 52×84, 3 tế bào r=8 fill="#ffffff" stroke-width="3"

Vi-rút có gai (HPV) — co-tu-cung-2:
  <g stroke="#d85a10" stroke-width="6" stroke-linecap="round"> 8 gai toả đều quanh tâm </g>
  <circle cx="380" cy="108" r="34" fill="#f26e21" stroke="#d85a10" stroke-width="5"/>
  + 2 <circle r="5|6" fill="#ffd9bd"/> highlight
  Gai = đoạn thẳng dài ~16px, bắt đầu cách tâm ~34px, cách nhau 45°.
  Bản nhỏ: r=22, gai stroke-width="5", chỉ 6 gai.

Tài liệu / hỏi bệnh sử — di-cau-2:
  <rect x="88" y="55" width="90" height="68" rx="16" fill="#f26e21" stroke="#d85a10" stroke-width="4"/>
  <path d="M108 121 V145 L134 121" fill="#f26e21" stroke="#d85a10" stroke-width="4"
        stroke-linejoin="round"/>                            ← đuôi bong bóng thoại
  <g stroke="#ffffff" stroke-width="6" stroke-linecap="round">   ← 3 dòng chữ
    <path d="M104 78 H162"/> <path d="M104 92 H162"/> <path d="M104 106 H140"/>
  </g>

Ống soi cong (nội soi đại tràng) — di-cau-2:
  <path d="M582 152 C582 78 672 78 672 152" fill="none" stroke="#e08b4f" stroke-width="34" stroke-linecap="round"/>
  <path d="M582 152 C582 78 672 78 672 152" fill="none" stroke="#f2a56e" stroke-width="26" stroke-linecap="round"/>
  <path d="M627 154 V104" stroke="#123b63" stroke-width="10" stroke-linecap="round"/>   ← ống soi
  <path d="M627 104 L657 112 L640 128 Z" fill="#ffd9bd" opacity=".9"/>                  ← chùm sáng
  <circle cx="659" cy="117" r="9" fill="#f26e21" stroke="#d85a10" stroke-width="4"/>    ← tổn thương

Dấu cộng trong vòng trắng (điều trị đặc hiệu) — cham-soc-1:
  <circle cx="218" cy="164" r="30" fill="#ffffff"/>
  <path d="M218 146 v36 M200 164 h36" stroke="#f26e21" stroke-width="10" stroke-linecap="round"/>

Trái tim trong vòng trắng (chăm sóc / đồng hành) — cham-soc-1:
  <circle cx="218" cy="276" r="30" fill="#ffffff"/>
  <path d="M218 289 c-12 -8.5 -19 -14.5 -19 -21.5 a7.75 7.75 0 0 1 19 -5
           a7.75 7.75 0 0 1 19 5 c0 7 -7 13 -19 21.5 Z" fill="#f26e21"/>
```

---

## Animation nhẹ (tuỳ chọn — chỉ khi nội dung *là* chuyển động)

Chỉ 3 layout có động lực thật sự: **C** (mốc lớn dần theo thời gian), **D** (hai dải
trải dài song song), **F** (leo bậc thang). Với A, B, E, G thì animation chỉ là trang
trí — bỏ qua.

### Ràng buộc quan trọng nhất: resvg render trạng thái TĨNH

`thumb` và ảnh OG đều đi qua `@resvg/resvg-js`, và resvg **bỏ qua hoàn toàn**
animation — đã kiểm chứng với cả SMIL `<animate>` lẫn CSS `@keyframes`. Nó chỉ vẽ
giá trị ghi trong attribute.

Nên: **attribute tĩnh phải mang giá trị CUỐI của animation.**

```xml
<!-- ĐÚNG: resvg thấy width=200 (hình đủ); browser chạy 0 → 200 -->
<rect class="bar" x="20" y="52" width="200" height="16" rx="8" fill="#f2a56e"/>

<!-- SAI: resvg thấy width=0 → thanh MẤT HẲN trên thumbnail và ảnh Facebook -->
<rect x="20" y="52" width="0" height="16" rx="8" fill="#f2a56e">
  <animate attributeName="width" values="0;200" dur="1.2s" fill="freeze"/>
</rect>
```

### Dùng CSS `@keyframes`, không dùng SMIL `<animate>`

SMIL không tắt được bằng `prefers-reduced-motion`; CSS thì tắt được. Mẫu chuẩn
(ví dụ cho layout C):

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 440" role="img"
     font-family="'Be Vietnam Pro', system-ui, sans-serif" aria-label="...">
  <style>
    @keyframes moc-hien { from { transform: scale(0); opacity: 0; } }
    .moc-1 { animation: moc-hien .45s ease-out .10s both; transform-origin: 170px 280px; }
    .moc-2 { animation: moc-hien .45s ease-out .35s both; transform-origin: 380px 280px; }
    .moc-3 { animation: moc-hien .45s ease-out .60s both; transform-origin: 590px 280px; }
    @media (prefers-reduced-motion: reduce) {
      .moc-1, .moc-2, .moc-3 { animation: none; }
    }
  </style>
  ...
</svg>
```

Quy tắc:

- `both` ở cuối shorthand để phần tử giữ trạng thái cuối sau khi chạy xong.
- **Chạy một lần rồi dừng.** Không `infinite` — hình y khoa nhấp nháy liên tục gây
  mệt và làm trang trông rẻ.
- Tổng thời lượng ≤ 1.5s. Người đọc đang tìm thông tin, không xem hoạt hình.
- `transform-origin` ghi bằng **px theo hệ toạ độ viewBox** (`170px 280px`), không
  dùng `center` — trong SVG `center` quy về gốc toạ độ, hình sẽ bay lệch.
- Luôn kèm khối `@media (prefers-reduced-motion: reduce)` tắt mọi animation.
- Vẫn không dùng `<script>`. SVG nhúng qua `<img>` chạy CSS nhưng không chạy script
  — và ta không cần script.

### Kiểm tra khi có animation

Kiểm **hai** đường render, vì chúng khác nhau:

```bash
# 1. Trạng thái tĩnh (thumb + OG đi đường này) — phải thấy hình ĐỦ, không thiếu phần tử
node .claude/skills/bai-kien-thuc/scripts/render-svg.mjs \
  assets/kien-thuc/<slug>-1.svg /tmp/check.png 760

# 2. Cỡ thumbnail
node .claude/skills/bai-kien-thuc/scripts/render-svg.mjs \
  assets/kien-thuc/<slug>-thumb.svg /tmp/thumb.png 200
```

Animation chạy đúng hay không thì xem bằng mắt trên Vercel preview của PR — resvg
không kiểm được phần đó.

---

## Kiểm tra ảnh

```bash
node .claude/skills/bai-kien-thuc/scripts/render-svg.mjs \
  assets/kien-thuc/<slug>-1.svg /tmp/check.png 760
```

Rồi Read `/tmp/check.png`. Nhìn 3 điểm: hình có đọc ra đúng thứ cần thể hiện không,
chữ có tràn/đè nhau không, tổn thương/vật nhấn có bị dụng cụ che không.
**Sửa tối đa 1 lượt** — ảnh minh họa không cần hoàn hảo, cần rõ nghĩa.

## Ảnh thumbnail cho card danh sách (`thumb`)

Card ở `/kien-thuc/` và các trang lọc chủ đề hiện ảnh trong khung **200×125**,
`object-fit: contain` trên nền `#fff9f4` — trùng đúng màu nền của mọi SVG minh họa,
nên phần thừa không lộ viền và hình không bao giờ bị cắt.

Ràng buộc duy nhất: **thumbnail không được có chữ.** Ở 200px, `font-size` 16–24
trong khung 760 co lại còn 4–6px và biến thành vệt mờ.

- `-1.svg` không có `<text>` → trỏ `thumb` thẳng vào nó (ví dụ layout D).
- `-1.svg` có `<text>` → vẽ thêm `assets/kien-thuc/<slug>-thumb.svg`: giữ nguyên bố
  cục và palette của `-1.svg`, bỏ hết chữ, phóng to các hình khối chính cho cân khung.
  Bản đã làm để tham khảo: `dau-hieu-canh-bao-ung-thu-thumb.svg` (trục thời gian ba
  chấm lớn dần + chuông), `kiem-soat-dau-ung-thu-thumb.svg` (ba bậc thang, số chấm
  trắng thay nhãn bậc), `hieu-lam-pho-bien-ve-ung-thu-thumb.svg` (hai bong bóng
  thoại ✗/✓ + kính lúp).

Mẹo thay nhãn chữ: dùng **số lượng chấm tròn** (1/2/3 chấm = bậc 1/2/3), **kích cỡ
tăng dần** (mốc thời gian), hoặc **huy hiệu ✓/✗** — đọc được ở mọi cỡ.

File thumb **không cần animation** — nó chỉ tồn tại để render tĩnh ở 200px.
