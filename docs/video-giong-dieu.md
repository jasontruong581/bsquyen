# Quy tắc giọng điệu cho video Kiến thức (Reels)

Áp dụng cho mọi video trong `video/` (V001 trở đi). Nội dung y tế là YMYL, nên "vui" luôn có ranh giới.

## Mục tiêu

Khoảng 80% giải trí, 20% thông tin, nhưng giải trí chỉ nằm ở phần cơ chế sinh học. Người xem phải nhớ được ý chính sau vài chục giây và không bao giờ thấy bệnh nặng bị đem ra đùa. Một người nhà đang chăm bệnh nhân ung thư xem video này không được thấy khó chịu.

## Quy tắc giọng điệu

1. Phân vùng nội dung: vui ở phần cơ chế (cấu tạo, vi khuẩn, enzyme, cách xét nghiệm); nghiêm và trầm lại ở phần hậu quả (viêm nặng, ung thư, di căn, tử vong, điều trị nặng).
2. Trong vòng 2 giây trước và sau mỗi lần xuất hiện chữ "ung thư", "di căn", "tử vong", "giai đoạn muộn" (cả lời đọc, phụ đề, nhãn và biểu đồ), cũng như mọi khung đang hiện tế bào bất thường: nhân vật không cười, không nói đùa, không có bong bóng thoại hài, không có hiệu ứng âm thanh vui. Nhân vật được phép có mặt lo, nhìn sang bên hoặc rời khỏi khung.
3. Nhân vật gây bệnh (vi khuẩn, tế bào lạ) được tinh nghịch, lém lỉnh, ngạo nghễ nhẹ khi đang kể cơ chế. Không được hả hê, cười lớn hay cổ vũ khi mô bị tổn thương hoặc bệnh nặng lên.
4. Không đùa trên cơ thể người bệnh: không vẽ mặt người bệnh, không bệnh nhân hoạt hình đau đớn. Chỉ cơ quan hoặc vi khuẩn được khó chịu, và chỉ ở mức nhẹ (toát mồ hôi, nhăn mặt).
5. Trấn an trước, vui sau: ngay sau đoạn nặng luôn có tin tốt hoặc hành động cụ thể (xét nghiệm, tầm soát) rồi nhân vật mới được đùa lại.
6. Cảnh kết nghiêm vừa đủ: danh sách việc nên làm, lời nhắc đi khám với bác sĩ. Câu chốt vui nhẹ chỉ nói về cơ thể hoặc thói quen, không nói về bệnh.
7. Nếu chủ đề trực tiếp về ung thư (tầm soát, triệu chứng, điều trị), giảm vai nhân vật phản diện biết cười; dùng nhân vật dẫn chuyện (cơ quan, tế bào khoẻ).

## Câu thoại

Nên dùng: tự giễu của nhân vật, ví von đời thường (áo mưa, nút chai), "lộ rồi", "chuyện nhỏ", câu hỏi tò mò, câu nói về chính nhân vật ("Ở đây ấm, ở lì thôi~").

Không nên dùng: câu nói về nạn nhân hoặc mô đang bị tổn thương ("vui ghê" khi mô viêm), mỉa mai bệnh, đùa về cái chết, chê người không đi khám, coi bệnh là "chuyện nhỏ" khi thật ra cần theo dõi.

Bong bóng phụ như tiếng la ("Á á á!") để nhỏ (khoảng 70% cỡ bong bóng thường, `size` trong `video/src/common/bubble.tsx`) và âm báo bong bóng nhỏ hơn bình thường; không thêm tiếng ồn.

## Kiểm tra trước khi xuất

- Tua từng khung có chữ "ung thư" hoặc tế bào bất thường (xuất khung dày bằng ffmpeg, ví dụ `-vf fps=2,scale=240:-1,tile=6x5`) và xác nhận không nhân vật nào đang cười hoặc nói; nếu có thì sửa.
- Soát chuyển cảnh: hình của cảnh trước (nhất là tế bào bất thường) phải tắt hẳn trước khi phụ đề của cảnh sau hiện; thẻ trượt vào không được thò ra mép trước mốc xuất hiện.
- Nghe giọng đọc: không tươi tỉnh khi đọc "ung thư"; không có tiếng cười hay âm báo vui đè lên đoạn nặng.
- Kiểm tra bố cục an toàn Reels và câu kết (bên dưới).

