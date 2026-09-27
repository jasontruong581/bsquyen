// Cấu hình Eleventy: chỉ sinh mục /kien-thuc/ từ Markdown,
// toàn bộ site tĩnh hiện có được passthrough copy nguyên trạng.
module.exports = function (eleventyConfig) {
  // Site tĩnh hiện có — copy nguyên trạng vào _site
  [
    "index.html",
    "css",
    "js",
    "assets",
    "bsquyen",
    "demo",
    "landing-mix",
    "landing-page-bundle",
    "robots.txt",
  ].forEach((path) => eleventyConfig.addPassthroughCopy(path));

  // Không quét các thư mục không thuộc website
  eleventyConfig.ignores.add("docs/**");
  eleventyConfig.ignores.add("plans/**");
  eleventyConfig.ignores.add("README.md");
  // Hướng dẫn nội bộ — không được thành trang public (trước đây lọt ra /CLAUDE/)
  eleventyConfig.ignores.add("CLAUDE.md");
  // Skill Claude Code: chứa .md có frontmatter mẫu, không phải nội dung site
  eleventyConfig.ignores.add(".claude/**");

  // Bài viết Kiến thức: mọi file markdown trong kien-thuc/, mới nhất trước
  eleventyConfig.addCollection("baiviet", (api) =>
    api.getFilteredByGlob("kien-thuc/*.md").sort((a, b) => b.date - a.date)
  );

  // Định dạng ngày kiểu Việt Nam: 24/07/2026 (dữ liệu ngày của 11ty ở UTC)
  eleventyConfig.addFilter("ngayVN", (d) =>
    new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(d)
  );

  // Ngày dạng ISO cho schema.org / sitemap
  eleventyConfig.addFilter("ngayISO", (d) => new Date(d).toISOString().split("T")[0]);

  // Gắn id cho mọi <h2> trong bài Markdown để mục lục và link chia sẻ trỏ thẳng tới
  // từng phần. Làm lúc build (không phải bằng JS) nên link #muc vẫn chạy khi tắt JS.
  // Dùng chung slugify với URL trang chủ đề, nên "Dạ dày" → "da-day" như ở mọi chỗ khác.
  eleventyConfig.amendLibrary("md", (md) => {
    const slugify = eleventyConfig.getFilter("slugify");
    md.core.ruler.push("id_cho_h2", (state) => {
      const daDung = new Set();
      state.tokens.forEach((tok, i) => {
        if (tok.type !== "heading_open" || tok.tag !== "h2" || tok.attrGet("id")) return;
        const chu = (state.tokens[i + 1].children || [])
          .filter((t) => t.type === "text" || t.type === "code_inline")
          .map((t) => t.content)
          .join("");
        const goc = slugify(chu) || "muc";
        let id = goc;
        for (let k = 2; daDung.has(id); k++) id = `${goc}-${k}`;
        daDung.add(id);
        tok.attrSet("id", id);
      });
    });
  });

  // Mục lục: danh sách {id, chu} lấy từ các <h2 id> vừa gắn ở trên.
  eleventyConfig.addFilter("mucLuc", (html) =>
    [...String(html).matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map((m) => ({
      id: m[1],
      chu: m[2].replace(/<[^>]+>/g, "").trim(),
    }))
  );

  // Thời gian đọc, tính theo tiếng (âm tiết) vì tiếng Việt tách chữ bằng khoảng trắng
  // theo từng tiếng. ~250 tiếng/phút là tốc độ đọc bình thường của người lớn.
  eleventyConfig.addFilter("thoiGianDoc", (html) => {
    const soTieng = String(html)
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.round(soTieng / 250));
  });

  // Bài liên quan: ưu tiên bài chung tag (càng nhiều tag chung càng trước, cùng mức thì
  // mới hơn trước), thiếu thì bù bằng bài mới nhất. Không bao giờ gồm chính bài đang đọc.
  eleventyConfig.addFilter("baiLienQuan", (baiViet, urlHienTai, tags, soLuong = 3) => {
    const tagBai = new Set(tags || []);
    const khac = baiViet.filter((b) => b.url !== urlHienTai);
    const chung = (b) => (b.data.tags || []).filter((t) => tagBai.has(t)).length;
    // collection đã xếp mới nhất trước; sort ổn định nên giữ thứ tự đó khi cùng số tag chung
    return [...khac].sort((a, b) => chung(b) - chung(a)).slice(0, soLuong);
  });

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
    },
    templateFormats: ["md", "njk"],
    markdownTemplateEngine: "njk",
  };
};
