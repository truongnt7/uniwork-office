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

/** Gallery tab filter — curated tabs are not DeckTemplate.category values. */
export type DeckTemplateGalleryFilter =
  | DeckTemplateCategory
  | 'all'
  | 'trending'
  | 'creative'
  | 'mine'

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

/**
 * Curated “Trending” gallery set (top visual + high-use — keep short).
 * Order = browse grid order when the Trending tab is active.
 */
export const TRENDING_TEMPLATE_IDS = [
  'keynote',
  'ai-product',
  'fine-arts',
  'property-listing',
  'agency-portfolio',
  'medical-report',
  'strategy-case',
  'investor-update',
  'creative-pitch',
  'sports',
  'design-thinking',
  'architectural',
  'brand-editorial',
  'tech-innovation',
  'pitch-deck',
  'product-launch',
] as const

export type TrendingTemplateId = (typeof TRENDING_TEMPLATE_IDS)[number]

/** Visual / creative gallery set (filter tab — not a DeckTemplate.category). */
export const CREATIVE_TEMPLATE_IDS = [
  'fine-arts',
  'creative-pitch',
  'color-block',
  'brand-editorial',
  'agency-portfolio',
  'design-thinking',
  'keynote',
  'architectural',
] as const

export function isTrendingTemplate(templateId: string): boolean {
  return (TRENDING_TEMPLATE_IDS as readonly string[]).includes(templateId)
}

export function isCreativeTemplate(templateId: string): boolean {
  return (CREATIVE_TEMPLATE_IDS as readonly string[]).includes(templateId)
}

export function deckTemplateTags(tpl: DeckTemplate, lang: string): readonly string[] {
  if (lang === 'vi' || lang.startsWith('vi')) return tpl.tagsVi
  if (lang === 'zh' || lang.startsWith('zh')) return tpl.tagsZh
  return tpl.tagsEn
}

export const DECK_TEMPLATE_CATEGORIES: readonly {
  id: DeckTemplateGalleryFilter
  labelVi: string
  labelEn: string
  labelZh: string
}[] = [
  { id: 'all', labelVi: 'Tất cả', labelEn: 'All', labelZh: '全部' },
  { id: 'mine', labelVi: 'Của tôi', labelEn: 'Mine', labelZh: '我的' },
  { id: 'trending', labelVi: 'Trending', labelEn: 'Trending', labelZh: '热门' },
  { id: 'creative', labelVi: 'Sáng tạo', labelEn: 'Creative', labelZh: '创意' },
  { id: 'business', labelVi: 'Kinh doanh', labelEn: 'Business', labelZh: '商务' },
  { id: 'product', labelVi: 'Sản phẩm', labelEn: 'Product', labelZh: '产品' },
  { id: 'education', labelVi: 'Đào tạo', labelEn: 'Education', labelZh: '教育' },
  { id: 'meeting', labelVi: 'Họp & dự án', labelEn: 'Meetings', labelZh: '会议' },
] as const

export function deckTemplateCategoryLabel(
  id: DeckTemplateGalleryFilter | DeckTemplateCategory,
  lang: string,
): string {
  const row = DECK_TEMPLATE_CATEGORIES.find((c) => c.id === id)
  if (!row) return id
  if (lang === 'vi' || lang.startsWith('vi')) return row.labelVi
  if (lang === 'zh' || lang.startsWith('zh')) return row.labelZh
  return row.labelEn
}

