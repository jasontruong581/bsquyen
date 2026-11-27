/* Phát âm: lời đọc có chữ viết tắt/tiếng Anh ("HP", "Follow") được thay bằng phiên âm tiếng Việt khi gửi cho TTS
   ("hát pê", "phô lô"), rồi gộp mốc thời gian các âm tiết phiên âm về lại đúng một chữ hiển thị trên phụ đề.
   Hàm thuần, không đụng file hay mạng. */

/* Dấu % thuộc về chữ ("79%" là một chữ hiển thị, khoá bảng phiên âm viết cả dấu %); các dấu câu khác chỉ bám ngoài rìa */
const EDGE = /^([^\p{L}\p{N}%]*)(.*?)([^\p{L}\p{N}%]*)$/su;

/**
 * Tách lời đọc thành các chữ hiển thị và dựng câu gửi TTS.
 * @param {string} text lời đọc gốc
 * @param {Record<string, string>} [phatAm] bảng {chữ hiển thị: phiên âm}
 * @returns {{ttsText: string, tokens: {text: string, n: number}[]}}
 *   tokens[i].text là chữ hiển thị (giữ dấu câu), tokens[i].n là số âm tiết TTS tương ứng
 */
export function buildPhatAm(text, phatAm = {}) {
  const tokens = [];
  const spoken = [];
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    const [, pre, core, post] = EDGE.exec(raw);
    const say = Object.hasOwn(phatAm, core) ? phatAm[core].trim().split(/\s+/).filter(Boolean) : null;
    if (!say) {
      tokens.push({text: raw, n: 1});
      spoken.push(raw);
      continue;
    }
    tokens.push({text: raw, n: say.length});
    say.forEach((syl, i) => spoken.push((i === 0 ? pre : '') + syl + (i === say.length - 1 ? post : '')));
  }
  return {ttsText: spoken.join(' '), tokens};
}

/**
 * Gộp các chữ TTS (đã có mốc thời gian, theo thứ tự câu gửi đi) về các chữ hiển thị.
 * Chữ hiển thị lấy t0 của âm tiết đầu và t1 của âm tiết cuối trong cụm phiên âm.
 * @param {{text: string, t0: number, t1: number}[]} ttsWords
 * @param {{text: string, n: number}[]} tokens kết quả của buildPhatAm
 */
export function mergePhatAm(ttsWords, tokens) {
  const need = tokens.reduce((s, t) => s + t.n, 0);
  if (need !== ttsWords.length) throw new Error(`Số chữ TTS (${ttsWords.length}) không khớp lời đọc (${need})`);
  let k = 0;
  return tokens.map((t) => {
    const first = ttsWords[k];
    const last = ttsWords[k + t.n - 1];
    k += t.n;
    return {text: t.text, t0: first.t0, t1: last.t1};
  });
}
