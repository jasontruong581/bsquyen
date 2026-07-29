# Hàng đợi chủ đề bài Kiến thức

File này điều khiển routine viết bài tự động (**hàng tuần**, sáng thứ Hai).
Routine lấy chủ đề **đầu tiên trong "Hàng đợi"** mà `kien-thuc/<slug>.md` chưa tồn tại.

Nhịp thực tế do **cổng chặn** quyết định, không do lịch: routine bỏ lượt nếu đang
còn PR bài viết chờ bác sĩ duyệt. Nghĩa là tốc độ ra bài tự khớp với tốc độ duyệt,
tối đa 1 bài/tuần — không bao giờ dồn PR.

**Muốn đổi thứ tự hay chen bài gấp:** sửa thứ tự trong mục Hàng đợi. Không cần sửa routine.

- `Loại` = **khung bài** trong `.claude/skills/bai-kien-thuc/SKILL.md`
  (**A** tầm soát · **B** giải thích/gỡ hiểu lầm · **C** hướng dẫn sống chung/chăm sóc)
- `Nhóm` = **cụm chủ đề** (A–H), dùng để suy ra `tags` và `cta` — xem bảng dưới.
  Đừng lẫn với `Loại`: `Loại` quyết định cấu trúc bài, `Nhóm` quyết định tag và lời mời hành động.
- `(mùa: tháng N)` = bài gắn mốc thời sự y tế; routine ưu tiên bài này nếu tháng
  hiện tại đúng bằng N, bất kể vị trí trong hàng đợi.
- Thứ tự đã xen kẽ cụm chủ đề (tầm soát → dấu hiệu → chăm sóc giảm nhẹ → giải ảo)
  để độc giả đa dạng, không dồn một nhóm.

## Đã xuất bản — KHÔNG viết lại

| slug | chủ đề |
|---|---|
| `tam-soat-ung-thu-da-day` | Tầm soát ung thư dạ dày |
| `tam-soat-ung-thu-dai-truc-trang` | Tầm soát ung thư đại trực tràng |
| `tam-soat-ung-thu-gan` | Tầm soát ung thư gan (đã bao gồm nhóm viêm gan B/C, xơ gan) |
| `cham-soc-giam-nhe-la-gi` | Chăm sóc giảm nhẹ là gì, gỡ hiểu lầm |

## Hàng đợi