/** Case-insensitive match on localized label + tags. */
export function templateMatchesQuery(tpl: DeckTemplate, query: string, lang: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = [
    deckTemplateLabel(tpl, lang),
    deckTemplateDesc(tpl, lang),
    tpl.id,
    ...deckTemplateTags(tpl, lang),
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
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
  {
    id: 'design-thinking',
    category: 'education',
    accent: '#ea580c',
    mood: 'bold',
    coverLayout: 'cards',
    tagsVi: ['#Design', '#Trending'],
    tagsEn: ['#Design', '#Trending'],
    tagsZh: ['#设计', '#热门'],
    labelVi: 'Design thinking',
    labelEn: 'Design thinking',
    labelZh: '设计思维',
    descVi: 'Empathize → define → ideate → prototype → test',
    descEn: 'Empathize → define → ideate → prototype → test',
    descZh: '共情→定义→构想→原型→测试',
    approxPages: 7,
    style:
      'Design-thinking workshop: vivid orange (#ea580c) + electric blue accents on charcoal, bold geometric 3D abstract shapes, large sans titles, airy cards, playful but professional.',
    coreHook: 'A design-thinking journey for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Bold design-thinking cover for {topic}: abstract 3D geometry, short workshop subtitle.',
        image_queries: ['abstract 3d orange blue geometry'],
      },
      {
        title: 'Empathize',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'User insights and pain points for {topic}.',
        image_queries: ['user research sticky notes'],
      },
      {
        title: 'Define',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Problem statement and opportunity for {topic}.',
      },
      {
        title: 'Ideate',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Top idea clusters for {topic}.',
      },
      {
        title: 'Prototype',
        type: 'content',
        layout: 'two-column',
        brief: 'Prototype concepts and fidelity for {topic}.',
      },
      {
        title: 'Test & learn',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Test metrics and learnings for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Next experiments',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Next experiments and owners for {topic}.',
      },
    ],
  },
  {
    id: 'cloud-analysis',
    category: 'business',
    accent: '#7c3aed',
    mood: 'soft',
    coverLayout: 'split',
    tagsVi: ['#Cloud', '#Trending'],
    tagsEn: ['#Cloud', '#Trending'],
    tagsZh: ['#云', '#热门'],
    labelVi: 'Cloud service analysis',
    labelEn: 'Cloud service analysis',
    labelZh: '云服务分析',
    descVi: 'Tổng quan → kiến trúc → chi phí → rủi ro → lộ trình',
    descEn: 'Overview → architecture → cost → risk → roadmap',
    descZh: '概览→架构→成本→风险→路线图',
    approxPages: 7,
    style:
      'Cloud analysis: soft violet–blue fluid gradients, glassmorphism cards, calm sans typography, spacious margins, subtle glow accents — premium SaaS aesthetic.',
    coreHook: 'Analyze cloud services for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Soft gradient cloud analysis cover for {topic}.',
        image_queries: ['soft purple blue abstract cloud'],
      },
      {
        title: 'Landscape',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Service landscape relevant to {topic}.',
      },
      {
        title: 'Architecture',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Reference architecture for {topic}.',
        image_queries: ['cloud architecture diagram soft'],
      },
      {
        title: 'Cost model',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Cost drivers and sample figures for {topic}.',
      },
      {
        title: 'Risks & controls',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Risks and mitigations for {topic}.',
      },
      {
        title: 'Migration path',
        type: 'content',
        layout: 'timeline',
        brief: 'Phased migration / adoption for {topic}.',
      },
      {
        title: 'Recommendation',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Recommended decision for {topic}.',
      },
    ],
  },
  {
    id: 'architectural',
    category: 'business',
    accent: '#134e4a',
    mood: 'editorial',
    coverLayout: 'magazine',
    tagsVi: ['#Architecture', '#Trending'],
    tagsEn: ['#Architecture', '#Trending'],
    tagsZh: ['#建筑', '#热门'],
    labelVi: 'Architectural design',
    labelEn: 'Architectural design',
    labelZh: '建筑设计',
    descVi: 'Concept → site → massing → materials → timeline',
    descEn: 'Concept → site → massing → materials → timeline',
    descZh: '概念→场地→体量→材料→工期',
    approxPages: 7,
    style:
      'Architectural portfolio: deep teal/black fields, high-contrast grayscale skyscraper photography, thin white rules, elegant editorial typography, generous negative space.',
    coreHook: 'Present the architectural vision for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Editorial architecture cover for {topic}: dark field + building photography.',
        image_queries: ['modern skyscraper black and white'],
      },
      {
        title: 'Concept',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Design concept narrative for {topic}.',
        image_queries: ['architectural model abstract'],
      },
      {
        title: 'Site & context',
        type: 'content',
        layout: 'two-column',
        brief: 'Site constraints and opportunities for {topic}.',
      },
      {
        title: 'Massing',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Massing options for {topic}.',
      },
      {
        title: 'Materials',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Material palette for {topic}.',
      },
      {
        title: 'Program metrics',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Area / capacity metrics for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Delivery',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Delivery timeline and next steps for {topic}.',
      },
    ],
  },
  {
    id: 'color-block',
    category: 'product',
    accent: '#e11d48',
    mood: 'bold',
    coverLayout: 'cards',
    tagsVi: ['#Color', '#Trending'],
    tagsEn: ['#Color', '#Trending'],
    tagsZh: ['#色块', '#热门'],
    labelVi: 'Color block art',
    labelEn: 'Color block art',
    labelZh: '色块艺术',
    descVi: 'Ý tưởng → moodboard → hệ hình → ứng dụng → CTA',
    descEn: 'Idea → moodboard → system → applications → CTA',
    descZh: '创意→情绪板→系统→应用→行动',
    approxPages: 6,
    style:
      'Bauhaus color-block: saturated primary blocks (red/yellow/blue/green), grid collage, bold condensed titles, playful iconography, high energy creative pitch.',
    coreHook: 'A vivid color-block narrative for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Color-block cover for {topic}: Bauhaus grid, no long paragraphs.',
        image_queries: ['bauhaus color blocks collage'],
      },
      {
        title: 'Big idea',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Core creative idea for {topic}.',
      },
      {
        title: 'Moodboard',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Visual directions for {topic}.',
      },
      {
        title: 'Visual system',
        type: 'content',
        layout: 'two-column',
        brief: 'Color, type, and shape system for {topic}.',
      },
      {
        title: 'Applications',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Where the system shows up for {topic}.',
        image_queries: ['brand application mockup colorful'],
      },
      {
        title: 'Make it real',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Launch ask / next steps for {topic}.',
      },
    ],
  },
  {
    id: 'brand-editorial',
    category: 'product',
    accent: '#be123c',
    mood: 'editorial',
    coverLayout: 'magazine',
    tagsVi: ['#Brand', '#Trending'],
    tagsEn: ['#Brand', '#Trending'],
    tagsZh: ['#品牌', '#热门'],
    labelVi: 'Brand editorial',
    labelEn: 'Brand editorial',
    labelZh: '品牌编辑',
    descVi: 'Story → audience → look → campaign → proof',
    descEn: 'Story → audience → look → campaign → proof',
    descZh: '故事→受众→视觉→战役→证据',
    approxPages: 7,
    style:
      'Fashion-editorial brand deck: oversized typography, magazine crop photography, rose/black palette, asymmetric layouts, Vogue-like confidence without clutter.',
    coreHook: 'An editorial brand story for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Magazine-style brand cover for {topic}: bold type + fashion photography.',
        image_queries: ['fashion editorial portrait magazine'],
      },
      {
        title: 'Brand story',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Origin and promise for {topic}.',
        image_queries: ['lifestyle brand photography'],
      },
      {
        title: 'Audience',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Audience personas for {topic}.',
      },
      {
        title: 'Look & feel',
        type: 'content',
        layout: 'two-column',
        brief: 'Visual language for {topic}.',
      },
      {
        title: 'Campaign',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Campaign pillars for {topic}.',
      },
      {
        title: 'Proof',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Brand proof metrics for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Next drop',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Launch CTA for {topic}.',
      },
    ],
  },
  {
    id: 'tech-lattice',
    category: 'business',
    accent: '#c2410c',
    mood: 'data',
    coverLayout: 'kpi',
    tagsVi: ['#Tech', '#Trending'],
    tagsEn: ['#Tech', '#Trending'],
    tagsZh: ['#科技', '#热门'],
    labelVi: 'Technology work report',
    labelEn: 'Technology work report',
    labelZh: '技术工作汇报',
    descVi: 'Highlights → hệ thống → hiệu năng → rủi ro → kế hoạch',
    descEn: 'Highlights → systems → performance → risks → plan',
    descZh: '亮点→系统→性能→风险→计划',
    approxPages: 7,
    style:
      'Tech work report: warm wood/orange 3D lattice geometry on deep charcoal, crisp KPI cards, monospace-friendly labels, modern engineering aesthetic.',
    coreHook: 'Technology progress report on {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Tech report cover for {topic}: 3D lattice geometry, sober engineering tone.',
        image_queries: ['3d wooden geometric lattice orange'],
      },
      {
        title: 'Highlights',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Key shipping highlights for {topic}.',
      },
      {
        title: 'Systems',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'System changes for {topic}.',
      },
      {
        title: 'Performance',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Latency / reliability / throughput KPIs for {topic}.',
      },
      {
        title: 'Incidents & risk',
        type: 'content',
        layout: 'two-column',
        brief: 'Incidents and risk posture for {topic}.',
      },
      {
        title: 'Roadmap',
        type: 'content',
        layout: 'timeline',
        brief: 'Near-term engineering roadmap for {topic}.',
      },
      {
        title: 'Asks',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Decisions and asks for {topic}.',
      },
    ],
  },
  {
    id: 'investor-update',
    category: 'business',
    accent: '#0f766e',
    mood: 'data',
    coverLayout: 'kpi',
    tagsVi: ['#Investor', '#Trending'],
    tagsEn: ['#Investor', '#Trending'],
    tagsZh: ['#投资人', '#热门'],
    labelVi: 'Investor update',
    labelEn: 'Investor update',
    labelZh: '投资人更新',
    descVi: 'Highlights → tài chính → traction → runway → ask',
    descEn: 'Highlights → finance → traction → runway → ask',
    descZh: '亮点→财务→增长→runway→诉求',
    approxPages: 7,
    style:
      'Investor update: deep teal (#0f766e) on near-black, crisp KPI cards, thin data charts, sober sans titles, high-trust finance aesthetic with soft glow accents.',
    coreHook: 'A clear investor update on {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Investor update cover for {topic}: period label + calm finance mood.',
        image_queries: ['finance dashboard dark teal abstract'],
      },
      {
        title: 'Highlights',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Top wins this period for {topic}.',
      },
      {
        title: 'Traction',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Growth / revenue / usage KPIs for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Financials',
        type: 'data',
        layout: 'two-column',
        brief: 'P&L / burn snapshot for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Runway & plan',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Runway and near-term plan for {topic}.',
      },
      {
        title: 'Risks',
        type: 'content',
        layout: 'two-column',
        brief: 'Key risks and mitigations for {topic}.',
      },
      {
        title: 'The ask',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Clear ask / decisions needed for {topic}.',
      },
    ],
  },
  {
    id: 'okr-hr',
    category: 'meeting',
    accent: '#4f46e5',
    mood: 'soft',
    coverLayout: 'cards',
    tagsVi: ['#OKR', '#HR', '#Trending'],
    tagsEn: ['#OKR', '#HR', '#Trending'],
    tagsZh: ['#OKR', '#HR', '#热门'],
    labelVi: 'OKR / HR review',
    labelEn: 'OKR / HR review',
    labelZh: 'OKR / 人力复盘',
    descVi: 'Mục tiêu → KR → tiến độ → people → next cycle',
    descEn: 'Objectives → KRs → progress → people → next cycle',
    descZh: '目标→关键结果→进度→人才→下周期',
    approxPages: 7,
    style:
      'OKR / HR review: indigo accents on warm off-white, soft rounded cards, friendly people photography, clear progress bars, calm people-ops aesthetic.',
    coreHook: 'Align people and OKRs around {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'OKR / HR review cover for {topic}: cycle name + people-first mood.',
        image_queries: ['team collaboration soft indigo'],
      },
      {
        title: 'Objectives',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Top objectives for {topic}.',
      },
      {
        title: 'Key results',
        type: 'data',
        layout: 'kpi-row',
        brief: 'KR progress for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Wins & gaps',
        type: 'content',
        layout: 'two-column',
        brief: 'What worked and what slipped for {topic}.',
      },
      {
        title: 'People pulse',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Engagement / hiring / retention notes for {topic}.',
        image_queries: ['diverse team meeting soft light'],
      },
      {
        title: 'Development',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Growth plans and coaching themes for {topic}.',
      },
      {
        title: 'Next cycle',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Commitments for the next OKR cycle on {topic}.',
      },
    ],
  },
  {
    id: 'strategy-case',
    category: 'business',
    accent: '#1d4ed8',
    mood: 'editorial',
    coverLayout: 'magazine',
    tagsVi: ['#Strategy', '#Trending'],
    tagsEn: ['#Strategy', '#Trending'],
    tagsZh: ['#战略', '#热门'],
    labelVi: 'Strategy case',
    labelEn: 'Strategy case',
    labelZh: '战略案例',
    descVi: 'Vấn đề → insight → phương án → impact → khuyến nghị',
    descEn: 'Problem → insight → options → impact → recommend',
    descZh: '问题→洞察→方案→影响→建议',
    approxPages: 7,
    style:
      'Consulting strategy case: deep navy + crisp white, magazine editorial crop photography, sharp sans titles, structured frameworks, McKinsey-clean but modern.',
    coreHook: 'A strategy case recommendation for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Strategy case cover for {topic}: confident consulting editorial look.',
        image_queries: ['modern city skyline navy editorial'],
      },
      {
        title: 'Situation',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Context and stakes for {topic}.',
      },
      {
        title: 'Insight',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Key insight driving the case for {topic}.',
        image_queries: ['abstract insight data visualization'],
      },
      {
        title: 'Options',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Strategic options for {topic}.',
      },
      {
        title: 'Impact',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Projected impact for preferred option on {topic} (sample OK if disclosed).',
      },
      {
        title: 'Roadmap',
        type: 'content',
        layout: 'timeline',
        brief: 'Phased implementation for {topic}.',
      },
      {
        title: 'Recommendation',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Clear recommendation and decision ask for {topic}.',
      },
    ],
  },
  {
    id: 'keynote',
    category: 'product',
    accent: '#db2777',
    mood: 'bold',
    coverLayout: 'hero',
    tagsVi: ['#Keynote', '#Trending'],
    tagsEn: ['#Keynote', '#Trending'],
    tagsZh: ['#Keynote', '#热门'],
    labelVi: 'Keynote / sự kiện',
    labelEn: 'Event keynote',
    labelZh: '活动主题演讲',
    descVi: 'Hook → story → big idea → moments → CTA',
    descEn: 'Hook → story → big idea → moments → CTA',
    descZh: '开场→故事→大创意→高光→行动',
    approxPages: 7,
    style:
      'Event keynote: bold magenta/pink accents on deep black, oversized typography, stage-spotlight lighting, cinematic imagery, high-energy townhall / conference energy.',
    coreHook: 'A memorable keynote narrative for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Keynote cover for {topic}: stage energy, huge title presence.',
        image_queries: ['conference stage spotlight magenta'],
      },
      {
        title: 'Why we’re here',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Opening hook and stakes for {topic}.',
      },
      {
        title: 'The story',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Narrative arc for {topic}.',
        image_queries: ['audience celebration conference'],
      },
      {
        title: 'Big idea',
        type: 'content',
        layout: 'title-hero',
        brief: 'One memorable big idea slide for {topic}.',
      },
      {
        title: 'Moments',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Key moments / announcements for {topic}.',
      },
      {
        title: 'Proof',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Proof points for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Call to action',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Audience CTA for {topic}.',
      },
    ],
  },
  {
    id: 'medical-report',
    category: 'business',
    accent: '#0d9488',
    mood: 'light',
    coverLayout: 'split',
    tagsVi: ['#Y tế', '#Trending'],
    tagsEn: ['#Medical', '#Trending'],
    tagsZh: ['#医疗', '#热门'],
    labelVi: 'Báo cáo y tế',
    labelEn: 'Medical report',
    labelZh: '医疗汇报',
    descVi: 'Tóm tắt → chỉ số → phát hiện → khuyến nghị → follow-up',
    descEn: 'Summary → metrics → findings → recommend → follow-up',
    descZh: '摘要→指标→发现→建议→随访',
    approxPages: 7,
    style:
      'Medical performance report: soft mint (#0d9488) on clean white, calm clinical photography, airy margins, trustworthy sans typography, hospital-grade clarity without clutter.',
    coreHook: 'A clear medical performance narrative for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Medical report cover for {topic}: calm clinical trust, soft mint accents.',
        image_queries: ['healthcare professional soft mint clinic'],
      },
      {
        title: 'Executive summary',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'High-level clinical / operational summary for {topic}.',
      },
      {
        title: 'Key metrics',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Outcome / quality / volume KPIs for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Findings',
        type: 'content',
        layout: 'two-column',
        brief: 'Main findings for {topic}.',
      },
      {
        title: 'Care journey',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Patient / care pathway highlights for {topic}.',
        image_queries: ['modern hospital corridor soft light'],
      },
      {
        title: 'Recommendations',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Clinical / operational recommendations for {topic}.',
      },
      {
        title: 'Follow-up',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Next steps and owners for {topic}.',
      },
    ],
  },
  {
    id: 'property-listing',
    category: 'business',
    accent: '#b45309',
    mood: 'editorial',
    coverLayout: 'magazine',
    tagsVi: ['#BĐS', '#Trending'],
    tagsEn: ['#Property', '#Trending'],
    tagsZh: ['#地产', '#热门'],
    labelVi: 'Bất động sản / listing',
    labelEn: 'Property listing',
    labelZh: '房产推介',
    descVi: 'Hero → vị trí → không gian → tiện ích → giá & CTA',
    descEn: 'Hero → location → spaces → amenities → price & CTA',
    descZh: '封面→地段→空间→配套→价格与行动',
    approxPages: 7,
    style:
      'Luxury property listing: warm gold/sand accents on charcoal, full-bleed architecture photography, elegant realtor brochure typography, high-end sales mood.',
    coreHook: 'Sell the property story for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Property listing cover for {topic}: hero exterior photography, luxury realtor mood.',
        image_queries: ['luxury modern villa exterior sunset'],
      },
      {
        title: 'Location',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Neighborhood and access highlights for {topic}.',
        image_queries: ['city neighborhood aerial dusk'],
      },
      {
        title: 'Spaces',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Key interior spaces for {topic}.',
      },
      {
        title: 'Lifestyle',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Lifestyle benefits for buyers of {topic}.',
      },
      {
        title: 'Amenities',
        type: 'content',
        layout: 'two-column',
        brief: 'Amenities and finishes for {topic}.',
      },
      {
        title: 'Investment',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Price / yield / size metrics for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Schedule a viewing',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Contact CTA for {topic}.',
      },
    ],
  },
  {
    id: 'agency-portfolio',
    category: 'product',
    accent: '#7c3aed',
    mood: 'bold',
    coverLayout: 'magazine',
    tagsVi: ['#Portfolio', '#Agency', '#Trending'],
    tagsEn: ['#Portfolio', '#Agency', '#Trending'],
    tagsZh: ['#作品集', '#Agency', '#热门'],
    labelVi: 'Portfolio / agency case',
    labelEn: 'Agency portfolio',
    labelZh: '创意作品集',
    descVi: 'Studio → case → process → kết quả → liên hệ',
    descEn: 'Studio → case → process → results → contact',
    descZh: '工作室→案例→流程→成果→联系',
    approxPages: 7,
    style:
      'Creative agency portfolio: bold violet accents, asymmetric collage layouts, vibrant case photography, studio-confident typography, design-house brochure energy.',
    coreHook: 'Showcase the agency work behind {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Agency portfolio cover for {topic}: bold creative collage energy.',
        image_queries: ['creative studio collage vibrant'],
      },
      {
        title: 'The brief',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Client brief and challenge for {topic}.',
      },
      {
        title: 'Approach',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Creative approach pillars for {topic}.',
      },
      {
        title: 'Selected work',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Hero case visuals for {topic}.',
        image_queries: ['brand campaign mockup collage'],
      },
      {
        title: 'Process',
        type: 'content',
        layout: 'timeline',
        brief: 'How the team delivered {topic}.',
      },
      {
        title: 'Results',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Outcome metrics for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Let’s collaborate',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Contact CTA for the next project related to {topic}.',
      },
    ],
  },
  {
    id: 'fine-arts',
    category: 'education',
    accent: '#9f1239',
    mood: 'editorial',
    coverLayout: 'magazine',
    tagsVi: ['#Hội họa', '#Trending'],
    tagsEn: ['#FineArts', '#Trending'],
    tagsZh: ['#美术', '#热门'],
    labelVi: 'Hội họa / triển lãm',
    labelEn: 'Fine arts exhibition',
    labelZh: '美术展览',
    descVi: 'Chủ đề → tác phẩm → kỹ thuật → tường thuật → lời mời',
    descEn: 'Theme → works → technique → narrative → invite',
    descZh: '主题→作品→技法→叙事→邀请',
    approxPages: 7,
    style:
      'Fine arts exhibition: deep crimson and gold on gallery black, oil-paint texture accents, museum brochure typography, generous negative space, contemplative editorial mood.',
    coreHook: 'Present the art narrative for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Exhibition cover for {topic}: museum spotlight, painterly mood.',
        image_queries: ['oil painting gallery spotlight crimson gold'],
      },
      {
        title: 'Theme',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Curatorial theme for {topic}.',
      },
      {
        title: 'Selected works',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Featured works for {topic}.',
      },
      {
        title: 'Technique',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Materials and technique notes for {topic}.',
        image_queries: ['artist studio brushes palette'],
      },
      {
        title: 'Narrative',
        type: 'content',
        layout: 'two-column',
        brief: 'Story behind the body of work for {topic}.',
      },
      {
        title: 'Highlights',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Exhibition highlights / attendance / pieces for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Visit',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Invite / opening details for {topic}.',
      },
    ],
  },
  {
    id: 'creative-pitch',
    category: 'product',
    accent: '#f43f5e',
    mood: 'bold',
    coverLayout: 'hero',
    tagsVi: ['#Sáng tạo', '#Trending'],
    tagsEn: ['#Creative', '#Trending'],
    tagsZh: ['#创意', '#热门'],
    labelVi: 'Sáng tạo / creative pitch',
    labelEn: 'Creative pitch',
    labelZh: '创意提案',
    descVi: 'Ý tưởng → cảm hứng → concept → ứng dụng → pitch',
    descEn: 'Idea → inspiration → concept → applications → pitch',
    descZh: '想法→灵感→概念→应用→提案',
    approxPages: 7,
    style:
      'Creative pitch: neon coral and cyan on charcoal, playful geometric shapes, bold inventive typography, high-energy idea deck for campaigns and concepts.',
    coreHook: 'Pitch a bold creative idea for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Creative pitch cover for {topic}: neon energy, bold concept mood.',
        image_queries: ['neon coral cyan abstract creative'],
      },
      {
        title: 'The spark',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Origin insight for {topic}.',
      },
      {
        title: 'Inspiration',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Mood and references for {topic}.',
      },
      {
        title: 'Concept',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Core creative concept for {topic}.',
        image_queries: ['creative concept board colorful'],
      },
      {
        title: 'Expressions',
        type: 'content',
        layout: 'two-column',
        brief: 'Where the idea shows up for {topic}.',
      },
      {
        title: 'Why it wins',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Impact hypotheses for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Greenlight',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Ask to greenlight {topic}.',
      },
    ],
  },
  {
    id: 'sports',
    category: 'meeting',
    accent: '#22c55e',
    mood: 'bold',
    coverLayout: 'kpi',
    tagsVi: ['#Thể thao', '#Trending'],
    tagsEn: ['#Sports', '#Trending'],
    tagsZh: ['#体育', '#热门'],
    labelVi: 'Thể thao / hiệu suất',
    labelEn: 'Sports performance',
    labelZh: '体育表现',
    descVi: 'Mùa giải → kết quả → cầu thủ → chiến thuật → mục tiêu',
    descEn: 'Season → results → athletes → tactics → goals',
    descZh: '赛季→成绩→球员→战术→目标',
    approxPages: 7,
    style:
      'Sports performance: electric green on deep black, motion-blur athlete energy, bold scoreboard KPIs, stadium spotlight aesthetic.',
    coreHook: 'A high-energy sports narrative for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Sports cover for {topic}: stadium energy, electric green accents.',
        image_queries: ['athlete silhouette stadium green lights'],
      },
      {
        title: 'Season snapshot',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Season highlights for {topic}.',
      },
      {
        title: 'Results',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Wins / stats / rankings for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Athletes',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Key athletes / roles for {topic}.',
        image_queries: ['sports team huddle night'],
      },
      {
        title: 'Tactics',
        type: 'content',
        layout: 'two-column',
        brief: 'Tactical notes for {topic}.',
      },
      {
        title: 'Training focus',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Training priorities for {topic}.',
      },
      {
        title: 'Next match goals',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Goals and commitments for {topic}.',
      },
    ],
  },
  {
    id: 'legal-brief',
    category: 'business',
    accent: '#1e3a8a',
    mood: 'light',
    coverLayout: 'split',
    tagsVi: ['#Pháp lý', '#Trending'],
    tagsEn: ['#Legal', '#Trending'],
    tagsZh: ['#法律', '#热门'],
    labelVi: 'Pháp lý / legal brief',
    labelEn: 'Legal brief',
    labelZh: '法律简报',
    descVi: 'Bối cảnh → vấn đề → phân tích → rủi ro → khuyến nghị',
    descEn: 'Context → issue → analysis → risks → recommend',
    descZh: '背景→争点→分析→风险→建议',
    approxPages: 7,
    style:
      'Legal brief: deep navy and parchment cream, restrained serif-friendly titles, thin rules, formal trustworthy law-firm brochure — clear and sober.',
    coreHook: 'A precise legal brief on {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Legal brief cover for {topic}: formal navy/cream trust.',
        image_queries: ['law library navy parchment abstract'],
      },
      {
        title: 'Context',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Matter context for {topic}.',
      },
      {
        title: 'Issues',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Key legal issues for {topic}.',
      },
      {
        title: 'Analysis',
        type: 'content',
        layout: 'two-column',
        brief: 'Legal analysis for {topic}.',
      },
      {
        title: 'Risks',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Risks and exposure for {topic}.',
      },
      {
        title: 'Options',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Options and tradeoffs for {topic}.',
      },
      {
        title: 'Recommendation',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Recommended next steps for {topic}.',
      },
    ],
  },
  {
    id: 'ai-product',
    category: 'product',
    accent: '#8b5cf6',
    mood: 'dark',
    coverLayout: 'hero',
    tagsVi: ['#AI', '#Trending'],
    tagsEn: ['#AI', '#Trending'],
    tagsZh: ['#AI', '#热门'],
    labelVi: 'AI / sản phẩm AI',
    labelEn: 'AI product',
    labelZh: 'AI 产品',
    descVi: 'Vấn đề → mô hình → trải nghiệm → an toàn → lộ trình',
    descEn: 'Problem → model → experience → safety → roadmap',
    descZh: '问题→模型→体验→安全→路线图',
    approxPages: 7,
    style:
      'AI product deck: iridescent violet holographic gradients on deep void, neural-network motifs, futuristic sans titles, modern AI startup aesthetic.',
    coreHook: 'Introduce the AI product story for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'AI product cover for {topic}: holographic neural mood.',
        image_queries: ['holographic neural network violet'],
      },
      {
        title: 'The problem',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'User problem AI solves for {topic}.',
      },
      {
        title: 'How it works',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Model / pipeline overview for {topic}.',
        image_queries: ['ai architecture abstract glow'],
      },
      {
        title: 'Experience',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Product experience pillars for {topic}.',
      },
      {
        title: 'Safety & trust',
        type: 'content',
        layout: 'two-column',
        brief: 'Safety, evals, and trust for {topic}.',
      },
      {
        title: 'Traction',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Usage / quality metrics for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Roadmap',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Near-term AI roadmap for {topic}.',
      },
    ],
  },
  {
    id: 'engineering',
    category: 'meeting',
    accent: '#0891b2',
    mood: 'data',
    coverLayout: 'timeline',
    tagsVi: ['#Kỹ thuật', '#Trending'],
    tagsEn: ['#Engineering', '#Trending'],
    tagsZh: ['#工程', '#热门'],
    labelVi: 'Kỹ thuật / engineering',
    labelEn: 'Engineering review',
    labelZh: '工程评审',
    descVi: 'Yêu cầu → thiết kế → xây dựng → kiểm thử → bàn giao',
    descEn: 'Requirements → design → build → test → handoff',
    descZh: '需求→设计→建造→测试→交付',
    approxPages: 7,
    style:
      'Engineering review: blueprint cyan on slate, precision technical diagrams, industrial sans labels, sober build-review aesthetic.',
    coreHook: 'An engineering review of {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Engineering cover for {topic}: blueprint cyan precision mood.',
        image_queries: ['blueprint cyan technical geometry'],
      },
      {
        title: 'Requirements',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Requirements for {topic}.',
      },
      {
        title: 'Design',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Design approach for {topic}.',
        image_queries: ['engineering CAD schematic abstract'],
      },
      {
        title: 'Build plan',
        type: 'content',
        layout: 'timeline',
        brief: 'Build phases for {topic}.',
      },
      {
        title: 'Risks',
        type: 'content',
        layout: 'two-column',
        brief: 'Technical risks for {topic}.',
      },
      {
        title: 'Test metrics',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Test / quality metrics for {topic} (sample OK if disclosed).',
      },
      {
        title: 'Handoff',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Handoff ask and owners for {topic}.',
      },
    ],
  },
  {
    id: 'tech-innovation',
    category: 'product',
    accent: '#2563eb',
    mood: 'dark',
    coverLayout: 'hero',
    tagsVi: ['#Công nghệ', '#Trending'],
    tagsEn: ['#Technology', '#Trending'],
    tagsZh: ['#科技', '#热门'],
    labelVi: 'Công nghệ / innovation',
    labelEn: 'Tech innovation',
    labelZh: '科技创新',
    descVi: 'Xu hướng → giải pháp → nền tảng → lợi thế → tương lai',
    descEn: 'Trend → solution → platform → edge → future',
    descZh: '趋势→方案→平台→优势→未来',
    approxPages: 7,
    style:
      'Tech innovation: cobalt blue glass and circuit glow on black, sleek product keynote aesthetic, crisp modern sans, future-facing energy.',
    coreHook: 'A technology innovation story for {topic}',
    pages: [
      {
        title: '{topic}',
        type: 'cover',
        layout: 'title-hero',
        brief: 'Tech innovation cover for {topic}: cobalt glass/circuit keynote mood.',
        image_queries: ['sleek tech glass circuit cobalt'],
      },
      {
        title: 'Trend',
        type: 'content',
        layout: 'left-text-right-bullets',
        brief: 'Market / tech trend framing {topic}.',
      },
      {
        title: 'Solution',
        type: 'content',
        layout: 'left-text-right-image',
        brief: 'Solution overview for {topic}.',
        image_queries: ['modern product device on dark'],
      },
      {
        title: 'Platform',
        type: 'content',
        layout: 'three-column-cards',
        brief: 'Platform capabilities for {topic}.',
      },
      {
        title: 'Differentiation',
        type: 'content',
        layout: 'two-column',
        brief: 'Competitive edge for {topic}.',
      },
      {
        title: 'Proof',
        type: 'data',
        layout: 'kpi-row',
        brief: 'Adoption / performance proof for {topic} (sample OK if disclosed).',
      },
      {
        title: 'What’s next',
        type: 'closing',
        layout: 'closing-cta',
        brief: 'Future vision and CTA for {topic}.',
      },
    ],
  },
] as const

