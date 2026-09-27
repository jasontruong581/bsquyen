# Quy tắc công cụ "Tôi nên tầm soát gì?"

> **Trạng thái: ĐÃ DUYỆT** (bác sĩ trả lời trên PR #37, 27/09/2026). Công cụ ở
> `/cong-cu/tam-soat/`; quy tắc trong code nằm ở `js/tam-soat-quy-tac.js`, test ở
> `scripts/tam-soat-quy-tac.test.mjs`. **Sửa bảng này thì sửa code và test cùng PR.** Test tự
> đối chiếu **chữ** ở cột "Người dùng thấy" với code (lệch một chữ là đỏ), nhưng **điều
> kiện** (mốc tuổi, "không thuộc…") thì không đọc được từ bảng — đổi điều kiện phải tự sửa
> test tương ứng.

## Nguyên tắc

1. **Không có khuyến cáo nào mới ngoài ý bác sĩ.** Mỗi dòng dưới đây lấy từ một bài tầm soát
   **đã được bác sĩ duyệt và xuất bản**, hoặc từ câu trả lời của bác sĩ trên PR #37 (ghi rõ ở
   cột nguồn). Công cụ chỉ giúp người đọc tìm đúng bài, đúng đoạn dành cho mình.
2. **Không chẩn đoán, không chỉ định.** Kết quả luôn viết dạng "nên trao đổi với bác sĩ
   về…", không bao giờ "bạn cần làm xét nghiệm X".
3. **Triệu chứng thắng tất cả.** Người đang có dấu hiệu bất thường được khuyên đi khám ngay,
   không phải đọc lịch tầm soát (quy tắc R0).
4. **Không thu dữ liệu.** Công cụ chạy trên trình duyệt; câu trả lời không gửi đi đâu, kể
   cả hệ thống đo lường. Kết quả không sinh URL riêng (tuổi, tiền sử sẽ lọt vào lịch sử
   trình duyệt).
5. **Văn phong:** lịch sự, chuyên nghiệp, như bác sĩ nói chuyện với người đến hỏi. Không o
   ép, không chèo kéo dùng dịch vụ, không giọng quảng cáo, không giọng máy.

## Câu hỏi người dùng trả lời

| # | Câu hỏi | Kiểu |
|---|---|---|
| Q1 | Bạn bao nhiêu tuổi? | số |
| Q2 | Giới tính (theo sinh học) | Nữ / Nam |
| Q3 | Hiện có dấu hiệu nào dưới đây không? (danh sách R0) | có / không |
| Q4 | Người thân **trực hệ** (cha mẹ, anh chị em ruột, con) từng mắc: ung thư vú hoặc buồng trứng · ung thư đại trực tràng hoặc polyp nguy cơ cao · ung thư dạ dày · ung thư gan | chọn nhiều |
| Q5 | Bản thân bạn: viêm gan B mạn · viêm gan C · xơ gan · **chưa từng xét nghiệm viêm gan B/C** · nhiễm HP hoặc viêm loét dạ dày kéo dài · từng có polyp đại tràng · viêm ruột mạn (viêm loét đại tràng, Crohn) · suy giảm miễn dịch (HIV, thuốc ức chế miễn dịch kéo dài) · đột biến BRCA1/2 · từng xạ trị vùng ngực · hút thuốc lá hoặc uống nhiều rượu bia · chưa từng tiêm vắc-xin HPV | chọn nhiều |