| # | slug | Chủ đề | Loại | Nhóm |
|---|---|---|---|---|
| 1 | `tam-soat-ung-thu-vu` | Tầm soát ung thư vú: tự khám, siêu âm hay nhũ ảnh? | A | A |
| 2 | `dau-hieu-canh-bao-ung-thu` | 10 dấu hiệu cảnh báo ung thư không nên bỏ qua | B | B |
| 3 | `kiem-soat-dau-ung-thu` | Kiểm soát đau ung thư: thang giảm đau 3 bậc của WHO | C | D |
| 4 | `hieu-lam-pho-bien-ve-ung-thu` | 7 hiểu lầm phổ biến nhất về bệnh ung thư | B | H |
| 5 | `tam-soat-ung-thu-co-tu-cung` | Tầm soát ung thư cổ tử cung: Pap, HPV test và vắc-xin HPV | A | A |
| 6 | `di-cau-ra-mau-tri-hay-ung-thu` | Đi cầu ra máu: trĩ hay ung thư đại tràng? | B | B |
| 7 | `morphin-co-gay-nghien-khong` | Dùng morphin có gây nghiện không? | B | D |
| 8 | `vac-xin-phong-ung-thu` | Hai loại vắc-xin giúp phòng ung thư: HPV và viêm gan B | B | C |
| 9 | `tam-soat-ung-thu-phoi` | CT ngực liều thấp — tầm soát ung thư phổi cho người hút thuốc lâu năm | A | A |
| 10 | `sut-can-khong-ro-nguyen-nhan` | Sụt cân không rõ nguyên nhân — khi nào là đáng lo? | B | B |
| 11 | `bat-dau-cham-soc-giam-nhe-khi-nao` | Nên bắt đầu chăm sóc giảm nhẹ từ khi nào? | B | D |
| 12 | `thuoc-la-va-ung-thu` | Thuốc lá gây ra bao nhiêu loại ung thư? **(mùa: tháng 5)** | B | C |
| 13 | `vi-khuan-hp-va-ung-thu-da-day` | Vi khuẩn HP và ung thư dạ dày — mối liên hệ đến đâu? | B | A |
| 14 | `nuot-nghen-nuot-vuong` | Nuốt nghẹn, nuốt vướng — dấu hiệu sớm của ung thư thực quản | B | B |
| 15 | `buon-non-non-oi-xu-tri-tai-nha` | Buồn nôn, nôn ói: xử trí tại nhà và khi nào cần nhập viện | C | D |
| 16 | `khi-nao-goi-bac-si-ngay` | Khi nào cần gọi bác sĩ ngay, khi nào cần nhập viện? | C | G |
| 17 | `xet-nghiem-dau-an-ung-thu` | Dấu ấn ung thư (CEA, CA 19-9, CA 125…) — hiểu đúng để khỏi hoang mang | B | A |
| 18 | `tu-kham-vu-dung-cach` | Sờ thấy khối ở vú — tự khám vú đúng cách từng bước **(mùa: tháng 10)** | C | B |
| 19 | `chan-an-va-suy-mon` | Chán ăn và suy mòn — hiểu để không ép ăn sai cách | C | D |
| 20 | `nhin-an-bo-doi-te-bao-ung-thu` | "Nhịn ăn để bỏ đói tế bào ung thư" — đúng hay sai? | B | F |
| 21 | `tien-su-gia-dinh-ung-thu-tam-soat` | Có người thân bị ung thư, tôi nên tầm soát từ mấy tuổi? | A | A |
| 22 | `ho-keo-dai-tren-3-tuan` | Ho kéo dài trên 3 tuần — đừng chỉ nghĩ đến viêm phổi | B | B |
| 23 | `kiet-suc-nguoi-cham-soc` | Kiệt sức người chăm sóc — dấu hiệu và cách tự bảo vệ | C | G |
| 24 | `kiem-chung-thong-tin-chua-ung-thu` | Cách kiểm chứng thông tin chữa ung thư trên mạng xã hội | B | H |

Hết hàng đợi (~6 tháng ở nhịp hàng tuần) thì đưa chủ đề từ Backlog lên và gán slug.

## Tag & CTA — suy ra từ cột `Nhóm`

Chỉ dùng **6 tag** này. Không thêm tag mới, không tag chi tiết: tag nào chỉ có 1–2 bài
thì vô dụng khi lọc. Mỗi bài **1 tag chính**; thêm tag thứ hai chỉ khi bài thật sự
phủ trọn hai cụm (ví dụ bài tầm soát gan có phần phòng ngừa dài → thêm `Phòng ngừa`).

| Nhóm | `tags` | `cta` | Vì sao CTA đó |
|---|---|---|---|
| A — Tầm soát theo cơ quan | `Tầm soát` | `tam-soat` | Người đọc đang tìm hiểu, chưa sẵn sàng đặt lịch → hỏi Zalo trước |
| B — Dấu hiệu cảnh báo | `Dấu hiệu` | *(mặc định)* | Đang lo về một triệu chứng cụ thể → CTA khám tổng quát phù hợp |
| C — Nguy cơ & phòng ngừa | `Phòng ngừa` | `tam-soat` | Cùng ý định tìm hiểu như nhóm A |
| D — Chăm sóc giảm nhẹ | `Chăm sóc giảm nhẹ` | `tai-nha` | Nhu cầu cấp bách, người bệnh khó đi lại → gọi ngay, khám tại nhà |
| E — Điều trị & tác dụng phụ | `Điều trị` | *(mặc định)* | Thường đã có bác sĩ điều trị riêng |
| F — Dinh dưỡng & phục hồi | `Dinh dưỡng` | *(mặc định)* | |
| G — Người chăm sóc | `Chăm sóc giảm nhẹ` | `tai-nha` | Người nhà đang quá tải → giống nhóm D |
| H — Dịch vụ & giải ảo | tag theo nội dung bài | *(mặc định)* | |