export function filterDeckTemplates(filter: DeckTemplateGalleryFilter): DeckTemplate[] {
  if (filter === 'all') return [...DECK_TEMPLATES]
  if (filter === 'mine') return []
  if (filter === 'trending' || filter === 'creative') {
    const ids = filter === 'trending' ? TRENDING_TEMPLATE_IDS : CREATIVE_TEMPLATE_IDS
    const byId = new Map(DECK_TEMPLATES.map((t) => [t.id, t]))
    return ids.map((id) => byId.get(id)).filter((t): t is DeckTemplate => t != null)
  }
  return DECK_TEMPLATES.filter((t) => t.category === filter)
}

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
    `generate_deck will pause so the user can review/edit the outline (dàn bài) before slides are created — wait for that. ` +
    `After generate_deck finishes, briefly confirm what was created.`

  return { displayText, instruction }
}

/**
 * Gallery “Mine” tab: reuse a saved style template (userData/style-templates).
 */
export function buildGalleryStyleTemplateMessages(
  styleTemplateName: string,
  topic: string,
  lang: string,
): { displayText: string; instruction: string } {
  const name = styleTemplateName.trim()
  const t = topic.trim() || name
  const displayText =
    lang === 'vi' || lang.startsWith('vi')
      ? `Tạo slide theo style “${name}”: ${t}`
      : lang === 'zh' || lang.startsWith('zh')
        ? `按风格模板「${name}」生成：${t}`
        : `Generate with style “${name}”: ${t}`

  const instruction =
    `Create a whole new presentation reusing a saved style template.\n` +
    `Call generate_deck ONCE with:\n` +
    `- style_template: ${JSON.stringify(name)}\n` +
    `- topic: ${JSON.stringify(t)}\n` +
    `- insert_mode: "replace"\n` +
    `- dataSource: "sample"\n` +
    `Do NOT call ask_clarification. Do NOT pass builtin_template. ` +
    `After generate_deck finishes, briefly confirm what was created.`

  return { displayText, instruction }
}

