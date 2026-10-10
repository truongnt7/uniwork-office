/**
 * Generate a Vietnamese Word overview of UniWork Office technology / tech stack.
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
const outPath = path.join(__dirname, 'UniOffice-Tom-Tat-Cong-Nghe-Tech-Stack.docx')

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
    shading: opts.header
      ? { type: ShadingType.CLEAR, fill: ACCENT }
      : opts.soft
        ? { type: ShadingType.CLEAR, fill: SOFT }
        : undefined,
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

function twoColTable(rows, headers = ['Nhóm / hạng mục', 'Nội dung']) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2800, 6560],
    rows: [
      new TableRow({
        children: [
          cell(headers[0], { header: true, width: 2800 }),
          cell(headers[1], { header: true, width: 6560 }),
        ],
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

function threeColTable(headers, rows, widths = [2400, 2800, 4160]) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: headers.map((h, i) => cell(h, { header: true, width: widths[i] })),
      }),
      ...rows.map(
        (cols, i) =>
          new TableRow({
            children: cols.map((c, j) =>
              cell(c, { bold: j === 0, soft: i % 2 === 0, width: widths[j] }),
            ),
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
            style: {
              paragraph: {
                indent: { left: convertInchesToTwip(0.28), hanging: convertInchesToTwip(0.18) },
              },
            },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: '–',
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
              },
            },
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
            left: convertInchesToTwip(0.9),
            right: convertInchesToTwip(0.9),
          },
        },
      },
      children: [
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: 'UNIWORK OFFICE',
              font: 'Calibri',
              size: 20,
              bold: true,
              color: ACCENT,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: 'Tóm tắt công nghệ & Tech Stack',
              font: 'Calibri',
              size: 44,
              bold: true,
              color: INK,
            }),
          ],
        }),
        p(
          'Tài liệu mô tả kiến trúc kỹ thuật, ngăn xếp công nghệ (tech stack) và các thành phần lõi của nền tảng UniWork Office — bộ ứng dụng văn phòng AI-native chạy trên desktop, fork độc lập thương hiệu từ GenOffice (Apache-2.0).',
          { mute: true },
        ),
        p('Phiên bản tham chiếu codebase: monorepo npm workspaces · Node ≥ 22.12 · Electron 43 · React 19 · TypeScript 5.9.', {
          mute: true,
          italics: true,
        }),

        h1('1. Bức tranh tổng thể'),
        p(
          'UniWork Office là desktop office runtime: một shell Electron thống nhất host nhiều module biên tập (Docs, Sheets, Slides, PDF, Markdown, HTML). Mỗi module có engine định dạng riêng; AI agent dùng chung; file mở/sửa/lưu round-trip OOXML/PDF trên máy người dùng.',
        ),
        twoColTable([
          ['Hình thái sản phẩm', 'Ứng dụng desktop đa nền tảng (macOS / Windows / Linux), đóng gói electron-builder'],
          ['Mô hình repo', 'Monorepo npm workspaces: apps/* + packages/*; tên gói nội bộ @genoffice/* để merge upstream'],
          ['Ngôn ngữ chính', 'TypeScript toàn bộ UI/main; Rust sidecar cho XLSX; HTML/CSS tokens cho chrome'],
          ['UI framework', 'React 19 + Vite 7 / electron-vite 5; TipTap/ProseMirror (Docs); Univer (Sheets); Konva (Slides)'],
          ['AI', 'ReAct agent loop (@genoffice/agent-core) + multi-provider LLM streaming (@genoffice/ai-provider)'],
          ['Nền tảng UniWork', 'Office Bridge (HTTPS session) nối PWA/backend UniWork; Office không giữ service-role DB'],
        ]),

        h1('2. Kiến trúc ứng dụng'),
        h2('2.1 Shell & process model'),
        bulletBoldLead('Shell (@genoffice/shell): ', 'cửa sổ Home / launcher, tab, settings, AutoSave mặc định, deep link uniwork://, đóng gói toàn suite.'),
        bulletBoldLead('Main process: ', 'Electron main — IPC, filesystem, password/crypto, recovery copies, Bridge session, menu native.'),
        bulletBoldLead('Preload: ', 'contextIsolation + allowlist API (window.desktop / slidesApi…); thay đổi preload cần rebuild.'),
        bulletBoldLead('Renderer: ', 'React UI từng app; main-process code của app được compile vào shell build.'),
        bullet(
          'Dev: concurrently chạy Vite renderer từng app (ports 5173–5178) + shell với URL renderer inject.',
        ),

        h2('2.2 Các ứng dụng biên tập'),
        threeColTable(
          ['Ứng dụng', 'Gói', 'Định dạng / engine UI'],
          [
            ['Docs', '@genoffice/docs', 'DOCX · TipTap 3 + ProseMirror · docx-engine'],
            ['Sheets', '@genoffice/sheets', 'XLSX/XLSM/XLS/CSV · Univer 0.25 · Rust xlsx-sidecar'],
            ['Slides', '@genoffice/slides', 'PPTX · Konva / react-konva · pptx-engine + pptx-render'],
            ['PDF', '@genoffice/pdf', 'PDF · PDF.js + PDFium · pdf-lib / content-stream'],
            ['Markdown', '@genoffice/markdown', '.md · editor Markdown + AI writer'],
            ['HTML', '@genoffice/html', '.html · page / brief writer AI'],
            ['PWA companion', 'apps/uniai-pwa', 'Companion web (khi triển khai nền tảng)'],
          ],
        ),

        h2('2.3 Luồng dữ liệu file'),
        bullet('Open: main đọc bytes → engine parse (Block/element tree + anchors) → renderer mount.'),
        bullet(
          'Edit: thay đổi trên model UI; AI tool mutations đi qua skill/tools có đánh dấu freshness.',
        ),
        bullet(
          'Save: serialize / paragraph-patch (Docs) hoặc element-patch (Slides) / sidecar write (Sheets) → atomic write; recovery copy khi dirty.',
        ),
        bullet(
          'Print/Export: đường riêng (PDF export, HTML standalone…); nội dung tài liệu không bị theme chrome “viết lại”.',
        ),

        h1('3. Tech stack theo lớp'),
        h2('3.1 Runtime & build'),
        twoColTable(
          [
            ['Node / npm', 'Node.js ≥ 22.12, npm ≥ 10; .nvmrc = 22'],
            ['Desktop', 'Electron ^43.3 · electron-vite ^5 · electron-builder ^26 · electron-updater'],
            ['Bundler', 'Vite ^7.3 · @vitejs/plugin-react'],
            ['Language', 'TypeScript ^5.9'],
            ['UI lib', 'React ^19.2 · React DOM ^19.2'],
            ['Test', 'Vitest ^4 · Playwright (e2e) · jsdom cho renderer unit'],
            ['Quality', 'ESLint 10 · Prettier · typecheck workspace · license / notices gates'],
            ['Native (Sheets)', 'Rust / Cargo — crate xlsx-sidecar (calamine, ironcalc, quick-xml, zip)'],
          ],
          ['Lớp', 'Công nghệ'],
        ),

        h2('3.2 UI & trải nghiệm'),
        bulletBoldLead('@genoffice/ui: ', 'tokens.css (light/dark/system qua data-theme), component dùng chung (Markdown, AiComposer, Dropdown…).'),
        bulletBoldLead('@genoffice/i18n: ', 'chuỗi đa ngôn ngữ sharded per locale (zh định nghĩa key set).'),
        bullet(
          'Theming bắt buộc semantic CSS variables — CI check-theme-colors; nội dung tài liệu giữ màu authored, không map theo chrome.',
        ),
        bullet('Docs: TipTap/ProseMirror, pagination canvas, Track Changes, comments, dark-page display remap.'),
        bullet('Sheets: Univer presets (filter, sort, validation, drawing, notes…).'),
        bullet('Slides: Konva stage, canvas color tables theo theme cho chrome editing.'),

        h2('3.3 Engine định dạng (packages)'),
        threeColTable(
          ['Package', 'Vai trò', 'Thư viện nổi bật'],
          [
            ['docx-engine', 'Parse/serialize DOCX, Block tree, paragraph-patch', 'JSZip, fast-xml-parser'],
            ['pptx-engine', 'Parse PPTX, element tree + byte anchors', 'JSZip, fast-xml-parser'],
            ['pptx-render / pptx-ops', 'Render & thao tác slide', 'opentype, pipeline ops'],
            ['xlsx-gateway', 'Cầu TS ↔ Rust sidecar XLSX', 'IPC/stdio JSON'],
            ['pdf2docx / html2docx', 'Chuyển đổi PDF/HTML → DOCX', 'pipeline riêng'],
            ['file-parse', 'Nhận diện / parse file đa loại cho AI & open', 'shared helpers'],
            ['font-metrics', 'Đo font / layout', 'opentype / metrics'],
            ['pipelines', 'Pipeline xử lý tài liệu dùng chung', 'composition utilities'],
            ['project-store', 'Lưu trữ project/local state helpers', 'local persistence'],
            ['electron-utils', 'Tiện ích main/preload dùng chung', 'Electron helpers'],
            ['cli', 'CLI genoffice (giữ tên upstream)', 'Node CLI'],
          ],
        ),

        h2('3.4 AI stack'),
        bulletBoldLead('@genoffice/agent-core: ', 'vòng lặp ReAct generic — skill (tools + prompt + context), transport pluggable, streamText cho writer dài.'),
        bulletBoldLead('@genoffice/ai-provider: ', 'streaming đa nhà cung cấp (Claude, Gemini, DeepSeek, OpenAI, custom/BYOK, Genspark/OpenRouter tùy cấu hình).'),
        bulletBoldLead('@genoffice/ai-search: ', 'tìm kiếm / ngữ cảnh bổ trợ cho agent.'),
        bullet(
          'Mỗi app có AI panel + tools đặc thù (write_document, insert_content, sheet/slide ops…); Ask AI trên selection.',
        ),
        bullet(
          'My AI / natural chat trên Shell: tóm tắt, biểu đồ, tạo Docs/Slides từ báo cáo — model picker (OpenRouter…).',
        ),

        h2('3.5 Office Bridge & nền tảng'),
        p(
          'Khi gắn UniWork platform: Office là editing runtime; UniWork là system of record (identity, tenant, Work Product, version, audit, outbox).',
        ),
        twoColTable([
          ['@uniwork/office-bridge-contracts', 'Types, Zod schemas, enums giao thức'],
          ['@uniwork/office-bridge', 'Client desktop: parse uniwork://, HTTPS API, temp workspace session'],
          ['@uniwork/office-bridge-adapter', 'Adapter HTTP/domain phía UniWork (+ in-memory test double)'],
          ['edu-core / practice-core', 'Domain giáo dục / practice gắn ecosystem UniWork'],
          ['Bảo mật Bridge', 'Không service-role key, không truy vấn PostgreSQL từ Office; credential session in-memory'],
        ]),

        h1('4. Định dạng file & fidelity'),
        twoColTable([
          ['DOCX', 'Round-trip native; paragraph-patch save; encryption/password; recovery copies'],
          ['XLSX / XLSM / XLS / CSV', 'Sidecar Rust đọc/ghi + Univer UI; compat/benchmark scripts'],
          ['PPTX', 'Byte-fidelity open + high-fidelity Konva render + element-patch save'],
          ['PDF', 'PDF.js view; PDFium; chỉnh sửa content-stream nơi hỗ trợ; pdf-lib'],
          ['MD / HTML', 'Biên tập nhẹ + AI writer; export/convert qua pipelines'],
        ]),
        p(
          'Nguyên tắc: nội dung tài liệu (màu trang, chart, stamp…) là document data — save/export/print giống nhau ở light và dark theme.',
          { mute: true },
        ),

        h1('5. Bảo mật, chất lượng & phân phối'),
        h3('Bảo mật & quyền riêng tư'),
        bullet('contextIsolation, preload allowlist IPC.'),
        bullet('Mật khẩu DOCX / write protection; recovery dưới userData; Bridge session temp có scope.'),
        bullet('Analytics / in-app update có thể tắt khi đóng gói UniWork (không set GENOFFICE_GA4_* / UPDATE_URL).'),

        h3('Chất lượng'),
        bullet('typecheck + lint + vitest theo từng workspace; Playwright e2e.'),
        bullet('OOXML validate tools; golden fixtures (docx/pdf2docx…); license & third-party notices khi dist.'),
        bullet('CI theme-colors, english-comments, skill-version checks.'),

        h3('Phân phối'),
        bullet('dist:mac (dmg/zip), dist:win (NSIS), dist:linux (AppImage/deb/rpm).'),
        bullet('Sheets: native:build / universal sidecar trên macOS.'),

        h1('6. Sơ đồ stack (tóm tắt một dòng)'),
        p(
          'Electron Shell → React renderers → (TipTap | Univer | Konva | PDF.js) → (docx-engine | Rust xlsx | pptx-engine | pdf-lib) → filesystem / Office Bridge → AI (agent-core + ai-provider).',
          { bold: true },
        ),

        h1('7. Ghi chú định vị sản phẩm'),
        bullet(
          'Fork GenOffice (Apache-2.0): engine tài liệu giữ tương thích upstream; thương hiệu UniWork độc lập.',
        ),
        bullet(
          'Desktop-first; tích hợp cloud/Work Graph/PWA thuộc các phase nền tảng UniWork qua Bridge, không nhúng DB vào Office.',
        ),
        bullet(
          'ee/ (enterprise upstream) không dùng lại dưới Apache-2.0 trong tree UniWork.',
        ),
        p('— Hết —', { mute: true, italics: true }),
      ],
    },
  ],
})

const buffer = await Packer.toBuffer(doc)
fs.writeFileSync(outPath, buffer)
console.log('Wrote', outPath)
