/**
 * Smoke matrix — 10 Vietnamese phrases from the My AI excellence “done” bar.
 * Keyword + local path (no live LLM). Target: ≥8/10 clear correct route.
 */
import { describe, expect, it } from 'vitest'
import {
  shouldAttemptLlmClassify,
  shouldSkipClassifyForLocalTopic,
} from '../src/renderer/src/my-ai-classify'
import {
  answerMyAiLocally,
  buildLocalAnswerSnapshot,
} from '../src/renderer/src/my-ai-local-answer'
import { routeMyAiText } from '../src/renderer/src/my-ai-router'

type SmokeCase = {
  id: string
  text: string
  hasAttachments?: boolean
  /** Expected keyword/local outcome */
  expect: {
    routeKind: string
    /** When set, local topic must match (unknown routes) */
    localTopic?: string
    /** Whether we expect to spend Token on classify */
    classify?: boolean
  }
}

const CASES: readonly SmokeCase[] = [
  {
    id: '1-draft-word',
    text: 'Soạn văn bản Word: báo cáo tuần cho khách ABC',
    expect: { routeKind: 'create_file', classify: false },
  },
  {
    id: '2-sum-recents',
    text: 'Tóm tắt file gần đây',
    expect: { routeKind: 'summarize_recents', classify: false },
  },
  {
    id: '3-sum-attach',
    text: 'Tóm tắt file đính kèm',
    hasAttachments: true,
    expect: { routeKind: 'summarize_attachments', classify: false },
  },
  {
    id: '4-continue',
    text: 'Tiếp tục trên file đang mở: thêm phần kết luận ngắn',
    expect: { routeKind: 'continue_active', classify: false },
  },
  {
    id: '5-sum-active',
    text: 'Tóm tắt file đang mở',
    expect: { routeKind: 'summarize_active', classify: false },
  },
  {
    id: '6-fill-form',
    text: 'Điền biểu mẫu',
    expect: { routeKind: 'fill_form', classify: false },
  },
  {
    id: '7-morning',
    text: 'Hôm nay của tôi',
    expect: { routeKind: 'unknown', localTopic: 'brief', classify: false },
  },
  {
    id: '8-add-task',
    text: 'Thêm công việc gọi khách lúc 15 giờ',
    expect: { routeKind: 'workbench', classify: false },
  },
  {
    id: '9-open-file',
    text: 'Mở file báo cáo',
    expect: { routeKind: 'open_file', classify: false },
  },
  {
    id: '10-plan-quote-task',
    text: 'Soạn báo giá Word và thêm công việc follow-up khách',
    expect: { routeKind: 'plan', classify: false },
  },
]

describe('My AI smoke VI (10 phrases)', () => {
  it('routes ≥8/10 correctly without needing classify', () => {
    let ok = 0
    const failures: string[] = []

    for (const c of CASES) {
      const route = routeMyAiText(c.text, {
        practiceId: 'sales',
        hasAttachments: Boolean(c.hasAttachments),
      })
      const local = answerMyAiLocally(
        c.text,
        buildLocalAnswerSnapshot('sales', []),
        true,
      )
      const wouldClassify =
        shouldAttemptLlmClassify(route) &&
        !shouldSkipClassifyForLocalTopic(local.topic)

      let pass = route.kind === c.expect.routeKind
      if (pass && c.expect.localTopic) {
        pass = local.topic === c.expect.localTopic
      }
      if (pass && c.expect.classify !== undefined) {
        pass = wouldClassify === c.expect.classify
      }

      if (pass) ok++
      else {
        failures.push(
          `${c.id}: got route=${route.kind} local=${local.topic} classify=${wouldClassify}; want ${c.expect.routeKind}` +
            (c.expect.localTopic ? `/${c.expect.localTopic}` : '') +
            ` classify=${c.expect.classify}`,
        )
      }
    }

    expect(failures, failures.join('\n')).toEqual([])
    expect(ok).toBeGreaterThanOrEqual(8)
    expect(ok).toBe(CASES.length)
  })
})
