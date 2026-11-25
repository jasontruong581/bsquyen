/* Vùng an toàn cho Facebook/Instagram Reels trên khung 1080x1920 — mọi video dùng chung.
   Reels phủ tên page + caption ở ~25% dưới, cột nút like/bình luận/chia sẻ ở bên phải, thanh trạng thái ở trên. */
export const SAFE = {
  /** Watermark thương hiệu */
  watermarkTop: 150,
  /** Nhãn lớn: đỉnh khối chữ, cao khoảng 130px */
  labelTop: 260,
  /** Hình quan trọng nằm trong khoảng y này */
  figureTop: 250,
  figureBottom: 1150,
  /** Phụ đề: đỉnh khối (cao khoảng 1150–1300) */
  captionTop: 1150,
  /** Lề phải chừa cho cột nút bên phải */
  rightMargin: 160,
  /** Từ y này trở xuống chỉ để nền */
  bgOnlyFrom: 1450,
} as const;

/** Mép phải của vùng nội dung (x) */
export const RIGHT_EDGE = 1080 - SAFE.rightMargin;
