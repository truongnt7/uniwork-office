/**
 * Generate a Vietnamese Word overview of UniWork Office (uniOffice) for personal use.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from 'docx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, 'UniOffice-Tong-Hop-Tinh-Nang-Ca-Nhan.docx')

const ACCENT = '0F7FFF'
const INK = '0F172A'
const MUTE = '475569'
const SOFT = 'F1F5F9'
const LINE = 'E2E8F0'

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, color: INK, font: 'Calibri', size: 32 })],
  })
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 100 },
    children: [new TextRun({ text, bold: true, color: ACCENT, font: 'Calibri', size: 26 })],
  })
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 80 },
    children: [new TextRun({ text, bold: true, color: INK, font: 'Calibri', size: 22 })],
  })
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    children: [
      new TextRun({
        text,
        font: 'Calibri',
        size: 21,
        color: opts.mute ? MUTE : INK,
        italics: Boolean(opts.italics),
        bold: Boolean(opts.bold),
      }),
    ],
  })
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 60, line: 276 },
    children: [new TextRun({ text, font: 'Calibri', size: 21, color: INK })],
  })
}

function bulletBoldLead(lead, rest) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { after: 60, line: 276 },
    children: [
      new TextRun({ text: lead, font: 'Calibri', size: 21, color: INK, bold: true }),
      new TextRun({ text: rest, font: 'Calibri', size: 21, color: INK }),
    ],
  })
}

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width ?? 4500, type: WidthType.DXA },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: ACCENT } : opts.soft ? { type: ShadingType.CLEAR, fill: SOFT } : undefined,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      left: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      right: { style: BorderStyle.SINGLE, size: 4, color: LINE },
    },
    children: [
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text,
            font: 'Calibri',
            size: opts.header ? 20 : 19,
            bold: Boolean(opts.header || opts.bold),
            color: opts.header ? 'FFFFFF' : INK,
          }),
        ],
      }),
    ],
  })
}

function twoColTable(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows: [
      new TableRow({
        children: [cell('Nhóm / hạng mục', { header: true, width: 2800 }), cell('Nội dung', { header: true, width: 6560 })],
      }),
      ...rows.map(
        ([a, b], i) =>
          new TableRow({
            children: [
              cell(a, { bold: true, soft: i % 2 === 0, width: 2800 }),
              cell(b, { soft: i % 2 === 0, width: 6560 }),
            ],
          }),
      ),
    ],
  })
}

const doc = new Document({
  styles: {
    default: {
      document: {
        styles: [
          {
            id: 'Normal',
            name: 'Normal',
            run: { font: 'Calibri', size: 21, color: INK },
            paragraph: { spacing: { after: 120, line: 276 } },
          },
        ],
      },
    },
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: convertInchesToTwip(0.28), hanging: convertInchesToTwip(0.18) } } },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: '–',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.85),
            bottom: convertInchesToTwip(0.85),
            left: convertInchesToTwip(0.95),
            right: convertInchesToTwip(0.95),
          },
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: 'UNIOFFICE / UNIWORK OFFICE', bold: true, color: ACCENT, font: 'Calibri', size: 20, characterSpacing: 120 }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: 'Bản tổng hợp tính năng nền tảng dành cho cá nhân',
              bold: true,
              color: INK,
              font: 'Calibri',
              size: 36,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: 'Bộ Office AI cài trên máy · Workbench đời sống & công việc · uniAI hỗ trợ sâu',
              color: MUTE,
              font: 'Calibri',
              size: 21,
              italics: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 280 },
          children: [
            new TextRun({
              text: `Phiên bản tài liệu: ${new Date().toLocaleDateString('vi-VN')} · Dành cho tư vấn / bán Personal`,
              color: MUTE,
              font: 'Calibri',
              size: 18,
            }),
          ],
        }),

        h1('1. Giới thiệu ngắn'),
        p(
          'UniOffice (UniWork Office) là nền tảng làm việc cá nhân dạng ứng dụng desktop cài trực tiếp trên máy người dùng. Hệ thống kết hợp bộ Office AI đầy đủ (Docs, Sheets, Slides, PDF, Markdown, HTML) với Workbench quản lý đời sống–công việc và trợ lý uniAI / My AI. Dữ liệu Workbench và file local ưu tiên lưu trên máy; AI chạy theo nhu cầu (Token Hub / BYOK), không bắt buộc đẩy dữ liệu đời sống lên cloud.',
        ),
        p(
          'Tài liệu này tổng hợp các nhóm tính năng chính, điểm nổi bật, tính năng hữu dụng cao, ưu điểm hệ thống, năng lực AI chuyên sâu và mô hình bảo mật khi triển khai tại máy khách hàng.',
          { mute: true, italics: true },
        ),

        h1('2. Các nhóm tính năng chính'),
        p('Nền tảng được tổ chức thành các nhóm lớn, dùng chung một shell desktop thống nhất:'),

        h2('2.1. Bộ Office AI (soạn thảo & tài liệu)'),
        bulletBoldLead('AI Docs — ', 'Soạn thảo văn bản, mẫu giáo dục/công việc, seed HTML, xuất Word/PDF; AI hỗ trợ viết, tóm tắt, chỉnh sửa.'),
        bulletBoldLead('AI Sheets — ', 'Bảng tính kiểu Excel, phân tích số liệu, import/export, QA bằng ngôn ngữ tự nhiên.'),
        bulletBoldLead('AI Slides — ', 'Tạo deck thuyết trình: lập dàn bài → người dùng duyệt/sửa → sinh slide; thư viện template & kỹ năng generate_deck.'),
        bulletBoldLead('PDF — ', 'Xem/sửa PDF, chuyển đổi, chú thích; AI hỗ trợ xử lý nội dung PDF.'),
        bulletBoldLead('Markdown & HTML — ', 'Soạn tài liệu kỹ thuật / dashboard HTML trong cùng hệ sinh thái file.'),
        bulletBoldLead('Gói Tri thức (Knowledge packs) — ', 'Thư viện gói công việc với Tài liệu theo vai trò, Kỹ năng AI tái sử dụng, Soạn mới từ mẫu.'),

        h2('2.2. Workbench — không gian làm việc cá nhân'),
        bulletBoldLead('Nhóm Chính: ', 'Không gian của tôi (Desk), Công việc, Lịch, Biểu mẫu, Ghi chú, Email, lối tắt Trợ lý AI.'),
        bulletBoldLead('Nhóm Đời sống: ', 'Hồ sơ cá nhân, Tài chính cá nhân, Sự kiện, Sức khoẻ, Phát triển bản thân, Gia đình, Bạn bè, Thú cưng, Du lịch.'),
        bulletBoldLead('Nhóm Công việc / chuyên môn: ', 'Khách hàng, Hợp đồng, Vụ việc (pháp lý); module giáo dục (học sinh, phụ huynh, điểm, điểm danh, TKB, ngân hàng câu hỏi) khi dùng vai trò Giáo viên.'),
        bullet('Dữ liệu list Workbench có thể Xuất Excel (.xlsx) và mở trong Sheets.'),

        h2('2.3. uniAI / My AI (trợ lý trong shell)'),
        bullet('Chat tự nhiên (opt-in) khi câu hỏi không phải lệnh rõ; chọn model OpenRouter/UniAI mới nhất.'),
        bullet('Định tuyến lệnh rõ (mở tab, tạo task/lịch, soạn Docs/Slides…) vẫn ưu tiên router hành động.'),
        bullet('Tóm tắt / báo cáo có cấu trúc: thẻ summary + biểu đồ + Xuất Docs / Tạo slide / Chia sẻ.'),
        bullet('Đính kèm file/ảnh để tóm tắt hoặc làm việc trên ngữ cảnh máy.'),
        bullet('Ngữ cảnh on-device: lịch, việc, gói tài liệu, hồ sơ cá nhân…'),

        h2('2.4. Vai trò thực hành (Practice modes)'),
        bullet('Giáo viên, Hiệu trưởng, Luật sư/Pháp lý, Kinh doanh, Đầu tư–Mua sắm, Xây dựng…'),
        bullet('Mỗi vai trò có mẫu tài liệu, kỹ năng AI và module Workbench phù hợp.'),

        h2('2.5. Hệ thống & vận hành'),
        bullet('Cài macOS / Windows (desktop Electron); theme sáng–tối; đa ngôn ngữ UI.'),
        bullet('Backup/restore local (JSON / SQLite Workbench); quản lý license & thiết bị theo gói.'),
        bullet('Tùy chọn Bridge cloud (Personal+) để mở/lưu Work Product lên UniWork khi người dùng chủ động.'),

        h1('3. Tính năng nổi bật'),
        twoColTable([
          ['Office AI all-in-one', 'Một shell mở Docs / Sheets / Slides / PDF / MD / HTML — không nhảy giữa nhiều phần mềm rời.'],
          ['Slides từ dàn bài', 'AI lập outline, người dùng chỉnh rồi mới sinh slide — kiểm soát nội dung thuyết trình.'],
          ['My AI → Docs & Slides', 'Từ báo cáo/tóm tắt My AI: xuất Docs hoặc tạo slide deck chỉ với một nút.'],
          ['Workbench đời sống', 'Tài chính, sức khoẻ, gia đình, thú cưng, du lịch… gắn với cùng môi trường làm việc.'],
          ['Desk (My Space)', 'Tổng hợp việc & đời sống: chỉ số, nhắc việc, biểu đồ trên một mặt bàn.'],
          ['Email tích hợp AI', 'Gmail / Outlook / IMAP + AI hỗ trợ soạn thư trong Workbench.'],
          ['Xuất Excel list tabs', 'Mọi tab danh sách (việc, lịch, gia đình, du lịch, KH…) xuất .xlsx mở ngay trong Sheets.'],
          ['Model picker hiện đại', 'Chat tự nhiên chọn Claude / GPT / Gemini / DeepSeek / Kimi / Grok… qua OpenRouter.'],
        ]),

        h1('4. Tính năng hữu dụng cao (dùng hàng ngày)'),
        h3('Làm việc & năng suất'),
        bullet('Công việc: List / Kanban / Lịch / Dashboard; ưu tiên, hạn, tag, đính kèm.'),
        bullet('Lịch: xem calendar hoặc danh sách; đồng bộ sự kiện theo vai trò.'),
        bullet('Ghi chú ghim (sticky) kéo–thả trên bảng.'),
        bullet('Biểu mẫu & hồ sơ cá nhân để điền nhanh khi soạn văn bản.'),
        bullet('Tri thức + Tài liệu theo gói: giữ ngữ cảnh bài giảng / dự án / vụ việc.'),

        h3('Đời sống cá nhân'),
        bullet('Tài chính: mục tiêu tiết kiệm, chi tiêu theo danh mục, theo dõi đầu tư.'),
        bullet('Sức khoẻ: chỉ số (cân, huyết áp, ngủ…), chạy bộ, yoga, thể thao, ăn kiêng, IF, ăn chay.'),
        bullet('Gia đình: thành viên, đồng hành cùng con, thuốc, chi tiêu nhà, gia phả, cột mốc.'),
        bullet('Bạn bè: hồ sơ, sự kiện, kỷ niệm / sinh nhật.'),
        bullet('Thú cưng: hồ sơ, album ảnh, lịch chăm sóc — lưu trên máy.'),
        bullet('Du lịch: chuyến đi, checklist chuẩn bị, hành trình; soạn Docs gắn gói Tài liệu.'),

        h3('Chuyên môn / giáo dục (khi bật)'),
        bullet('Giáo viên: học sinh–phụ huynh, sổ điểm, điểm danh, TKB, ngân hàng câu hỏi + Excel IO.'),
        bullet('Pháp lý: khách hàng, hợp đồng, vụ việc + soạn brief Docs.'),

        h1('5. Các ưu điểm hệ thống'),
        bulletBoldLead('Cài trên máy khách — ', 'file Office và dữ liệu Workbench ưu tiên local; làm việc được khi AI/cloud offline (soạn thảo & Workbench).'),
        bulletBoldLead('Một nền tảng thay nhiều app — ', 'Office + quản trị đời sống + trợ lý AI trong một cửa sổ.'),
        bulletBoldLead('AI có kiểm soát — ', 'lệnh rõ đi router hành động; chat tự nhiên chỉ khi opt-in; tạo slide có bước duyệt dàn bài.'),
        bulletBoldLead('Vai trò thực tế — ', 'không chỉ “chatbot”; có mẫu & kỹ năng theo nghề (GV, luật, mua sắm…).'),
        bulletBoldLead('Xuất nhập thân thiện — ', 'Excel cho list; Docs/Slides từ tóm tắt; backup local.'),
        bulletBoldLead('Thương hiệu & UI đồng bộ — ', 'theme, i18n, accent theo app; trải nghiệm desktop native.'),
        bulletBoldLead('Mở rộng có lộ trình — ', 'Free → Personal (Bridge) → Pro/Team; Token Hub mua thêm khi cần.'),

        h1('6. Năng lực xử lý AI chuyên sâu'),
        h2('6.1. Lớp trợ lý shell (uniAI / My AI)'),
        bullet('Hiểu ngôn ngữ tự nhiên tiếng Việt / Anh; trả lời ngắn, gợi ý hành động tiếp theo.'),
        bullet('Tóm tắt tệp đính kèm và ngữ cảnh máy thành báo cáo có cấu trúc (sections, next actions, chart).'),
        bullet('Biểu đồ tóm tắt (cột / donut) chất lượng dashboard; xuất kèm SVG khi mở Docs.'),
        bullet('Chuyển báo cáo → AI Slides (generate_deck + review outline) hoặc AI Docs.'),
        bullet('Chọn model mạnh (Claude Opus/Sonnet 5.5, GPT-5.6, Gemini 3.x, DeepSeek V4, …) hoặc Auto.'),

        h2('6.2. AI trong từng app Office'),
        bulletBoldLead('Docs: ', 'viết/chỉnh đoạn, tóm tắt, điền mẫu, tạo báo cáo từ brief.'),
        bulletBoldLead('Sheets: ', 'hỏi–đáp số liệu, gợi ý công thức/phân tích, hỗ trợ nhập liệu.'),
        bulletBoldLead('Slides: ', 'lập kế hoạch deck, sinh trang theo style skill, chỉnh trang/element bằng tool chuyên biệt.'),
        bulletBoldLead('PDF / MD / HTML: ', 'hỗ trợ đọc–sửa–chuyển đổi trong luồng AI panel chung.'),

        h2('6.3. Kỹ năng & workflow theo vai trò'),
        bullet('Skill domains + prompt tái sử dụng trong pillar Kỹ năng.'),
        bullet('Workflow giáo dục (giáo án → slide → phiếu), pháp lý (rà soát HĐ, tóm tắt vụ…), mua sắm (RFQ, so sánh…).'),
        bullet('Agent intent: nhận diện ý định mở module Workbench / pillar từ ngôn ngữ người dùng.'),

        h2('6.4. Hạ tầng AI'),
        bullet('UniAI (OpenRouter Token Hub) + BYOK nhiều nhà cung cấp (Anthropic, OpenAI, Gemini, DeepSeek, Kimi, GLM, Qwen, Grok, Mistral, Codex CLI…).'),
        bullet('Giới hạn token theo gói; có thể mua thêm — không khóa soạn thảo khi hết token.'),
        bullet('Media/search tooling tách biệt; có thể tắt backend tìm kiếm nếu cần chính sách nội bộ.'),

        h1('7. Tính chất bảo mật khi cài trực tiếp trên máy khách hàng'),
        h2('7.1. Nguyên tắc triển khai Personal'),
        bulletBoldLead('Local-first: ', 'Workbench (việc, sức khoẻ, gia đình, thú cưng…) và file đang mở lưu trên thiết bị người dùng.'),
        bulletBoldLead('Không bắt buộc cloud cho đời sống: ', 'PWA/uniAI là trợ lý; dữ liệu local không phải SKU bắt buộc đẩy lên server.'),
        bulletBoldLead('Cloud theo lựa chọn: ', 'Office Bridge (Personal+) chỉ mở/lưu Work Product cloud khi người dùng chủ động.'),
        bulletBoldLead('AI theo nhu cầu: ', 'gọi model khi chat/tóm tắt/sinh nội dung; có thể BYOK hoặc dùng Token Hub có kiểm soát quota.'),

        h2('7.2. Kiểm soát trên thiết bị'),
        bullet('Ứng dụng desktop Electron: dữ liệu userData / store trên máy; backup xuất được để khách tự lưu trữ.'),
        bullet('Khóa API / cấu hình AI lưu local (userData); không nhúng secret UniWork vào mã nguồn phân phối.'),
        bullet('Album thú cưng / ảnh sức khoẻ dùng lưu trữ trên thiết bị (IndexedDB / blob local).'),
        bullet('Theme & i18n không đụng nội dung văn bản đã soạn — document content không bị “re-author” theo theme.'),

        h2('7.3. Khi kết nối dịch vụ bên ngoài'),
        bullet('Deep link / session Bridge: token ngắn hạn, một lần dùng; không đưa JWT thô lên URL.'),
        bullet('Desktop coi là client không tin cậy: không ship service-role DB; không truy cập Postgres trực tiếp từ Office Bridge packages.'),
        bullet('Log không ghi token, credential, signed URL hay nội dung file.'),
        bullet('HTTPS bắt buộc với API production.'),

        h2('7.4. Khuyến nghị cho khách hàng cá nhân / SMB'),
        bullet('Cài bản chính thức; bật mã hoá ổ đĩa máy (FileVault / BitLocker).'),
        bullet('Xuất backup Workbench định kỳ ra ổ/USB riêng của khách.'),
        bullet('Dùng BYOK hoặc Token Hub theo chính sách; không chia sẻ API key giữa nhiều người.'),
        bullet('Chỉ bật Bridge cloud cho file công việc cần đồng bộ; giữ hồ sơ đời sống thuần local nếu cần tối đa riêng tư.'),
        bullet('Tắt chat tự nhiên / AI nếu môi trường yêu cầu air-gap soạn thảo (vẫn dùng Office + Workbench offline).'),

        h1('8. Kết luận'),
        p(
          'UniOffice cho cá nhân là “hệ điều hành công việc & đời sống” trên máy khách: Office AI đầy đủ, Workbench sâu, uniAI chuyển tóm tắt thành Docs/Slides, và mô hình bảo mật local-first phù hợp tư vấn bán gói Personal — dữ liệu nhạy cảm ở lại máy, cloud/AI chỉ khi người dùng chọn.',
        ),
        p('— Hết bản tổng hợp tính năng —', { mute: true, italics: true }),
      ],
    },
  ],
})

const buf = await Packer.toBuffer(doc)
fs.writeFileSync(outPath, buf)
console.log('Wrote', outPath)
