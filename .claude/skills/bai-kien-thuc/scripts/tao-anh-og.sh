#!/usr/bin/env bash
# Tạo ảnh og:image 1200x630 cho bài Kiến thức từ template, tự canh cỡ chữ.
#
#   tao-anh-og.sh <slug> "<dòng tiêu đề 1>" "<dòng 2 nhấn màu>" "<phụ đề>"
#
# Ví dụ:
#   tao-anh-og.sh tam-soat-ung-thu-vu "Tầm soát ung thư" "vú" "Ai nên tầm soát và từ tuổi nào?"
#
# Xuất: assets/kien-thuc/<slug>-og.png  (1200x630)
set -euo pipefail

if [[ $# -ne 4 ]]; then
  sed -n '2,10p' "$0" >&2
  exit 2
fi

SLUG="$1"; T1="$2"; T2="$3"; SUB="$4"

# Chạy được từ bất kỳ đâu — mọi đường dẫn tính từ gốc repo
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
TEMPLATE="$SCRIPT_DIR/../templates/og-template.svg"
OUT_DIR="$REPO_ROOT/assets/kien-thuc"
OUT_PNG="$OUT_DIR/$SLUG-og.png"

[[ -f "$TEMPLATE" ]] || { echo "Không thấy template: $TEMPLATE" >&2; exit 1; }
command -v rsvg-convert >/dev/null || { echo "Cần rsvg-convert (apt install librsvg2-bin)" >&2; exit 1; }
mkdir -p "$OUT_DIR"

TMP_SVG="$(mktemp --suffix=.svg)"
trap 'rm -f "$TMP_SVG"' EXIT

# Thay placeholder + canh cỡ chữ theo độ dài (bề rộng khả dụng ~790px).
# Python lo escape XML để dấu & < > trong tiếng Việt không làm hỏng SVG.
TEMPLATE="$TEMPLATE" T1="$T1" T2="$T2" SUB="$SUB" python3 - "$TMP_SVG" <<'PY'
import os, sys
from xml.sax.saxutils import escape

out_path = sys.argv[1]
t1, t2, sub = os.environ["T1"], os.environ["T2"], os.environ["SUB"]
svg = open(os.environ["TEMPLATE"], encoding="utf-8").read()

AVAIL = 790.0  # px trống từ x=70 tới mép khối minh hoạ

def fit(text, ideal, factor, floor):
    """Cỡ chữ lớn nhất (<= ideal) mà dòng vẫn nằm trong AVAIL."""
    if not text:
        return ideal
    return max(floor, min(ideal, int(AVAIL / (len(text) * factor))))

# Hai dòng tiêu đề dùng chung một cỡ để giữ nhịp thị giác
title_size = min(fit(t1, 62, 0.58, 34), fit(t2, 62, 0.58, 34))
sub_size = fit(sub, 32, 0.50, 20)

for ph, val in (
    ("{{TITLE_1}}", escape(t1)),
    ("{{TITLE_2}}", escape(t2)),
    ("{{SUBTITLE}}", escape(sub)),
    ("{{TITLE_SIZE}}", str(title_size)),
    ("{{SUB_SIZE}}", str(sub_size)),
):
    svg = svg.replace(ph, val)

open(out_path, "w", encoding="utf-8").write(svg)

if title_size < 44 or sub_size < 24:
    print(f"  ⚠ Chữ phải thu nhỏ (tiêu đề {title_size}px, phụ đề {sub_size}px) "
          f"— nên rút ngắn để dễ đọc khi share.", file=sys.stderr)
PY

rsvg-convert -w 1200 -h 630 "$TMP_SVG" -o "$OUT_PNG"

SIZE_KB=$(( $(stat -c%s "$OUT_PNG") / 1024 ))
echo "✓ $OUT_PNG (${SIZE_KB}KB)"
[[ $SIZE_KB -le 200 ]] || echo "  ⚠ >200KB — nén lại trước khi commit." >&2
echo "  Frontmatter:  image: /assets/kien-thuc/$SLUG-og.png"
echo "  Read file PNG trên để xác nhận (một lần là đủ)."
