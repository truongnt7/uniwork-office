export type {
  CreateEduMetaInput,
  EduMeta,
  EduTemplateDef,
  EduTemplateId,
  EduWorkflowDef,
  EduWorkflowId,
} from './types.js'
export { EDU_META_VERSION } from './types.js'
export { EDU_LESSON_CHAIN_TEMPLATES, EDU_TEMPLATES, EDU_WORKFLOWS } from './catalog.js'
export { createEduMeta, isEduMeta, packDisplayName } from './meta.js'
export { eduTemplateHtml, eduTemplateTitle } from './templates.js'
export { eduSystemPromptAddendum, eduWorkflowPrompt } from './prompts.js'
export { eduPackReadme, looksLikeAiCreditError } from './pack.js'
export {
  extractHubBalanceHint,
  hubModelsUrl,
  normalizeHubBaseUrl,
  type HubProbeInput,
  type HubProbeResult,
} from './hub.js'
