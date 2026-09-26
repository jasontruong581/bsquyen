# Quy tắc công cụ "Tôi nên tầm soát gì?" — bản chờ bác sĩ duyệt

> **Trạng thái: CHỜ DUYỆT.** Chưa code công cụ khi bảng này chưa được bác sĩ duyệt.
> Bác sĩ sửa thẳng vào file này trên PR (hoặc comment từng dòng), rồi approve.

## Nguyên tắc

1. **Không có khuyến cáo nào mới.** Mọi dòng dưới đây chép từ các bài tầm soát **đã được
   bác sĩ duyệt và xuất bản**, kèm vị trí trong bài và nguồn bài đó trích. Công cụ chỉ giúp
   người đọc tìm đúng bài, đúng đoạn dành cho mình.
2. **Không chẩn đoán, không chỉ định.** Kết quả luôn viết dạng "nên **trao đổi với bác sĩ**
   về…", không bao giờ "bạn cần làm xét nghiệm X".
3. **Triệu chứng thắng tất cả.** Người đang có dấu hiệu bất thường được đưa đi khám ngay,
   không phải đọc lịch tầm soát (quy tắc R0).
4. **Không thu dữ liệu.** Công cụ chạy trên trình duyệt; câu trả lời không gửi đi đâu, kể
   cả hệ thống đo lường. Kết quả không sinh URL riêng (tuổi, tiền sử sẽ lọt vào lịch sử
   trình duyệt).

## Câu hỏi người dùng trả lời

| # | Câu hỏi | Kiểu |
|---|---|---|
| Q1 | Bạn bao nhiêu tuổi? | số |
| Q2 | Giới tính (theo sinh học) | Nữ / Nam |
| Q3 | Hiện có dấu hiệu nào dưới đây không? (danh sách R0) | có / không |
| Q4 | Người thân **trực hệ** (cha mẹ, anh chị em ruột, con) từng mắc: ung thư vú hoặc buồng trứng · ung thư đại trực tràng hoặc polyp nguy cơ cao · ung thư dạ dày · ung thư gan | chọn nhiều |
| Q5 | Bản thân bạn: viêm gan B mạn · viêm gan C · xơ gan · **chưa từng xét nghiệm viêm gan B/C** · nhiễm HP hoặc viêm loét dạ dày kéo dài · từng có polyp đại tràng · viêm ruột mạn (viêm loét đại tràng, Crohn) · suy giảm miễn dịch (HIV, thuốc ức chế miễn dịch kéo dài) · đột biến BRCA1/2 · từng xạ trị vùng ngực · hút thuốc lá hoặc uống nhiều rượu bia · chưa từng tiêm vắc-xin HPV | chọn nhiều |

Không hỏi thêm gì. Hỏi càng nhiều, người dùng càng bỏ giữa chừng, và càng gần với việc
"khám qua mạng".

## Bảng quy tắc

Cột **"Người dùng thấy"** là chữ sẽ hiện nguyên văn — đây là phần cần bác sĩ duyệt kỹ nhất.

### R0 — Đang có dấu hiệu bất thường (ưu tiên trên mọi quy tắc)

**Điều kiện:** Q3 = có. Danh sách lấy từ bài [10 dấu hiệu cảnh báo](../kien-thuc/dau-hieu-canh-bao-ung-thu.md), mục "Khi nào cần đi khám ngay": ho ra máu, nôn ra máu, đi cầu phân đen · khó thở mới xuất hiện, đau ngực tăng · đau dữ dội không giảm với thuốc giảm đau thông thường · sụt cân nhanh kèm mệt nhiều · vàng da, vàng mắt tăng trong vài ngày · hạch to nhanh kèm sốt kéo dài.

**Người dùng thấy:**
> Những dấu hiệu bạn chọn cần được bác sĩ đánh giá **sớm**, không nên chờ tới lịch tầm
> soát. Chúng cũng có thể do bệnh lành tính, nhưng bản thân triệu chứng đã đủ ảnh hưởng
> tới sức khỏe dù nguyên nhân là gì.

Kèm nút gọi / nhắn Zalo và link bài dấu hiệu cảnh báo. **Không hiện phần tầm soát bên dưới**
cho tới khi người dùng chủ động bấm "Xem thêm lịch tầm soát".

### Ung thư vú — bài [Tầm soát ung thư vú](../kien-thuc/tam-soat-ung-thu-vu.md), mục "Ai nên tầm soát và từ tuổi nào?"