Không hỏi thêm gì. Hỏi càng nhiều, người dùng càng bỏ giữa chừng, và càng gần với việc
"khám qua mạng". Các yếu tố ít gặp (hội chứng Lynch, FAP, đã điều trị ung thư, tổn thương
tiền ung thư dạ dày, sinh thiết vú bất thường…) **cố ý không hỏi**: người có các tình trạng
này thường đã được bệnh viện theo dõi sẵn (bác sĩ duyệt, PR #37).

## Bảng quy tắc

Cột **"Người dùng thấy"** là chữ hiện nguyên văn trên công cụ.

### R0 — Đang có dấu hiệu bất thường (ưu tiên trên mọi quy tắc)

**Điều kiện:** Q3 = có. Danh sách lấy từ bài [10 dấu hiệu cảnh báo](../kien-thuc/dau-hieu-canh-bao-ung-thu.md), mục "Khi nào cần đi khám ngay": ho ra máu, nôn ra máu, đi cầu phân đen · khó thở mới xuất hiện, đau ngực tăng · đau dữ dội không giảm với thuốc giảm đau thông thường · sụt cân nhanh kèm mệt nhiều · vàng da, vàng mắt tăng trong vài ngày · hạch to nhanh kèm sốt kéo dài.

**Người dùng thấy:**
> Những dấu hiệu bạn chọn nên được bác sĩ khám sớm, không nên chờ tới lịch tầm soát. Chúng
> có thể do bệnh lành tính, nhưng dù nguyên nhân là gì thì bản thân triệu chứng cũng cần
> được xử trí. Nếu triệu chứng nặng hoặc xuất hiện đột ngột, hãy đến cơ sở cấp cứu gần
> nhất hoặc gọi 115.

Câu cấp cứu: bác sĩ duyệt (PR #41) — phòng khám không mở cả ngày, người đang nôn ra máu lúc
ngoài giờ khám không nên chỉ thấy số Zalo. Kèm số điện thoại / Zalo và link bài dấu hiệu cảnh báo. **Phần tầm soát bên dưới ẩn** cho
tới khi người dùng chủ động bấm "Xem thêm lịch tầm soát".

### T0 — Dưới 18 tuổi

**Điều kiện:** Q1 < 18. Thay cho toàn bộ bảng bên dưới (R0 vẫn hiện trước nếu có dấu hiệu).

**Người dùng thấy:**
> Ở tuổi của bạn, thường chưa cần tầm soát ung thư: cơ thể còn khỏe và các hướng dẫn tầm
> soát đều bắt đầu từ tuổi trưởng thành. Chỉ nên đi khám khi có dấu hiệu bất thường rõ.
> Nếu bạn đang có bệnh mạn tính (ví dụ viêm gan B) và được bác sĩ theo dõi, hãy tiếp tục
> tái khám đều đặn theo lịch. Việc đáng làm lúc này là tiêm phòng: vắc-xin HPV và viêm gan B
> giúp phòng một số bệnh ung thư về sau.

Kèm link bài [Vắc-xin phòng ung thư](../kien-thuc/vac-xin-phong-ung-thu.md). Nguồn: bác sĩ
duyệt (PR #37; câu bệnh mạn tính: PR #41 — để "chỉ nên đi khám khi có dấu hiệu" không bị
hiểu là bỏ lịch theo dõi) + bài vắc-xin.

### Ung thư vú — bài [Tầm soát ung thư vú](../kien-thuc/tam-soat-ung-thu-vu.md), mục "Ai nên tầm soát và từ tuổi nào?"

| ID | Điều kiện | Người dùng thấy | Nguồn |
|---|---|---|---|
| V1 | Nữ, 40–74 tuổi, không thuộc V3 | Nên trao đổi với bác sĩ về chụp nhũ ảnh định kỳ. Các hướng dẫn quốc tế lấy mốc 40 tuổi (USPSTF 2024: mỗi 2 năm từ 40 đến 74 tuổi). | USPSTF 2024, ACS |
| V2 | Nữ, 18–39 tuổi, không thuộc V3 | Chưa cần chụp nhũ ảnh định kỳ. Việc nên làm là biết vú mình bình thường thế nào để nhận ra ngay khi có thay đổi, và đi khám khi thấy bất thường. | đoạn "Trước 40 tuổi…" |
| V3 | Nữ, 18–74 tuổi, **và** có: người thân vú/buồng trứng, hoặc BRCA1/2, hoặc từng xạ trị vùng ngực | Bạn thuộc nhóm nên tầm soát sớm hơn và kỹ hơn. Hãy mang tiền sử gia đình cụ thể tới gặp bác sĩ để có kế hoạch riêng, thay vì tự đặt lịch theo bài viết. | danh sách "Bạn nên tầm soát sớm hơn…" |
| V4 | Nữ, từ 75 tuổi | Sau 74 tuổi, bạn vẫn nên tầm soát vú khoảng 2–3 năm một lần; bác sĩ sẽ giúp chọn cách phù hợp. Nếu thấy thay đổi lạ ở vú thì nên đi khám ngay, không chờ tới lịch. | bác sĩ duyệt (PR #37) |

### Ung thư cổ tử cung — bài [Tầm soát ung thư cổ tử cung](../kien-thuc/tam-soat-ung-thu-co-tu-cung.md), mục "Ai nên tầm soát và từ tuổi nào?"

| ID | Điều kiện | Người dùng thấy | Nguồn |
|---|---|---|---|
| C1 | Nữ, 21–65 tuổi, không thuộc C2 | Nên trao đổi với bác sĩ về tầm soát ung thư cổ tử cung và lặp lại đều đặn theo lịch. Tùy phương pháp, các hướng dẫn bắt đầu từ 21 tuổi (Pap) hoặc 30 tuổi (xét nghiệm HPV). | WHO, USPSTF |
| C2 | Nữ, 25–65 tuổi, **và** suy giảm miễn dịch | Người suy giảm miễn dịch nên tầm soát sớm hơn và dày hơn (WHO: từ 25 tuổi, mỗi 3–5 năm). Hãy trao đổi với bác sĩ về lịch riêng. | WHO |
| C3 | Nữ, từ 18 tuổi, **và** chưa từng tiêm vắc-xin HPV | Người lớn chưa tiêm vắc-xin HPV vẫn có thể tiêm ở nhiều độ tuổi, dù lợi ích thấp hơn tiêm sớm. Bạn có thể hỏi bác sĩ xem với tuổi và hoàn cảnh của mình thì có nên tiêm không. | bài [Vắc-xin phòng ung thư](../kien-thuc/vac-xin-phong-ung-thu.md), mục "Tiêm phòng gồm những gì?" |
| C4 | Nữ, từ 66 tuổi | Sau 65 tuổi, bạn vẫn nên tầm soát cổ tử cung khoảng 2–3 năm một lần; bác sĩ sẽ giúp chọn cách phù hợp. Nếu có ra máu bất thường hay triệu chứng lạ thì nên đi khám ngay, không chờ tới lịch. | bác sĩ duyệt (PR #37) |

### Ung thư đại trực tràng — bài [Tầm soát ung thư đại trực tràng](../kien-thuc/tam-soat-ung-thu-dai-truc-trang.md), mục "Ai cần tầm soát…"

| ID | Điều kiện | Người dùng thấy | Nguồn |
|---|---|---|---|
| D1 | Mọi giới, 45–75 tuổi, không thuộc D2 | Nên trao đổi với bác sĩ về tầm soát ung thư đại trực tràng. Các hướng dẫn quốc tế khuyến cáo bắt đầu từ 45 tuổi với người nguy cơ trung bình. | ACS, USPSTF |
| D2 | 18–75 tuổi, **và** có: người thân đại trực tràng/polyp, hoặc bản thân từng có polyp, hoặc viêm ruột mạn | Bạn thuộc nhóm cần bắt đầu sớm hơn mốc 45 tuổi. Hãy trao đổi kỹ với bác sĩ về thời điểm và phương pháp. | danh sách "Cần bắt đầu sớm hơn…" |
| D3 | Mọi giới, từ 76 tuổi | Sau 75 tuổi, bạn vẫn nên tầm soát đại trực tràng khoảng 2–3 năm một lần; bác sĩ sẽ giúp chọn cách phù hợp. Nếu đi cầu ra máu, đổi thói quen đi cầu hay sụt cân không rõ lý do thì nên đi khám ngay. | bác sĩ duyệt (PR #37) |

### Ung thư gan — bài [Tầm soát ung thư gan](../kien-thuc/tam-soat-ung-thu-gan.md), mục "Ai nên tầm soát và bao lâu một lần?"

| ID | Điều kiện | Người dùng thấy | Nguồn |
|---|---|---|---|
| G1 | Từ 18 tuổi, có: viêm gan B mạn, hoặc viêm gan C, hoặc xơ gan, hoặc người thân trực hệ ung thư gan | Nên trao đổi với bác sĩ về lịch theo dõi gan định kỳ. Với nhóm nguy cơ, các hướng dẫn chuyên khoa khuyến cáo siêu âm bụng khoảng 6 tháng một lần, có thể kèm xét nghiệm máu AFP. | hướng dẫn chuyên khoa gan mật |
| G2 | Từ 18 tuổi, chưa từng xét nghiệm viêm gan B/C, **và** không thuộc G1 | Việc nên làm trước tiên là xét nghiệm viêm gan B và C một lần, để biết mình có thuộc nhóm cần theo dõi gan hay không. | đoạn cuối mục |

### Ung thư dạ dày — bài [Tầm soát ung thư dạ dày](../kien-thuc/tam-soat-ung-thu-da-day.md), mục "Ai nên cân nhắc tầm soát…"

| ID | Điều kiện | Người dùng thấy | Nguồn |
|---|---|---|---|
| DD1 | Mọi giới, từ 40 tuổi, không thuộc DD2 | Khoảng 40 tuổi là mốc hợp lý để bắt đầu trao đổi với bác sĩ về tầm soát ung thư dạ dày. Việt Nam chưa có chương trình tầm soát toàn dân, nhưng người Việt có xu hướng mắc bệnh ở tuổi trẻ hơn so với phương Tây. | nghiên cứu dịch tễ trích trong bài |
| DD2 | Từ 18 tuổi, **và** có: nhiễm HP hoặc viêm loét dạ dày kéo dài, hoặc người thân ung thư dạ dày, hoặc hút thuốc / rượu bia nhiều | Bạn thuộc nhóm nên cân nhắc tầm soát dạ dày sớm và kỹ hơn. Hãy trao đổi với bác sĩ. | danh sách "Bạn nên cân nhắc tầm soát sớm…" |

### Không có mục nào khớp

Ví dụ nam 30 tuổi, không tiền sử. **Người dùng thấy:**
> Với những gì bạn chọn, hiện chưa có loại tầm soát nào các hướng dẫn khuyến cáo riêng cho
> bạn. Hãy giữ lối sống lành mạnh và đi khám khi có dấu hiệu bất thường. Bạn có thể quay lại
> công cụ khi bước sang mốc tuổi mới.

### Luôn hiện ở cuối kết quả

> Kết quả này chỉ gợi ý những điều bạn nên hỏi bác sĩ, dựa trên các hướng dẫn phổ biến. Nó
> không phải chẩn đoán và không thay thế việc thăm khám. Mỗi người có hoàn cảnh riêng, bác
> sĩ sẽ tư vấn cụ thể sau khi khám.

Kèm link tới từng bài tầm soát liên quan và một dòng liên hệ nhẹ nhàng (số điện thoại /
Zalo), không nút kêu gọi to.

## Ngoài phạm vi (bác sĩ đã quyết, PR #37)

- **Nam giới:** chưa có gợi ý riêng (vd. tuyến tiền liệt). Thêm khi có bài tầm soát tương ứng.
- **Ung thư phổi cho người hút thuốc lâu năm:** thêm vào công cụ **khi bài
  `tam-soat-ung-thu-phoi` được duyệt và xuất bản** — công cụ không có quy tắc nào không có
  bài nguồn.

## Rà lại định kỳ

Bác sĩ muốn công cụ được rà lại mỗi 2–3 tháng khi danh sách bài dài thêm (dự kiến ~100
bài), để thêm bệnh mới và làm kết quả chính xác hơn.

Việc nhắc đã tự động: **báo cáo tháng** (`docs/bao-cao-thang.md`) liệt kê các bài tag
"Tầm soát" đã xuất bản mà công cụ chưa dùng làm nguồn. Có bài trong danh sách đó là lúc
thêm quy tắc: soạn dòng mới vào bảng này, bác sĩ duyệt trên PR, rồi thêm code + test.