## Ranh giới YMYL cố định

- Không hứa hẹn kết quả điều trị.
- Không dùng testimonial bệnh nhân.
- Không bịa số liệu; số liệu phải có nguồn và ghi nguồn trên hình khi là biểu đồ.
- Không nêu tên bác sĩ trong video đăng trên page "Hiểu Đúng Y Khoa" (watermark là tên page).
- Có dòng thông tin tham khảo, không thay thế tư vấn của bác sĩ.

## Chất lượng hình 2D

Áp dụng từ V004 (chủ kênh nhận xét V003 "hơi sơ sài": hình nhỏ, giản lược, chuyển cảnh mờ dần và thẻ chữ chen vào). Chuẩn so sánh là video mẫu "Bs Y khoa" của chủ kênh.

1. **Cỡ chủ thể:** cơ quan hoặc cảnh chính chiếm 60-70% chiều ngang khung, trong vùng an toàn y 250-1150; được tràn ra ngoài khi zoom gần.
2. **Một mô hình, camera liên tục:** cả video dựa trên một mô hình chính, thêm hoặc tách bộ phận dần; camera zoom, pan, xoay (nội suy Hermite để không khựng ở mốc). Không mờ dần sang cảnh khác; chuyển hẳn sang mô hình khác tối đa một lần mỗi video.
3. **Chi tiết giải phẫu:** mỗi cơ quan có ít nhất 3 lớp (viền, mảng chuyển màu, vùng sáng và bóng) và có cấu trúc bên trong khi zoom vào (phế quản, nếp niêm mạc, tiểu thùy...). Phần không nói tới làm mờ khoảng 30-40%.
4. **Nền có không gian:** gradient, hạt bay chậm, thân người mờ phía sau (xương sườn, mạch, cơ quan khác, thị sai). Không để nền trơn một màu.
5. **Thẻ chữ và biểu đồ:** tối đa 2 mỗi video. Nhãn khác đặt ngay trên hình (đường chỉ hoặc huy hiệu gắn vào bộ phận), không dùng khung riêng che hình.
6. **Chuyển động phụ:** cơ quan luôn có nhịp nhẹ (phập phồng, dòng máu, nhu động), camera luôn trôi nhẹ. Không khung nào đứng yên quá 1 giây.
7. **Tự kiểm:** xuất khung (`fps=1/2` toàn video, `fps=4` 3 giây đầu) và so với video mẫu. Khung nào có hơn 40% diện tích là nền trống (trừ vùng dành cho giao diện Reels, y 1450 trở xuống) thì sửa. Khung kết (thương hiệu) là ngoại lệ.

Khuôn tham chiếu: `video/V004 - 2026-11-26 - gan-tham-lang/canh/` (`World.tsx` camera Hermite, nền, thân mờ, tiểu thùy; `Gan.tsx` nhân vật là chính cơ quan).

## Kỹ thuật

- Phát âm: từ tiếng Anh và từ viết tắt khai báo trong khối `phat_am` của `script.json` theo phiên âm Việt (ví dụ `"HP": "hát pê"`, `"Follow": "phô lô"`); phụ đề vẫn hiện chữ gốc. Nghe lại sau khi tạo giọng.
- Bố cục an toàn Reels (khung 1080x1920, hằng số ở `video/src/common/layout.ts`): phụ đề nằm ở khoảng 60 đến 68% chiều cao (y 1150 đến 1300), lề phải chừa 160px cho cột nút, từ y 1450 trở xuống chỉ là nền, hình quan trọng nằm trong y 250 đến 1150.
- Câu kết bắt buộc, đọc thành lời và hiện phụ đề: "Follow để hiểu rõ hơn về cơ thể mình nhé!"
- Hình mặc định là 2D (SVG trong Remotion). Chủ đề cần chiều sâu (cấu trúc cơ quan, chuyển động không gian) thì dùng 3D bằng three.js.
