# Phase 3 — Bot tóm tắt duyệt trên PR bài viết

Bác sĩ đọc và duyệt PR trên GitHub (user xác nhận 27/09), nên làm dạng **comment trên PR**.

## Việc

GitHub Action chạy khi PR đụng `kien-thuc/*.md`, đăng **một comment duy nhất** (sửa
lại comment cũ khi PR có commit mới, không spam):

1. Caption Facebook đúng như sẽ đăng + đánh dấu **125 ký tự đầu** người đọc thấy trước.
2. Ảnh Facebook, ảnh OG, thumbnail — hiện thẳng trong comment.
3. Nguồn tham khảo kèm trạng thái link (còn sống / chết / chuyển hướng).
4. Cảnh báo câu dễ vướng YMYL: hứa kết quả ("chữa khỏi", "100%", "khỏi hẳn"), tên bác
   sĩ trong caption, số điện thoại trong caption, thiếu field bắt buộc.
5. Checklist duyệt ngắn cho bác sĩ.

Cảnh báo chỉ để **gợi ý**, không chặn merge — bác sĩ là người quyết.

## Tiêu chí

- PR bài mới có đúng 1 comment; đẩy thêm commit thì comment được cập nhật.
- Chạy thử trên một bài có link chết giả lập → báo đúng.
- Không đụng tới PR không có file `kien-thuc/*.md`.
