/**
 * Built-in deck templates for the AI gallery.
 * Each template provides a fixed page structure + style hint; the user's topic
 * fills the briefs, then generate_deck(builtin_template + topic) produces the deck.
 */

export type DeckTemplatePageType = 'cover' | 'content' | 'data' | 'closing'

export interface DeckTemplatePage {
  /** Default title; `{topic}` is replaced with the user topic */
  title: string
  type: DeckTemplatePageType
  layout: string
  /** Brief the page designer follows; `{topic}` substituted */
  brief: string
  image_queries?: string[]
}

export type DeckTemplateCategory = 'business' | 'product' | 'education' | 'meeting'

/** Gallery mock-cover mood (Phase A CSS previews — not document colors). */
export type DeckTemplateMood = 'dark' | 'light' | 'bold' | 'soft' | 'data' | 'editorial'

/** Cover composition used by the CSS mock preview. */
export type DeckTemplateCoverLayout = 'hero' | 'split' | 'cards' | 'kpi' | 'timeline' | 'magazine'

export interface DeckTemplate {
  id: string
  category: DeckTemplateCategory
  /** Accent for gallery card (CSS color — only used in chrome, not slide content) */
  accent: string
  /** Visual mood for Phase A mock covers */
  mood: DeckTemplateMood
  /** Cover wireframe variant */
  coverLayout: DeckTemplateCoverLayout
  /** Short gallery tags (localized) */
  tagsVi: readonly string[]
  tagsEn: readonly string[]
  tagsZh: readonly string[]
  labelVi: string
  labelEn: string
  labelZh: string
  descVi: string
  descEn: string
  descZh: string
  /** Approx page count shown in the gallery */
  approxPages: number
  /** Design-system hint passed to generate_deck as `style` */
  style: string
  /** Narrative anchor; `{topic}` substituted */
  coreHook: string
  pages: DeckTemplatePage[]
}

export function deckTemplateTags(tpl: DeckTemplate, lang: string): readonly string[] {
  if (lang === 'vi' || lang.startsWith('vi')) return tpl.tagsVi
  if (lang === 'zh' || lang.startsWith('zh')) return tpl.tagsZh
  return tpl.tagsEn
}

export const DECK_TEMPLATE_CATEGORIES: readonly {
  id: DeckTemplateCategory | 'all'
  labelVi: string
  labelEn: string
  labelZh: string
}[] = [
  { id: 'all', labelVi: 'Tất cả', labelEn: 'All', labelZh: '全部' },
  { id: 'business', labelVi: 'Kinh doanh', labelEn: 'Business', labelZh: '商务' },
  { id: 'product', labelVi: 'Sản phẩm', labelEn: 'Product', labelZh: '产品' },
  { id: 'education', labelVi: 'Đào tạo', labelEn: 'Education', labelZh: '教育' },
  { id: 'meeting', labelVi: 'Họp & dự án', labelEn: 'Meetings', labelZh: '会议' },
] as const

export function deckTemplateCategoryLabel(
  id: DeckTemplateCategory | 'all',
  lang: string,
): string {
  const row = DECK_TEMPLATE_CATEGORIES.find((c) => c.id === id)
  if (!row) return id
  if (lang === 'vi' || lang.startsWith('vi')) return row.labelVi
  if (lang === 'zh' || lang.startsWith('zh')) return row.labelZh
  return row.labelEn
}

function sub(text: string, topic: string): string {
  return text.split('{topic}').join(topic.trim() || 'this presentation')
}

