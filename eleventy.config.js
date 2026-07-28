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
    "llms.txt",
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
