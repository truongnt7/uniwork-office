import type { EduMeta, EduTemplateId } from './types.js'

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function metaBlock(meta: EduMeta): string {
  const week = meta.week ? `<p><strong>Tuần:</strong> ${esc(meta.week)}</p>` : ''
  const duration =
    typeof meta.durationMinutes === 'number'
      ? `<p><strong>Thời lượng:</strong> ${meta.durationMinutes} phút</p>`
      : ''
  const objectives =
    meta.objectives.length > 0
      ? `<ul>${meta.objectives.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>`
      : '<p><em>(Điền chuẩn đầu ra / mục tiêu)</em></p>'
  return `
    <p><strong>Môn:</strong> ${esc(meta.subject)} &nbsp;|&nbsp; <strong>Lớp:</strong> ${esc(meta.grade)}</p>
    ${week}
    ${duration}
    <p><strong>Bài:</strong> ${esc(meta.lessonTitle)}</p>
    <h2>Mục tiêu / chuẩn đầu ra</h2>
    ${objectives}
  `
}

/** HTML outlines seeded into Docs tabs for education templates. */
export function eduTemplateHtml(templateId: EduTemplateId, meta: EduMeta): string | null {
  switch (templateId) {
    case 'giao-an':
      return `
        <h1>GIÁO ÁN</h1>
        ${metaBlock(meta)}
        <h2>I. Mục tiêu</h2>
        <p>Kiến thức:</p>
        <p>Năng lực:</p>
        <p>Phẩm chất:</p>
        <h2>II. Đồ dùng dạy học</h2>
        <p></p>
        <h2>III. Tiến trình dạy học</h2>
        <h3>1. Khởi động</h3>
        <p></p>
        <h3>2. Hình thành kiến thức</h3>
        <p></p>
        <h3>3. Luyện tập</h3>
        <p></p>
        <h3>4. Vận dụng / củng cố</h3>
        <p></p>
        <h2>IV. Điều chỉnh / ghi chú sau tiết</h2>
        <p></p>
      `.trim()
    case 'khdh':
      return `
        <h1>KẾ HOẠCH BÀI DẠY</h1>
        ${metaBlock(meta)}
        <h2>1. Yêu cầu cần đạt</h2>
        <p></p>
        <h2>2. Đồ dùng dạy học</h2>
        <p></p>
        <h2>3. Các hoạt động dạy học</h2>
        <table>
          <thead><tr><th>Hoạt động</th><th>Thời gian</th><th>Tổ chức</th><th>Sản phẩm</th></tr></thead>
          <tbody>
            <tr><td>Khởi động</td><td></td><td></td><td></td></tr>
            <tr><td>Khám phá</td><td></td><td></td><td></td></tr>
            <tr><td>Luyện tập</td><td></td><td></td><td></td></tr>
            <tr><td>Vận dụng</td><td></td><td></td><td></td></tr>
          </tbody>
        </table>
        <h2>4. Điều chỉnh</h2>
        <p></p>
      `.trim()
    case 'phieu-hoc-tap':
      return `
        <h1>PHIẾU HỌC TẬP</h1>
        ${metaBlock(meta)}
        <h2>Phần A — Nhận biết / thông hiểu</h2>
        <ol>
          <li></li>
          <li></li>
          <li></li>
        </ol>
        <h2>Phần B — Vận dụng</h2>
        <ol>
          <li></li>
          <li></li>
        </ol>
        <h2>Phần C — Vận dụng cao</h2>
        <ol>
          <li></li>
        </ol>
      `.trim()
    case 'slide':
    case 'ppct':
      return null
  }
}

export function eduTemplateTitle(templateId: EduTemplateId, meta: EduMeta): string {
  const map: Record<EduTemplateId, string> = {
    'giao-an': `Giáo án — ${meta.lessonTitle}`,
    khdh: `KHDH — ${meta.lessonTitle}`,
    slide: `Bài giảng — ${meta.lessonTitle}`,
    'phieu-hoc-tap': `Phiếu HT — ${meta.lessonTitle}`,
    ppct: `PPCT — ${meta.subject} ${meta.grade}`,
  }
  return map[templateId]
}