`cta` *(mặc định)* = bỏ trống frontmatter `cta:`, layout tự dùng bản CTA chung.

## Cần xử lý riêng — chưa đưa vào hàng đợi

| Chủ đề | Vướng gì |
|---|---|
| ~~Câu chuyện người bệnh (ẩn danh, có đồng ý)~~ | **ĐÃ BỎ HẲN — không viết, kể cả dạng ca giả định.** Quảng cáo dịch vụ khám chữa bệnh không được dùng lời chứng thực người bệnh; site đã thay "Phản hồi bệnh nhân" bằng "Cam kết đồng hành" vì lý do này. Ẩn danh + có đồng ý vẫn không gỡ được rào. Đừng đưa lại vào hàng đợi. |
| Chi phí điều trị ung thư và vai trò BHYT | Viết được, nhưng **không đưa bảng giá/con số cụ thể** — chỉ giải thích cơ chế BHYT, nhóm được chi trả, thủ tục. Giá dịch vụ là ràng buộc YMYL trong skill. |
| Thực đơn mẫu 7 ngày cho người kém ăn | Viết được, nhưng phải đóng khung là **ví dụ tham khảo**, kèm nhắc trao đổi bác sĩ/chuyên gia dinh dưỡng. Không kê đơn dinh dưỡng. |
| Sổ theo dõi triệu chứng tại nhà (kèm mẫu tải về) | Cần tạo thêm file mẫu in được (PDF/HTML). Ngoài phạm vi skill hiện tại — làm riêng. |
| Bài trụ cột 2000+ từ (dạng cẩm nang) | Skill hiện tối ưu cho bài ~900–1200 từ. Cần bổ sung khung "bài trụ cột" trước khi viết loại này. Lưu ý 4 bài trụ cột bạn nhắm (#1, #4, #6, #49) **đã xuất bản ở độ dài thường** — muốn nâng cấp thì là việc mở rộng bài cũ, không phải viết mới. |
| CTA khác nhau theo nhóm bài | Layout `_includes/layouts/bai-viet.njk` hiện dùng **một CTA cố định** cho mọi bài. Muốn CTA riêng (tầm soát → gói tầm soát; chăm sóc giảm nhẹ → khám tại nhà) thì phải thêm field frontmatter `cta:` + nhánh trong layout. Việc riêng, chưa làm. |

## Backlog

Chưa gán slug — gán khi đưa lên hàng đợi.

**A. Tầm soát theo cơ quan:** Nội soi dạ dày có đau không, chuẩn bị gì · Polyp đại tràng: cắt rồi có tái phát, bao lâu soi lại · AFP và siêu âm gan — hiểu đúng bộ đôi · Bao nhiêu tuổi nên chụp nhũ ảnh lần đầu · Tầm soát ung thư tuyến giáp: khi nào là quá mức · PSA và ung thư tuyến tiền liệt ở nam trên 50 · Tầm soát ung thư vòm họng · Ung thư khoang miệng: tổn thương cần đi khám · Tầm soát ung thư da và quy tắc ABCDE · Vì sao ung thư buồng trứng khó phát hiện sớm · Gói khám tầm soát tổng quát: chọn gì, tránh lãng phí gì

**B. Dấu hiệu cảnh báo:** Đau bụng âm ỉ kéo dài: khi nào cần nội soi · Khàn tiếng trên 2 tuần · Nổi hạch cổ lâu không xẹp · Thay đổi thói quen đi cầu kéo dài · Ra huyết âm đạo sau mãn kinh · Sốt kéo dài, bầm da, chảy máu chân răng và bệnh máu ác tính

**C. Nguy cơ & phòng ngừa:** Rượu bia và ung thư — không có ngưỡng an toàn · Thịt đỏ, thịt chế biến sẵn · Đồ nướng cháy, dầu chiên lại · Thực phẩm mốc, aflatoxin và ung thư gan · Ăn mặn, dưa muối và ung thư dạ dày · Thừa cân béo phì và 13 loại ung thư · Ít vận động · Ô nhiễm không khí và ung thư phổi ở người không hút thuốc · Ung thư có di truyền không? BRCA và hội chứng Lynch · Hóa chất nghề nghiệp · Nắng, tia UV và ung thư da · Stress và mất ngủ có gây ung thư không · Điện thoại, lò vi sóng, wifi (giải ảo) · Chế độ ăn giảm nguy cơ ung thư

**D. Chăm sóc giảm nhẹ:** Phân biệt chăm sóc giảm nhẹ và chăm sóc cuối đời · Đau thần kinh trong ung thư · Táo bón do thuốc giảm đau · Khó thở giai đoạn tiến xa · Loét tì đè cho người nằm lâu · Chăm sóc da, răng miệng tại giường · Ống thông dạ dày, ống thông tiểu tại nhà · Sống chung với hậu môn nhân tạo · Báng bụng, tràn dịch màng phổi · Mất ngủ và mê sảng · Trầm cảm và lo âu · Có nên nói thật về tiên lượng · Nói với trẻ con thế nào · Kế hoạch chăm sóc trước và nguyện vọng người bệnh · Những ngày cuối đời tại nhà · Đồng hành cùng gia đình sau mất mát

**E. Điều trị & tác dụng phụ:** Tổng quan các phương pháp điều trị · Hóa trị và tác dụng phụ thường gặp · Rụng tóc khi hóa trị · Sốt giảm bạch cầu — cấp cứu ung bướu · Xạ trị và chăm sóc da vùng chiếu · Liệu pháp miễn dịch và nhắm trúng đích · Trước/sau phẫu thuật: người nhà chuẩn bị gì · Buồng tiêm dưới da (port-a-cath) · Vì sao phải tái khám định kỳ · Ung thư tái phát · Thử nghiệm lâm sàng

**F. Dinh dưỡng & phục hồi:** Nguyên tắc dinh dưỡng cho người bệnh ung thư · Sữa cao năng lượng: khi nào cần · Nuôi ăn qua ống thông tại nhà · Vận động và phục hồi chức năng · Phù bạch huyết sau mổ ung thư vú · Thực phẩm chức năng, thuốc nam, thuốc "gia truyền" — cảnh báo

**G. Người chăm sóc:** Phân chia lịch chăm sóc trong gia đình · Tủ thuốc và vật tư cần có tại nhà

**H. Dịch vụ & giải ảo:** Khám ung bướu tại nhà diễn ra thế nào · Trường hợp nào phù hợp khám tại nhà · Chuẩn bị gì trước buổi khám tại nhà · Tư vấn từ xa cho người ở tỉnh xa · "Đụng dao kéo là ung thư lan nhanh" · Ung thư có lây không, có di truyền cho con không

## Mốc thời sự y tế để chen bài

| Mốc | Bài nên đặt vào |
|---|---|
| 4/2 — Ngày Ung thư Thế giới | bài tổng quan/giải ảo (vd 10 dấu hiệu, 7 hiểu lầm) |
| Tháng 3 — ung thư đại trực tràng | `di-cau-ra-mau-tri-hay-ung-thu`, polyp đại tràng |
| 31/5 — Ngày Thế giới không thuốc lá | `thuoc-la-va-ung-thu` |
| Tháng 10 — ung thư vú | `tu-kham-vu-dung-cach`, nhũ ảnh lần đầu |
