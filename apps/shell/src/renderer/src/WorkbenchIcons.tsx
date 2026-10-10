import type { ReactElement } from 'react'
import type { PracticePillarId, WorkbenchModuleId } from '@uniwork/practice-core'

type IconId = PracticePillarId | WorkbenchModuleId | 'add'

export type WorkbenchIconTone = 'badge' | 'quiet'

/**
 * Glyphs use currentColor so the same art works as:
 * - badge: colored rounded square + white glyph
 * - quiet: monochrome outline/fill for Spaces sidebar & page headers
 */
const BADGE: Record<IconId, { bg: string; glyph: ReactElement }> = {
  knowledge: {
    bg: '#3276CD',
    glyph: (
      <>
        <path d="M7 6.5h10v11H7z" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M10 6.5V17.5M7 10.5h10" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  },
  materials: {
    bg: '#4FA16B',
    glyph: (
      <>
        <path d="M7.5 5.5h7l3 3V18H7.5z" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M14.5 5.5V8.5h3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 11.5h5M10 14h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  skills: {
    bg: '#F5A524',
    glyph: (
      <path
        d="M12 5.5 13.6 9.2l4 .6-2.9 2.9.7 4L12 14.8l-3.4 1.9.7-4-2.9-2.9 4-.6z"
        fill="currentColor"
      />
    ),
  },
  compose: {
    bg: '#7B61FF',
    glyph: (
      <>
        <path d="M6.5 17 15.5 8l2 2-9 9H6.5z" fill="currentColor" />
        <path d="M14.8 7.2 16.5 5.5 18.2 7.2 16.5 8.9z" fill="currentColor" />
      </>
    ),
  },
  desk: {
    bg: '#0EA5E9',
    glyph: (
      <>
        <path
          d="M4.5 10.5 12 4.5l7.5 6V18a1 1 0 0 1-1 1h-4.2v-4.2H9.7V19H5.5a1 1 0 0 1-1-1z"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="12" cy="11.2" r="1.3" fill="currentColor" />
      </>
    ),
  },
  calendar: {
    bg: '#E85D4C',
    glyph: (
      <>
        <rect
          x="6.5"
          y="7"
          width="11"
          height="10"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M6.5 10h11M9 5.5v3M15 5.5v3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
  },
  tasks: {
    bg: '#2F9E8A',
    glyph: (
      <>
        <path d="M7 8h10M7 12h10M7 16h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path
          d="M5.5 8l1 1 2-2.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  'project-mgmt': {
    bg: '#0EA5E9',
    glyph: (
      <>
        <rect x="5.5" y="6" width="5" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="13.5" y="6" width="5" height="7.5" rx="1.2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M7.2 9h1.6M7.2 12h1.6M15.2 9h1.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
  },
  crm: {
    bg: '#8B5CF6',
    glyph: (
      <>
        <circle cx="9" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="15.5" cy="9.5" r="1.8" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path
          d="M5.5 17c.6-2.4 2.2-3.6 3.5-3.6S11.9 14.6 12.5 17M13.2 16.2c.4-1.5 1.4-2.3 2.3-2.3s1.8.7 2.2 2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </>
    ),
  },
  fund: {
    bg: '#059669',
    glyph: (
      <>
        <rect x="5.5" y="7" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M8 9.2h1.6M14.4 14.8H16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
  },
  notes: {
    bg: '#5B7CFA',
    glyph: (
      <>
        <path d="M7 5.5h7.5L17.5 8.5V18H7z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path
          d="M9.5 11h5M9.5 13.5h5M9.5 16h3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </>
    ),
  },
  email: {
    bg: '#EA4335',
    glyph: (
      <>
        <rect
          x="5.5"
          y="7"
          width="13"
          height="10"
          rx="1.6"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M6.2 8.2 12 12.2 17.8 8.2"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  assistant: {
    bg: '#0F7FFF',
    glyph: (
      <>
        <path
          d="M8 9a4 4 0 0 1 8 0v2a4 4 0 0 1-8 0z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M7 12.5v.8a5 5 0 0 0 10 0v-.8M12 17.5V19"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
  },
  forms: {
    bg: '#3D8BDB',
    glyph: (
      <>
        <rect
          x="7"
          y="5.5"
          width="10"
          height="13"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M9.5 9h5M9.5 12h5M9.5 15h3"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </>
    ),
  },
  personal: {
    bg: '#6366F1',
    glyph: (
      <>
        <circle cx="12" cy="9" r="2.4" fill="currentColor" />
        <path
          d="M6.5 18c.9-2.6 2.8-3.8 5.5-3.8S16.6 15.4 17.5 18"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
  },
  'personal-finance': {
    bg: '#16A34A',
    glyph: (
      <>
        <circle cx="12" cy="12" r="5.2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path
          d="M12 8.2v7.6M10 9.8c.5-.7 1.1-1 1.9-1 1.2 0 2 .7 2 1.6 0 .9-.8 1.5-2 1.5s-2 .6-2 1.6c0 .9.9 1.6 2.1 1.6.8 0 1.4-.3 1.8-.9"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
      </>
    ),
  },
  events: {
    bg: '#DB2777',
    glyph: (
      <>
        <path d="M6.5 9.5h11v8H6.5z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path
          d="M9 7v3M15 7v3M6.5 12.5h11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
  },
  health: {
    bg: '#EF4444',
    glyph: (
      <path
        d="M12 18.2 6.2 12.2A3.6 3.6 0 0 1 12 7.2a3.6 3.6 0 0 1 5.8 5z"
        fill="currentColor"
      />
    ),
  },
  'self-growth': {
    bg: '#0D9488',
    glyph: (
      <>
        <path
          d="M6 17 10.5 10l3 3.5L18 6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M14.5 6H18v3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  family: {
    bg: '#EA580C',
    glyph: (
      <>
        <circle cx="8.5" cy="8.5" r="1.8" fill="currentColor" />
        <circle cx="15.5" cy="8.5" r="1.8" fill="currentColor" />
        <path
          d="M5 17c.5-2.2 1.8-3.3 3.5-3.3S11.5 14.8 12 17M12 17c.5-2.2 1.8-3.3 3.5-3.3S18.5 14.8 19 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
  },
  friends: {
    bg: '#F59E0B',
    glyph: (
      <>
        <circle cx="9" cy="9" r="2" fill="currentColor" />
        <circle cx="15" cy="9.5" r="1.6" fill="currentColor" />
        <path
          d="M5.5 17c.6-2.2 2-3.3 3.5-3.3S12 14.8 12.5 17M12.8 17c.4-1.6 1.4-2.5 2.4-2.5s2 .9 2.4 2.5"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
        />
        <path
          d="M16.2 6.2c.7-.2 1.4.2 1.6.9"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
        />
      </>
    ),
  },
  pets: {
    bg: '#F97316',
    glyph: (
      <>
        <ellipse cx="12" cy="13.2" rx="4.2" ry="3.6" fill="currentColor" />
        <circle cx="7.2" cy="8.2" r="1.7" fill="currentColor" />
        <circle cx="10.2" cy="6.8" r="1.5" fill="currentColor" />
        <circle cx="13.8" cy="6.8" r="1.5" fill="currentColor" />
        <circle cx="16.8" cy="8.2" r="1.7" fill="currentColor" />
      </>
    ),
  },
  travel: {
    bg: '#0284C7',
    glyph: (
      <>
        <path
          d="M4.5 14.5 9 13l3.2-5.2a1.2 1.2 0 0 1 1.7-.4l.6.4a1.2 1.2 0 0 1 .3 1.6L12.2 13.5l4.8 1.2 1.3-1.1a.9.9 0 0 1 1.3.1l.4.5a.9.9 0 0 1-.2 1.3L16.5 18H6.2a1.5 1.5 0 0 1-1.4-2z"
          fill="currentColor"
        />
        <path d="M8 18.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  clients: {
    bg: '#2563EB',
    glyph: (
      <>
        <circle cx="9" cy="9" r="2.2" fill="currentColor" />
        <circle cx="15.5" cy="10" r="1.7" fill="currentColor" />
        <path
          d="M5 17.5c.7-2.4 2.2-3.5 4-3.5s3.3 1.1 4 3.5M13 17.5c.4-1.6 1.4-2.4 2.5-2.4s2.1.8 2.5 2.4"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
        />
      </>
    ),
  },
  contracts: {
    bg: '#1D4ED8',
    glyph: (
      <>
        <path d="M7 5.5h7.5L17.5 8.5V18H7z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path
          d="M9.5 11h5M9.5 13.5h5M9.5 16h3.5"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        <path d="M14.5 5.5V8.5h3" stroke="currentColor" strokeWidth="1.4" />
      </>
    ),
  },
  matters: {
    bg: '#7C3AED',
    glyph: (
      <>
        <path d="M8 6.5h8v11H8z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path
          d="M10.5 9.5h3M10.5 12h3M10.5 14.5h2"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        <path
          d="M6.5 8.5h2v9h-2a1.5 1.5 0 0 1-1.5-1.5v-6A1.5 1.5 0 0 1 6.5 8.5z"
          fill="currentColor"
        />
      </>
    ),
  },
  students: {
    bg: '#0D9488',
    glyph: (
      <>
        <circle cx="12" cy="8" r="2.4" fill="currentColor" />
        <path
          d="M7 17.5c.8-2.6 2.4-3.8 5-3.8s4.2 1.2 5 3.8"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
        />
        <path
          d="M5.5 10.5 12 7.5l6.5 3-6.5 3z"
          stroke="currentColor"
          strokeWidth="1.35"
          fill="none"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  parents: {
    bg: '#DB2777',
    glyph: (
      <>
        <circle cx="8.5" cy="8.2" r="2.1" fill="currentColor" />
        <circle cx="15.2" cy="8.2" r="2.1" fill="currentColor" />
        <path
          d="M4.8 17c.6-2.2 1.9-3.2 3.7-3.2s3.1 1 3.7 3.2M12.2 17c.5-1.8 1.6-2.7 3-2.7s2.5.9 3 2.7"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
        />
      </>
    ),
  },
  grades: {
    bg: '#CA8A04',
    glyph: (
      <>
        <path
          d="M6.5 6.5h11v11H6.5z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M6.5 10h11M6.5 13.5h11M10 6.5v11" stroke="currentColor" strokeWidth="1.35" />
      </>
    ),
  },
  attendance: {
    bg: '#059669',
    glyph: (
      <>
        <circle cx="12" cy="8" r="2.3" fill="currentColor" />
        <path
          d="M7.5 17c.7-2.4 2.2-3.5 4.5-3.5s3.8 1.1 4.5 3.5"
          stroke="currentColor"
          strokeWidth="1.45"
          strokeLinecap="round"
        />
        <path
          d="M15.5 10.5 17 12l2.5-2.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </>
    ),
  },
  timetable: {
    bg: '#2563EB',
    glyph: (
      <>
        <path
          d="M6.5 7.5h11v10H6.5z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path d="M6.5 10.5h11M10 7.5v10M14 7.5v10" stroke="currentColor" strokeWidth="1.3" />
        <path d="M9 5.5v2M15 5.5v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  questions: {
    bg: '#7C3AED',
    glyph: (
      <>
        <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path
          d="M10 9.8c.4-1 1.2-1.5 2.1-1.5 1.1 0 2 .7 2 1.8 0 1.2-.9 1.6-1.6 2.1-.5.3-.7.6-.7 1.2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="12" cy="16.2" r="0.85" fill="currentColor" />
      </>
    ),
  },
  add: {
    bg: '#64748B',
    glyph: (
      <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    ),
  },
}

export function WorkbenchIcon({
  id,
  size = 18,
  tone = 'badge',
}: {
  id: IconId
  size?: number
  tone?: WorkbenchIconTone
}): ReactElement {
  const def = BADGE[id]
  const quiet = tone === 'quiet'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`wb-app-icon${quiet ? ' is-quiet' : ''}`}
      style={quiet ? undefined : { color: '#fff' }}
    >
      {quiet ? null : <rect width="24" height="24" rx="5.5" fill={def.bg} />}
      {def.glyph}
    </svg>
  )
}
