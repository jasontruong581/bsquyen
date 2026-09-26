// Ô tìm kiếm ở /kien-thuc/ chỉ hiện khi số bài VƯỢT ngưỡng này. Corpus nhỏ thì phần lớn
// truy vấn ra 0 kết quả — người đọc hiểu là "trang không có thứ tôi cần" rồi thoát, tệ hơn
// một danh sách ngắn cuộn được (lý do đầy đủ: docs/thiet-lap-workstation.md mục 6).
//
// NGUONG_TIM_KIEM=0 npm run build  → ép hiện ô tìm kiếm để thử, không cần sửa file.
const env = process.env.NGUONG_TIM_KIEM;
module.exports = { nguong: env === undefined || env === "" ? 15 : Number(env) };