export const DECK_TEMPLATES: readonly DeckTemplate[] = [
  {
    id: 'pitch-deck',
    category: 'business',
    accent: '#2563eb',
    mood: 'dark',
    coverLayout: 'hero',
    tagsVi: ['#Pitch', '#Startup'],
    tagsEn: ['#Pitch', '#Startup'],
    tagsZh: ['#路演', '#创业'],
    labelVi: 'Pitch deck startup',
    labelEn: 'Startup pitch deck',
    labelZh: '创业路演',
    descVi: 'Vấn đề → giải pháp → thị trường → sản phẩm → đội ngũ → kêu gọi',
    descEn: 'Problem → solution → market → product → team → ask',
    descZh: '问题→方案→市场→产品→团队→融资诉求',
    approxPages: 8,
    style:
      'Modern startup pitch: deep navy (#0f172a) + electric blue (#2563eb) accents, white cards, bold sans titles (Inter/Segoe), generous margins, high-contrast KPIs, minimal decoration.',
    coreHook: 'A crisp investor narrative for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Cover for {topic}: punchy one-line value prop + subtitle for audience (investors).',
        image_queries: ['startup innovation abstract'],
      },
      {
        title: 'The problem',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Pain points {topic} solves — 3 concrete customer pains with stakes.',
      },
      {
        title: 'Our solution',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'How {topic} solves it — 3 pillars with short outcomes, not features dump.',
      },
      {
        title: 'Market opportunity',
        type: 'data',
        layout: 'big-number-hero',
        brief: 'TAM/SAM/SOM style opportunity for {topic}; use dataSource sample if no real figures.',
      },
      {
        title: 'Product',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Product walkthrough for {topic}: what users do in 3 steps.',
        image_queries: ['saas product dashboard'],
      },
      {
        title: 'Traction',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Traction / milestones for {topic} — 4 KPIs (sample OK if disclosed).',
      },
      {
        title: 'Team',
        type: 'content',
        layout: 'two-column',
        brief: 'Team slide for {topic}: roles and why this team wins.',
      },
      {
        title: 'The ask',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Closing ask for {topic}: what you need and contact CTA.',
      },
    ],
  },
  {
    id: 'quarterly-report',
    category: 'business',
    accent: '#0d9488',
    mood: 'data',
    coverLayout: 'kpi',
    tagsVi: ['#Báo cáo', '#Kinh doanh'],
    tagsEn: ['#Report', '#Business'],
    tagsZh: ['#汇报', '#商务'],
    labelVi: 'Báo cáo quý',
    labelEn: 'Quarterly report',
    labelZh: '季度汇报',
    descVi: 'Tóm tắt kết quả, KPI, highlight, rủi ro, kế hoạch tiếp',
    descEn: 'Results, KPIs, highlights, risks, next plan',
    descZh: '业绩总览、KPI、亮点、风险、下季计划',
    approxPages: 6,
    style:
      'Executive business report: teal (#0d9488) + charcoal text on white, clean tables/KPI cards, Calibri/Segoe body, formal but scannable.',
    coreHook: 'Quarterly business review for {topic}',
    pages: [
      {
        title: '{topic} — quarterly review',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Cover: quarterly review title for {topic}, period label, presenter role.',
      },
      {
        title: 'Executive summary',
        type: 'content',
        layout: 'three-column-cards',
        brief: '3 headline outcomes for {topic} this quarter.',
      },
      {
        title: 'Key metrics',
        type: 'data',
        layout: 'kpi-row',
        brief: '4–6 KPIs for {topic} with trend vs prior period (sample OK if disclosed).',
      },
      {
        title: 'Highlights',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Wins and shipped work for {topic}.',
      },
      {
        title: 'Risks & blockers',
        type: 'content',
        layout: 'two-column',
        brief: 'Risks/blockers for {topic} and mitigations.',
      },
      {
        title: 'Next quarter',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Priorities and asks for next quarter on {topic}.',
      },
    ],
  },
  {
    id: 'product-launch',
    category: 'product',
    accent: '#c026d3',
    mood: 'bold',
    coverLayout: 'split',
    tagsVi: ['#Ra mắt', '#Sản phẩm'],
    tagsEn: ['#Launch', '#Product'],
    tagsZh: ['#发布', '#产品'],
    labelVi: 'Ra mắt sản phẩm',
    labelEn: 'Product launch',
    labelZh: '产品发布',
    descVi: 'Câu chuyện sản phẩm, tính năng, demo, định giá, CTA',
    descEn: 'Story, features, demo, pricing, CTA',
    descZh: '产品故事、功能、演示、定价、行动号召',
    approxPages: 7,
    style:
      'Launch event energy: magenta/violet accents on near-black or white, large typography, product-shot friendly layouts, bold CTAs.',
    coreHook: 'Launch narrative for {topic}',
    pages: [
      {
        title: 'Introducing {topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Launch cover for {topic} with a memorable tagline.',
        image_queries: ['product launch stage'],
      },
      {
        title: 'Why now',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Market timing / why {topic} matters now.',
      },
      {
        title: 'What it is',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Product definition of {topic} in plain language + visual.',
        image_queries: ['modern product photograph'],
      },
      {
        title: 'Key features',
        type: 'content',
        layout: 'three-column-cards',
        brief: '3 hero features of {topic} with benefits.',
      },
      {
        title: 'How it works',
        type: 'content',
        layout: 'timeline',
        brief: '3–4 step user journey for {topic}.',
      },
      {
        title: 'Plans',
        type: 'data',
        layout: 'two-column',
        brief: 'Pricing / packaging for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Get started',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'CTA and next steps for {topic}.',
      },
    ],
  },
  {
    id: 'training',
    category: 'education',
    accent: '#ea580c',
    mood: 'soft',
    coverLayout: 'cards',
    tagsVi: ['#Đào tạo', '#Nội bộ'],
    tagsEn: ['#Training', '#Internal'],
    tagsZh: ['#培训', '#内部'],
    labelVi: 'Đào tạo / onboarding',
    labelEn: 'Training / onboarding',
    labelZh: '培训入职',
    descVi: 'Mục tiêu học, nội dung, quy trình, checklist, Q&A',
    descEn: 'Learning goals, content, process, checklist, Q&A',
    descZh: '学习目标、内容、流程、清单、问答',
    approxPages: 7,
    style:
      'Friendly training deck: warm orange accents, soft cards, clear hierarchy, icon-friendly sections, readable body ≥16pt equivalent.',
    coreHook: 'Practical training session on {topic}',
    pages: [
      {
        title: 'Training: {topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Training cover for {topic}: audience and duration.',
      },
      {
        title: 'Learning goals',
        type: 'content',
        layout: 'three-column-cards',
        brief: '3 measurable learning goals for {topic}.',
      },
      {
        title: 'Agenda',
        type: 'content',
        layout: 'timeline',
        brief: 'Session agenda for {topic}.',
      },
      {
        title: 'Core concepts',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Core concepts learners must know about {topic}.',
      },
      {
        title: 'Process',
        type: 'content',
        layout: 'two-column',
        brief: 'Step-by-step process / workflow for {topic}.',
      },
      {
        title: 'Checklist',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Practical checklist to apply {topic} on the job.',
      },
      {
        title: 'Q&A',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Q&A / resources closing for {topic}.',
      },
    ],
  },
  {
    id: 'meeting-brief',
    category: 'meeting',
    accent: '#475569',
    mood: 'light',
    coverLayout: 'cards',
    tagsVi: ['#Họp', '#Tóm tắt'],
    tagsEn: ['#Meeting', '#Brief'],
    tagsZh: ['#会议', '#纪要'],
    labelVi: 'Tóm tắt họp',
    labelEn: 'Meeting brief',
    labelZh: '会议纪要',
    descVi: 'Bối cảnh, quyết định, action items, chủ sở hữu',
    descEn: 'Context, decisions, action items, owners',
    descZh: '背景、决议、行动项、负责人',
    approxPages: 5,
    style:
      'Neutral meeting brief: slate gray accents, dense but clear bullets, status tags, minimal imagery.',
    coreHook: 'Meeting outcomes for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Meeting title slide for {topic}: date, attendees roles.',
      },
      {
        title: 'Context',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Why this meeting on {topic} was needed.',
      },
      {
        title: 'Decisions',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Key decisions made about {topic}.',
      },
      {
        title: 'Action items',
        type: 'content',
        layout: 'two-column',
        brief: 'Action items for {topic} with owners and due dates.',
      },
      {
        title: 'Next check-in',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Follow-up meeting / open questions for {topic}.',
      },
    ],
  },
  {
    id: 'lesson',
    category: 'education',
    accent: '#1d4ed8',
    mood: 'light',
    coverLayout: 'hero',
    tagsVi: ['#Bài giảng', '#Giáo dục'],
    tagsEn: ['#Lesson', '#Education'],
    tagsZh: ['#课程', '#教育'],
    labelVi: 'Bài giảng',
    labelEn: 'Lesson / lecture',
    labelZh: '教学课件',
    descVi: 'Mở bài, kiến thức, ví dụ, luyện tập, tổng kết',
    descEn: 'Hook, teach, examples, practice, summary',
    descZh: '导入、讲解、例题、练习、总结',
    approxPages: 8,
    style:
      'Classroom lecture: clear blue accents, large titles, example callouts, whiteboard-friendly layouts.',
    coreHook: 'Teach {topic} clearly in one sitting',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Lesson cover for {topic}: grade/level and duration.',
      },
      {
        title: 'Today we will',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Learning objectives for {topic}.',
      },
      {
        title: 'Warm-up',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Hook / prior knowledge prompt for {topic}.',
      },
      {
        title: 'Concept',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Teach the core concept of {topic} simply.',
        image_queries: ['classroom teaching illustration'],
      },
      {
        title: 'Worked example',
        type: 'content',
        layout: 'two-column',
        brief: 'Worked example applying {topic}.',
      },
      {
        title: 'Try it',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Practice prompt for learners on {topic}.',
      },
      {
        title: 'Common mistakes',
        type: 'content',
        layout: 'two-column',
        brief: 'Pitfalls when learning {topic}.',
      },
      {
        title: 'Summary',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Recap + homework for {topic}.',
      },
    ],
  },
  {
    id: 'sales-proposal',
    category: 'business',
    accent: '#16a34a',
    mood: 'bold',
    coverLayout: 'split',
    tagsVi: ['#Bán hàng', '#Đề xuất'],
    tagsEn: ['#Sales', '#Proposal'],
    tagsZh: ['#销售', '#方案'],
    labelVi: 'Đề xuất bán hàng',
    labelEn: 'Sales proposal',
    labelZh: '销售方案',
    descVi: 'Nhu cầu → giải pháp → lợi ích → báo giá → bước tiếp',
    descEn: 'Need → solution → benefits → pricing → next steps',
    descZh: '需求→方案→价值→报价→下一步',
    approxPages: 7,
    style:
      'Client-facing sales proposal: forest green accents, clean white cards, trustworthy typography, clear pricing tables, professional and persuasive.',
    coreHook: 'Win the deal for {topic}',
    pages: [
      {
        title: 'Proposal: {topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Sales proposal cover for {topic}: client name placeholder and date.',
      },
      {
        title: 'Understanding your need',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Restate the client problem {topic} addresses.',
      },
      {
        title: 'Recommended solution',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Proposed solution for {topic} in 3 pillars.',
      },
      {
        title: 'Benefits & ROI',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Benefits / ROI for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Scope of work',
        type: 'content',
        layout: 'timeline',
        brief: 'Delivery scope and timeline for {topic}.',
      },
      {
        title: 'Investment',
        type: 'data',
        layout: 'two-column',
        brief: 'Pricing options for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Next steps',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Clear CTA and acceptance path for {topic}.',
      },
    ],
  },
  {
    id: 'project-kickoff',
    category: 'meeting',
    accent: '#0891b2',
    mood: 'data',
    coverLayout: 'timeline',
    tagsVi: ['#Kickoff', '#Dự án'],
    tagsEn: ['#Kickoff', '#Project'],
    tagsZh: ['#启动', '#项目'],
    labelVi: 'Kickoff dự án',
    labelEn: 'Project kickoff',
    labelZh: '项目启动',
    descVi: 'Mục tiêu, phạm vi, timeline, vai trò, rủi ro',
    descEn: 'Goals, scope, timeline, roles, risks',
    descZh: '目标、范围、时间线、角色、风险',
    approxPages: 7,
    style:
      'Project kickoff: cyan accents, structured RACI-friendly layouts, timeline emphasis, calm professional palette.',
    coreHook: 'Align the team to launch {topic}',
    pages: [
      {
        title: 'Kickoff: {topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Project kickoff cover for {topic}.',
      },
      {
        title: 'Why this project',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Business reason and success criteria for {topic}.',
      },
      {
        title: 'Goals & outcomes',
        type: 'content',
        layout: 'three-column-cards',
        brief: '3 measurable goals for {topic}.',
      },
      {
        title: 'Scope',
        type: 'content',
        layout: 'two-column',
        brief: 'In-scope vs out-of-scope for {topic}.',
      },
      {
        title: 'Timeline',
        type: 'content',
        layout: 'timeline',
        brief: 'Phases and milestones for {topic}.',
      },
      {
        title: 'Roles',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Team roles and owners for {topic}.',
      },
      {
        title: 'Risks & working agreements',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Top risks and how the team will work on {topic}.',
      },
    ],
  },
  {
    id: 'marketing-plan',
    category: 'product',
    accent: '#db2777',
    mood: 'soft',
    coverLayout: 'magazine',
    tagsVi: ['#Marketing', '#Go-to-market'],
    tagsEn: ['#Marketing', '#GTM'],
    tagsZh: ['#营销', '#GTM'],
    labelVi: 'Kế hoạch marketing',
    labelEn: 'Marketing plan',
    labelZh: '营销计划',
    descVi: 'Đối tượng, thông điệp, kênh, lịch, KPI',
    descEn: 'Audience, message, channels, calendar, KPIs',
    descZh: '人群、信息、渠道、排期、KPI',
    approxPages: 7,
    style:
      'Marketing plan: bold pink/magenta accents, campaign-friendly cards, channel grids, energetic but readable.',
    coreHook: 'A practical go-to-market plan for {topic}',
    pages: [
      {
        title: 'Marketing plan: {topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Marketing plan cover for {topic} with campaign window.',
        image_queries: ['marketing campaign creative'],
      },
      {
        title: 'Audience',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Target segments for {topic}.',
      },
      {
        title: 'Positioning & message',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Core message and proof points for {topic}.',
      },
      {
        title: 'Channels',
        type: 'content',
        layout: 'two-column',
        brief: 'Owned / paid / earned channels for {topic}.',
      },
      {
        title: 'Campaign calendar',
        type: 'content',
        layout: 'timeline',
        brief: 'Phased calendar for {topic}.',
      },
      {
        title: 'Budget & KPIs',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Budget split and success KPIs for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Ask & owners',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Approvals needed and owners for {topic}.',
      },
    ],
  },
  {
    id: 'company-intro',
    category: 'business',
    accent: '#4f46e5',
    mood: 'editorial',
    coverLayout: 'magazine',
    tagsVi: ['#Công ty', '#Giới thiệu'],
    tagsEn: ['#Company', '#Intro'],
    tagsZh: ['#公司', '#介绍'],
    labelVi: 'Giới thiệu công ty',
    labelEn: 'Company introduction',
    labelZh: '公司介绍',
    descVi: 'Về chúng tôi, năng lực, khách hàng, case, liên hệ',
    descEn: 'About us, capabilities, clients, cases, contact',
    descZh: '关于我们、能力、客户、案例、联系',
    approxPages: 7,
    style:
      'Corporate introduction: indigo accents, spacious covers, logo-friendly layouts, trust-building imagery.',
    coreHook: 'Introduce the company through {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Company intro cover framed around {topic}.',
        image_queries: ['modern office team'],
      },
      {
        title: 'Who we are',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Company snapshot relevant to {topic}.',
        image_queries: ['professional team collaboration'],
      },
      {
        title: 'What we do',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Capability pillars connected to {topic}.',
      },
      {
        title: 'Why us',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Differentiators for {topic}.',
      },
      {
        title: 'Selected work',
        type: 'content',
        layout: 'two-column',
        brief: '2–3 case highlights related to {topic}.',
      },
      {
        title: 'Clients & proof',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Social proof / metrics for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Let’s talk',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Contact CTA for {topic}.',
      },
    ],
  },
  {
    id: 'weekly-status',
    category: 'meeting',
    accent: '#64748b',
    mood: 'light',
    coverLayout: 'kpi',
    tagsVi: ['#Tuần', '#Status'],
    tagsEn: ['#Weekly', '#Status'],
    tagsZh: ['#周报', '#状态'],
    labelVi: 'Báo cáo tuần',
    labelEn: 'Weekly status',
    labelZh: '周报',
    descVi: 'Done / doing / blockers / kế hoạch tuần tới',
    descEn: 'Done / doing / blockers / next week',
    descZh: '已完成、进行中、阻塞、下周计划',
    approxPages: 5,
    style:
      'Weekly status: slate accents, dense scannable bullets, status tags, minimal decoration for quick standups.',
    coreHook: 'Weekly status update on {topic}',
    pages: [
      {
        title: 'Weekly status — {topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Weekly status cover for {topic} with week range.',
      },
      {
        title: 'Done this week',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Completed work for {topic}.',
      },
      {
        title: 'In progress',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Active workstreams for {topic}.',
      },
      {
        title: 'Blockers',
        type: 'content',
        layout: 'two-column',
        brief: 'Blockers and asks for {topic}.',
      },
      {
        title: 'Next week',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Priorities for next week on {topic}.',
      },
    ],
  },
  {
    id: 'workshop',
    category: 'education',
    accent: '#ca8a04',
    mood: 'soft',
    coverLayout: 'timeline',
    tagsVi: ['#Workshop', '#Facilitation'],
    tagsEn: ['#Workshop', '#Facilitation'],
    tagsZh: ['#工作坊', '#引导'],
    labelVi: 'Workshop / brainstorm',
    labelEn: 'Workshop / brainstorm',
    labelZh: '工作坊',
    descVi: 'Mục tiêu, luật chơi, bài tập, tổng hợp, action',
    descEn: 'Goal, rules, exercises, synthesis, actions',
    descZh: '目标、规则、练习、汇总、行动',
    approxPages: 6,
    style:
      'Workshop facilitation: warm gold accents, large prompt text, sticky-note friendly layouts, energetic and collaborative.',
    coreHook: 'Facilitate a productive workshop on {topic}',
    pages: [
      {
        title: 'Workshop: {topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Workshop cover for {topic}: duration and facilitator.',
      },
      {
        title: 'Goal for today',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Workshop outcomes for {topic}.',
      },
      {
        title: 'How we’ll work',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Ground rules and format for {topic}.',
      },
      {
        title: 'Exercise',
        type: 'content',
        layout: 'two-column',
        brief: 'Main brainstorm / exercise prompt for {topic}.',
      },
      {
        title: 'Synthesize',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'How to cluster and prioritize ideas for {topic}.',
      },
      {
        title: 'Actions & owners',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Capture actions and owners from {topic}.',
      },
    ],
  },
] as const

