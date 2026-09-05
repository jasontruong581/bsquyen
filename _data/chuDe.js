// Bộ chủ đề (tag) cố định của mục Kiến thức.
// Chỉ 6 giá trị này — tag lẻ chỉ có 1–2 bài thì vô dụng khi lọc.
// Thêm/bớt ở đây thì trang lọc /kien-thuc/chu-de/<slug>/ tự sinh theo.
// Đổi bộ tag này thì sửa cả bảng hashtag trong scripts/dang-facebook.mjs —
// tag không có hashtag tương ứng sẽ bị bỏ qua (job cảnh báo, không fail).
module.exports = [
  "Tầm soát",
  "Dấu hiệu",
  "Chăm sóc giảm nhẹ",
  "Điều trị",
  "Dinh dưỡng",
  "Phòng ngừa",
];