| ID | Điều kiện | Người dùng thấy | Nguồn trong bài |
|---|---|---|---|
| V1 | Nữ, 40–74 tuổi | Nên **trao đổi với bác sĩ về chụp nhũ ảnh định kỳ**. Các hướng dẫn quốc tế lấy mốc 40 tuổi (USPSTF 2024: mỗi 2 năm từ 40 đến 74 tuổi). | USPSTF 2024, ACS |
| V2 | Nữ, dưới 40 tuổi, không thuộc V3 | Chưa cần chụp nhũ ảnh định kỳ. Việc nên làm là **biết vú mình bình thường thế nào** để nhận ra ngay khi có thay đổi, và đi khám khi thấy bất thường. | đoạn "Trước 40 tuổi…" |
| V3 | Nữ, mọi tuổi, **và** có: người thân vú/buồng trứng, hoặc BRCA1/2, hoặc từng xạ trị vùng ngực | Bạn thuộc nhóm **nên tầm soát sớm hơn và kỹ hơn**. Hãy mang tiền sử gia đình cụ thể tới gặp bác sĩ để có kế hoạch riêng — đừng tự đặt lịch theo bài viết. | danh sách "Bạn nên tầm soát sớm hơn…" |

### Ung thư cổ tử cung — bài [Tầm soát ung thư cổ tử cung](../kien-thuc/tam-soat-ung-thu-co-tu-cung.md), mục "Ai nên tầm soát và từ tuổi nào?"

| ID | Điều kiện | Người dùng thấy | Nguồn trong bài |
|---|---|---|---|
| C1 | Nữ, 21–65 tuổi | Nên **trao đổi với bác sĩ về tầm soát ung thư cổ tử cung** và lặp lại đều đặn theo lịch. Tùy phương pháp, các hướng dẫn bắt đầu từ 21 tuổi (Pap) hoặc 30 tuổi (xét nghiệm HPV). | WHO, USPSTF |
| C2 | Nữ, từ 25 tuổi, **và** suy giảm miễn dịch | Nhóm suy giảm miễn dịch **nên tầm soát sớm hơn và dày hơn** (WHO: từ 25 tuổi, mỗi 3–5 năm). Hãy trao đổi với bác sĩ về lịch riêng. | WHO |
| C3 | Nữ, **và** chưa từng tiêm vắc-xin HPV | Người lớn chưa tiêm vắc-xin HPV **vẫn có thể tiêm ở nhiều độ tuổi**, dù lợi ích thấp hơn tiêm sớm. Nên hỏi bác sĩ xem với tuổi và hoàn cảnh của bạn thì còn đáng tiêm đến đâu. | bài [Vắc-xin phòng ung thư](../kien-thuc/vac-xin-phong-ung-thu.md), mục "Tiêm phòng gồm những gì?" |

### Ung thư đại trực tràng — bài [Tầm soát ung thư đại trực tràng](../kien-thuc/tam-soat-ung-thu-dai-truc-trang.md), mục "Ai cần tầm soát…"

| ID | Điều kiện | Người dùng thấy | Nguồn trong bài |
|---|---|---|---|
| D1 | Mọi giới, từ 45 tuổi | Nên **trao đổi với bác sĩ về tầm soát ung thư đại trực tràng**. Các hướng dẫn quốc tế khuyến cáo bắt đầu từ 45 tuổi với người nguy cơ trung bình. | ACS, USPSTF |
| D2 | Mọi tuổi, **và** có: người thân đại trực tràng/polyp, hoặc bản thân từng có polyp, hoặc viêm ruột mạn | Bạn thuộc nhóm **cần bắt đầu sớm hơn** mốc 45 tuổi. Hãy trao đổi kỹ với bác sĩ về thời điểm và phương pháp. | danh sách "Cần bắt đầu sớm hơn…" |

### Ung thư gan — bài [Tầm soát ung thư gan](../kien-thuc/tam-soat-ung-thu-gan.md), mục "Ai nên tầm soát và bao lâu một lần?"

| ID | Điều kiện | Người dùng thấy | Nguồn trong bài |
|---|---|---|---|
| G1 | Có: viêm gan B mạn, hoặc viêm gan C, hoặc xơ gan, hoặc người thân trực hệ ung thư gan | Nên **trao đổi với bác sĩ về lịch theo dõi gan định kỳ**. Với nhóm nguy cơ, các hướng dẫn chuyên khoa khuyến cáo siêu âm bụng khoảng 6 tháng một lần, có thể kèm xét nghiệm máu AFP. | hướng dẫn chuyên khoa gan mật |
| G2 | Chưa từng xét nghiệm viêm gan B/C, **và** không thuộc G1 | Việc nên làm trước tiên là **xét nghiệm viêm gan B và C một lần**, để biết mình có thuộc nhóm cần theo dõi gan hay không. | đoạn cuối mục |