/**
 * Gallery “Mine” tab: adapt an already-opened user-uploaded PPTX template.
 */
export function buildGalleryUserDeckMessages(
  templateName: string,
  topic: string,
  lang: string,
): { displayText: string; instruction: string } {
  const name = templateName.trim() || 'uploaded template'
  const t = topic.trim() || name
  const displayText =
    lang === 'vi' || lang.startsWith('vi')
      ? `Điền mẫu PPTX “${name}”: ${t}`
      : lang === 'zh' || lang.startsWith('zh')
        ? `按上传模板「${name}」改写：${t}`
        : `Fill uploaded template “${name}”: ${t}`

  const instruction =
    `The currently open deck is a user-uploaded PowerPoint template (“${name}”).\n` +
    `Adapt ALL slides for topic ${JSON.stringify(t)}.\n` +
    `Hard rules:\n` +
    `- Preserve layouts, colors, fonts, imagery placement, and overall visual design.\n` +
    `- Prefer editing existing text/shapes on each slide over generate_deck replace.\n` +
    `- Do NOT call ask_clarification.\n` +
    `- Do NOT pass builtin_template.\n` +
    `- Only use generate_deck(insert_mode:"replace") if editing in place is impossible; if you do, match this deck's visual language closely.\n` +
    `When done, briefly confirm what was adapted.`

  return { displayText, instruction }
}
