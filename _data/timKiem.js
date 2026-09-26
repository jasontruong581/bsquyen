// Ô tìm kiếm ở /kien-thuc/ chỉ hiện khi số bài VƯỢT ngưỡng này. Corpus nhỏ thì phần lớn
// truy vấn ra 0 kết quả — người đọc hiểu là "trang không có thứ tôi cần" rồi thoát, tệ hơn
// một danh sách ngắn cuộn được (lý do đầy đủ: docs/thiet-lap-workstation.md mục 6).
//
// Ép hiện ô tìm kiếm để thử, không cần sửa file:
//   PowerShell:  $env:NGUONG_TIM_KIEM=0; npm run build
//   bash:        NGUONG_TIM_KIEM=0 npm run build
// Giá trị không phải số thì dùng 15, để gõ nhầm không làm ô tìm kiếm biến mất vĩnh viễn.
const so = Number(process.env.NGUONG_TIM_KIEM);
module.exports = {
  nguong: process.env.NGUONG_TIM_KIEM === undefined || process.env.NGUONG_TIM_KIEM === "" || Number.isNaN(so) ? 15 : so,
};