### Ung thư dạ dày — bài [Tầm soát ung thư dạ dày](../kien-thuc/tam-soat-ung-thu-da-day.md), mục "Ai nên cân nhắc tầm soát…"

| ID | Điều kiện | Người dùng thấy | Nguồn trong bài |
|---|---|---|---|
| DD1 | Mọi giới, từ 40 tuổi | Từ khoảng 40 tuổi là mốc hợp lý để **bắt đầu trao đổi với bác sĩ về tầm soát ung thư dạ dày**. Việt Nam chưa có chương trình tầm soát toàn dân, nhưng người Việt có xu hướng mắc bệnh ở độ tuổi trẻ hơn phương Tây. | nghiên cứu dịch tễ trích trong bài |
| DD2 | Mọi tuổi, **và** có: nhiễm HP hoặc viêm loét dạ dày kéo dài, hoặc người thân ung thư dạ dày, hoặc hút thuốc / rượu bia nhiều | Bạn thuộc nhóm **nên cân nhắc tầm soát sớm và kỹ hơn**. Hãy trao đổi với bác sĩ. | danh sách "Bạn nên cân nhắc tầm soát sớm…" |

### Luôn hiện ở cuối kết quả

> Kết quả này chỉ giúp bạn biết **nên hỏi bác sĩ về điều gì**, dựa trên các hướng dẫn phổ
> biến. Nó không phải chẩn đoán và không thay thế việc thăm khám. Mỗi người có hoàn cảnh
> riêng — bác sĩ sẽ quyết định cụ thể sau khi khám.

Kèm nút nhắn Zalo và link tới từng bài tầm soát liên quan.

## Câu hỏi cần bác sĩ trả lời trước khi code

Các bài hiện có **không nói rõ** những trường hợp dưới đây. Công cụ sẽ không tự đoán — cần
bác sĩ quyết định hiển thị gì:

1. **Nữ trên 74 tuổi** (vú) và **nữ trên 65 tuổi** (cổ tử cung): bài chỉ nêu khoảng tuổi, không
   nói sau mốc đó thì sao. Đề xuất: "Trao đổi với bác sĩ xem có nên tiếp tục tầm soát" — bác
   sĩ đồng ý không?
2. **Đại trực tràng trên 75 tuổi:** bài không nêu mốc dừng. Để giống D1, hay thêm câu như trên?
3. **Nam giới:** có ung thư nào cần gợi ý riêng không? Hiện chỉ có đại trực tràng, gan, dạ
   dày — đều không phân biệt giới. (Chưa có bài tầm soát tuyến tiền liệt.)
4. **Ung thư phổi cho người hút thuốc lâu năm:** hàng đợi có bài `tam-soat-ung-thu-phoi` nhưng
   **chưa xuất bản**. Đề xuất: chưa đưa vào công cụ, thêm quy tắc khi bài đó được duyệt.
5. **Tuổi dưới 18:** đề xuất công cụ chỉ nhận từ 18 tuổi, dưới 18 hiện "Công cụ dành cho người
   lớn — hỏi bác sĩ nhi hoặc bác sĩ gia đình". Tiêm HPV cho trẻ 9–14 tuổi đã có trong bài vắc-xin.
6. **Văn phong** của cột "Người dùng thấy": có câu nào bác sĩ muốn nói khác đi không?
7. **Q5 cố ý bỏ bớt vài yếu tố ít gặp** mà các bài có nêu, để form ngắn: hội chứng di truyền
   (Lynch, đa polyp gia đình FAP), đã điều trị ung thư đại trực tràng, tổn thương tiền ung thư
   dạ dày (viêm teo, dị sản ruột), từng cắt một phần dạ dày, sinh thiết vú bất thường, từng bị
   ung thư vú một bên, bệnh gan nền kèm gan nhiễm mỡ. Người có các tình trạng này thường đã
   được bác sĩ theo dõi sẵn. Bác sĩ muốn thêm mục nào vào không?

## Sau khi duyệt

Code công cụ tại `/cong-cu/tam-soat/`, thêm mục menu "Công cụ". Mỗi quy tắc ở trên thành một
test tự động, để quy tắc trong code không bao giờ lệch khỏi bảng đã duyệt.