export function getDeckTemplate(id: string): DeckTemplate | undefined {
  return DECK_TEMPLATES.find((t) => t.id === id)
}

export function deckTemplateLabel(tpl: DeckTemplate, lang: string): string {
  if (lang === 'vi' || lang.startsWith('vi')) return tpl.labelVi
  if (lang === 'zh' || lang.startsWith('zh')) return tpl.labelZh
  return tpl.labelEn
}

export function deckTemplateDesc(tpl: DeckTemplate, lang: string): string {
  if (lang === 'vi' || lang.startsWith('vi')) return tpl.descVi
  if (lang === 'zh' || lang.startsWith('zh')) return tpl.descZh
  return tpl.descEn
}

export interface BuiltinTemplateFill {
  topic: string
  style: string
  core_hook: string
  approx_pages: number
  pages: Array<{
    title: string
    type: string
    brief: string
    layout: string
    image_queries: string[]
  }>
}

/** Expand a gallery template + user topic into generate_deck arguments. */
export function fillBuiltinTemplate(id: string, topic: string): BuiltinTemplateFill | null {
  const tpl = getDeckTemplate(id)
  if (!tpl) return null
  const t = topic.trim() || tpl.labelEn
  return {
    topic: t,
    style: tpl.style,
    core_hook: sub(tpl.coreHook, t),
    approx_pages: tpl.pages.length || tpl.approxPages,
    pages: tpl.pages.map((p) => ({
      title: sub(p.title, t),
      type: p.type,
      brief: sub(p.brief, t),
      layout: p.layout,
      image_queries: [...(p.image_queries ?? [])],
    })),
  }
}

/**
 * User-visible chat text + model instruction when generating from the gallery.
 * Display shows a short line; the model gets an explicit generate_deck call recipe.
 */
export function buildGalleryGenerateMessages(
  templateId: string,
  topic: string,
  lang: string,
): { displayText: string; instruction: string } | null {
  const tpl = getDeckTemplate(templateId)
  const fill = fillBuiltinTemplate(templateId, topic)
  if (!tpl || !fill) return null
  const name = deckTemplateLabel(tpl, lang)
  const displayText =
    lang === 'vi' || lang.startsWith('vi')
      ? `Tạo slide theo mẫu “${name}”: ${fill.topic}`
      : lang === 'zh' || lang.startsWith('zh')
        ? `按模板「${name}」生成：${fill.topic}`
        : `Generate from template “${name}”: ${fill.topic}`

  const instruction =
    `Create a whole new presentation from the built-in gallery template.\n` +
    `Call generate_deck ONCE with:\n` +
    `- builtin_template: "${templateId}"\n` +
    `- topic: ${JSON.stringify(fill.topic)}\n` +
    `- insert_mode: "replace"\n` +
    `- dataSource: "sample"\n` +
    `Do NOT call ask_clarification. Do NOT invent a different page structure — the builtin_template supplies style + pages. ` +
    `After generate_deck finishes, briefly confirm what was created.`

  return { displayText, instruction }
}
