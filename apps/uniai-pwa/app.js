/**
 * uniAI standalone PWA — ChatGPT-style shell.
 * Production host: https://uniwork.app/app
 */

const STORE_KEY = 'uniai.chats.v1'
const SUGGESTIONS = [
  {
    title: 'Plan my week',
    subtitle: 'Summarize tasks and priorities',
  },
  {
    title: 'Draft an update',
    subtitle: 'Short project status email',
  },
  {
    title: 'Open Health',
    subtitle: 'Launch UniWork Office on this device',
  },
  {
    title: 'Explain Token Hub',
    subtitle: 'How credits work with uniAI',
  },
]

/** Office suite plugins (connect context + open Desktop when installed). */
const OFFICE_PLUGINS = [
  { id: 'docs', label: 'Docs', hint: 'Word / văn bản', app: 'docs' },
  { id: 'sheets', label: 'Sheets', hint: 'Excel / bảng tính', app: 'sheets' },
  { id: 'slides', label: 'Slides', hint: 'PowerPoint', app: 'slides' },
  { id: 'pdf', label: 'PDF', hint: 'Xem & chú thích PDF', app: 'pdf' },
  { id: 'markdown', label: 'Markdown', hint: 'Ghi chú .md', app: 'markdown' },
  { id: 'html', label: 'HTML', hint: 'Trang web tĩnh', app: 'html' },
]

/** Workbench tabs — deep-linked via uniwork://agent/intent */
const WORKBENCH_TABS = [
  { id: 'desk', label: 'Không gian của tôi', hint: 'My Space' },
  { id: 'calendar', label: 'Lịch', hint: 'Calendar' },
  { id: 'tasks', label: 'Công việc', hint: 'Tasks' },
  { id: 'notes', label: 'Ghi chú', hint: 'Notes' },
  { id: 'assistant', label: 'Trợ lý AI', hint: 'AI Assistant' },
  { id: 'forms', label: 'Biểu mẫu', hint: 'Forms' },
  { id: 'personal', label: 'Cá nhân', hint: 'Personal' },
  { id: 'personal-finance', label: 'Tài chính cá nhân', hint: 'Finance' },
  { id: 'events', label: 'Sự kiện', hint: 'Events' },
  { id: 'health', label: 'Sức khoẻ', hint: 'Health' },
  { id: 'self-growth', label: 'Phát triển bản thân', hint: 'Self-growth' },
  { id: 'family', label: 'Gia đình tôi', hint: 'Family' },
  { id: 'friends', label: 'Bạn bè', hint: 'Friends' },
  { id: 'travel', label: 'Du lịch', hint: 'Travel' },
  { id: 'clients', label: 'Khách hàng', hint: 'Clients' },
  { id: 'contracts', label: 'Hợp đồng', hint: 'Contracts' },
  { id: 'matters', label: 'Vụ việc', hint: 'Matters' },
]

/** @typedef {{ id: string, title: string, messages: { role: 'user'|'assistant', text: string }[] }} Chat */
/** @typedef {{ id: string, kind: 'file'|'plugin', label: string, detail?: string, pluginKind?: 'office'|'workbench', pluginId?: string, fileName?: string }} Attachment */

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/** @returns {Chat[]} */
function loadChats() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** @param {Chat[]} chats */
function saveChats(chats) {
  localStorage.setItem(STORE_KEY, JSON.stringify(chats))
}

function newChat() {
  return { id: uid(), title: 'New chat', messages: [] }
}

let chats = loadChats()
if (chats.length === 0) {
  chats = [newChat()]
  saveChats(chats)
}
let activeId = chats[0].id

/** @type {Attachment[]} */
let attachments = []

const el = {
  list: document.getElementById('chatList'),
  thread: document.getElementById('thread'),
  title: document.getElementById('threadTitle'),
  form: document.getElementById('composer'),
  input: document.getElementById('input'),
  btnSend: document.getElementById('btnSend'),
  btnNew: document.getElementById('btnNew'),
  btnInstall: document.getElementById('btnInstall'),
  suggestions: document.getElementById('suggestions'),
  sidebar: document.getElementById('sidebar'),
  btnMenu: document.getElementById('btnMenu'),
  scrim: document.getElementById('scrim'),
  btnAttach: document.getElementById('btnAttach'),
  attachMenu: document.getElementById('attachMenu'),
  attachChips: document.getElementById('attachChips'),
  inputCamera: document.getElementById('inputCamera'),
  inputPhoto: document.getElementById('inputPhoto'),
  inputFile: document.getElementById('inputFile'),
  pluginPanel: document.getElementById('pluginPanel'),
  pluginScrim: document.getElementById('pluginScrim'),
  pluginBody: document.getElementById('pluginBody'),
  btnPluginClose: document.getElementById('btnPluginClose'),
}

function activeChat() {
  return chats.find((c) => c.id === activeId) ?? chats[0]
}

function syncSendEnabled() {
  el.btnSend.disabled = el.input.value.trim().length === 0 && attachments.length === 0
}

function setSidebarOpen(open) {
  el.sidebar.classList.toggle('open', open)
  el.scrim.hidden = !open
}

function setAttachMenuOpen(open) {
  el.attachMenu.hidden = !open
  el.btnAttach.setAttribute('aria-expanded', open ? 'true' : 'false')
}

function setPluginOpen(open) {
  el.pluginPanel.hidden = !open
  el.pluginScrim.hidden = !open
  if (open) renderPluginPanel()
}

function intentUrl(tab, summary) {
  const q = new URLSearchParams({
    tab,
    action: 'open',
    source: 'pwa',
    summary: summary || `Open ${tab}`,
  })
  return `uniwork://agent/intent?${q.toString()}`
}

function openDeepLink(url) {
  const a = document.createElement('a')
  a.href = url
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function renderChips() {
  el.attachChips.innerHTML = ''
  el.attachChips.hidden = attachments.length === 0
  for (const att of attachments) {
    const chip = document.createElement('span')
    chip.className = `chip${att.kind === 'plugin' ? ' is-plugin' : ''}`
    const label = document.createElement('span')
    label.className = 'chip-label'
    label.textContent = att.label
    label.title = att.detail || att.label
    const x = document.createElement('button')
    x.type = 'button'
    x.className = 'chip-x'
    x.setAttribute('aria-label', 'Remove')
    x.textContent = '×'
    x.addEventListener('click', () => {
      attachments = attachments.filter((a) => a.id !== att.id)
      renderChips()
      renderPluginPanel()
      syncSendEnabled()
    })
    chip.append(label, x)
    el.attachChips.appendChild(chip)
  }
  syncSendEnabled()
}

function isPluginOn(kind, id) {
  return attachments.some((a) => a.kind === 'plugin' && a.pluginKind === kind && a.pluginId === id)
}

function togglePlugin(kind, id, label, detail) {
  const existing = attachments.find(
    (a) => a.kind === 'plugin' && a.pluginKind === kind && a.pluginId === id,
  )
  if (existing) {
    attachments = attachments.filter((a) => a.id !== existing.id)
  } else {
    attachments.push({
      id: uid(),
      kind: 'plugin',
      pluginKind: kind,
      pluginId: id,
      label: kind === 'office' ? `Office · ${label}` : `Workbench · ${label}`,
      detail,
    })
  }
  renderChips()
  renderPluginPanel()
}

function renderPluginPanel() {
  if (el.pluginPanel.hidden) return
  el.pluginBody.innerHTML = ''

  const officeSec = document.createElement('section')
  officeSec.className = 'plugin-section'
  officeSec.innerHTML = '<h3>Bộ Office</h3>'
  const grid = document.createElement('div')
  grid.className = 'plugin-grid'
  for (const p of OFFICE_PLUGINS) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = `plugin-card${isPluginOn('office', p.id) ? ' is-on' : ''}`
    btn.innerHTML = `<strong>${escapeHtml(p.label)}</strong><span>${escapeHtml(p.hint)}</span>`
    btn.addEventListener('click', () => togglePlugin('office', p.id, p.label, p.hint))
    grid.appendChild(btn)
  }
  officeSec.appendChild(grid)

  const wbSec = document.createElement('section')
  wbSec.className = 'plugin-section'
  wbSec.innerHTML = '<h3>Workbench</h3>'
  const list = document.createElement('div')
  list.className = 'plugin-list'
  for (const t of WORKBENCH_TABS) {
    const row = document.createElement('div')
    row.className = `plugin-row${isPluginOn('workbench', t.id) ? ' is-on' : ''}`
    row.innerHTML = `
      <span class="plugin-dot" aria-hidden="true"></span>
      <span class="plugin-row-text">
        <strong>${escapeHtml(t.label)}</strong>
        <span>${escapeHtml(t.hint)}</span>
      </span>
    `
    const connect = document.createElement('button')
    connect.type = 'button'
    connect.className = 'plugin-open'
    connect.textContent = isPluginOn('workbench', t.id) ? 'Bỏ' : 'Kết nối'
    connect.addEventListener('click', (e) => {
      e.stopPropagation()
      togglePlugin('workbench', t.id, t.label, t.hint)
    })
    const open = document.createElement('button')
    open.type = 'button'
    open.className = 'plugin-open'
    open.textContent = 'Mở'
    open.title = 'Mở tab trên UniWork Office (máy này)'
    open.addEventListener('click', (e) => {
      e.stopPropagation()
      if (!isPluginOn('workbench', t.id)) {
        togglePlugin('workbench', t.id, t.label, t.hint)
      }
      openDeepLink(intentUrl(t.id, `Open ${t.label}`))
    })
    row.append(connect, open)
    row.addEventListener('click', () => togglePlugin('workbench', t.id, t.label, t.hint))
    list.appendChild(row)
  }
  wbSec.appendChild(list)

  const tip = document.createElement('p')
  tip.className = 'fineprint'
  tip.style.textAlign = 'left'
  tip.style.margin = '0 4px'
  tip.textContent =
    'Plugin gắn ngữ cảnh vào chat. “Mở” gọi UniWork Office qua deep link nếu app đã cài trên máy.'

  el.pluginBody.append(officeSec, wbSec, tip)
}

function addFiles(fileList) {
  const files = Array.from(fileList || [])
  for (const f of files) {
    const kindLabel = f.type.startsWith('image/') ? 'Ảnh' : 'Tệp'
    attachments.push({
      id: uid(),
      kind: 'file',
      label: `${kindLabel} · ${f.name}`,
      detail: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      fileName: f.name,
    })
  }
  renderChips()
}

function renderList() {
  el.list.innerHTML = ''
  for (const c of chats) {
    const li = document.createElement('li')
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = c.title
    btn.className = c.id === activeId ? 'active' : ''
    btn.addEventListener('click', () => {
      activeId = c.id
      setSidebarOpen(false)
      render()
    })
    li.appendChild(btn)
    el.list.appendChild(li)
  }
}

function renderSuggestions(show) {
  el.suggestions.hidden = !show
  el.suggestions.innerHTML = ''
  if (!show) return
  for (const s of SUGGESTIONS) {
    const b = document.createElement('button')
    b.type = 'button'
    b.innerHTML = `${escapeHtml(s.title)}<span>${escapeHtml(s.subtitle)}</span>`
    b.addEventListener('click', () => send(`${s.title}: ${s.subtitle}`))
    el.suggestions.appendChild(b)
  }
}

function escapeHtml(s) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderThread() {
  const chat = activeChat()
  el.title.textContent = chat.messages.length === 0 ? 'uniAI' : chat.title
  el.thread.innerHTML = ''
  el.thread.classList.toggle('is-empty', chat.messages.length === 0)

  if (chat.messages.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'empty'
    empty.innerHTML = `
      <div class="empty-mark" aria-hidden="true">AI</div>
      <h2>Where should we begin?</h2>
      <p>uniAI is your independent UniWork assistant — Token Hub on the web, optional Office deep links on this device.</p>
    `
    el.thread.appendChild(empty)
    renderSuggestions(true)
    return
  }

  renderSuggestions(false)
  for (const m of chat.messages) {
    const row = document.createElement('div')
    row.className = `msg ${m.role}`
    if (m.role === 'assistant') {
      const av = document.createElement('div')
      av.className = 'msg-avatar'
      av.textContent = 'AI'
      av.setAttribute('aria-hidden', 'true')
      row.appendChild(av)
    }
    const body = document.createElement('div')
    body.className = 'msg-body'
    body.textContent = m.text
    row.appendChild(body)
    el.thread.appendChild(row)
  }
  el.thread.scrollTop = el.thread.scrollHeight
}

function render() {
  renderList()
  renderThread()
  renderChips()
  syncSendEnabled()
}

/**
 * @param {string} text
 * @param {Attachment[]} atts
 */
function demoReply(text, atts) {
  const lower = text.toLowerCase()
  const plugins = atts.filter((a) => a.kind === 'plugin')
  const files = atts.filter((a) => a.kind === 'file')

  if (plugins.length || files.length) {
    const lines = ['Đã nhận ngữ cảnh đính kèm:']
    for (const p of plugins) lines.push(`• ${p.label}`)
    for (const f of files) lines.push(`• ${f.label}`)
    const wb = plugins.find((p) => p.pluginKind === 'workbench')
    if (wb?.pluginId) {
      lines.push('')
      lines.push(`Deep link Workbench (nếu Office đã cài):`)
      lines.push(intentUrl(wb.pluginId, `Open ${wb.label}`))
    }
    if (plugins.some((p) => p.pluginKind === 'office')) {
      lines.push('')
      lines.push(
        'Plugin Office đã kết nối vào cuộc trò chuyện. Token Hub sẽ dùng ngữ cảnh này khi soạn / chuyển file trong production.',
      )
    }
    return lines.join('\n')
  }

  if (lower.includes('health') || lower.includes('sức')) {
    return (
      'I can open Health in UniWork Office on this device.\n\n' +
      `Deep link:\n${intentUrl('health', 'Open Health')}\n\n` +
      'Hoặc dùng + → Plugin → Workbench → Sức khoẻ.'
    )
  }
  if (lower.includes('token')) {
    return (
      'Token Hub meters uniAI usage on your UniWork account.\n\n' +
      'Sign in on the web PWA to use your balance. Desktop Office is optional for chat.'
    )
  }
  return (
    'uniAI received your message.\n\n' +
    'Dùng nút + để mở Camera, Ảnh, Tệp, hoặc Plugin (Office + Workbench).'
  )
}

/** @param {string} text */
function send(text) {
  const trimmed = text.trim()
  const atts = [...attachments]
  if (!trimmed && atts.length === 0) return
  const chat = activeChat()
  const composed =
    trimmed ||
    atts.map((a) => a.label).join(', ')
  if (chat.messages.length === 0) {
    chat.title = composed.slice(0, 48)
  }
  const userLines = []
  if (trimmed) userLines.push(trimmed)
  if (atts.length) {
    userLines.push('')
    userLines.push(atts.map((a) => `[${a.label}]`).join(' '))
  }
  chat.messages.push({ role: 'user', text: userLines.join('\n').trim() })
  chat.messages.push({ role: 'assistant', text: demoReply(trimmed, atts) })
  // Keep plugin connections across turns; clear one-shot files.
  attachments = atts.filter((a) => a.kind === 'plugin')
  saveChats(chats)
  el.input.value = ''
  autosize()
  render()
}

function autosize() {
  el.input.style.height = 'auto'
  el.input.style.height = `${Math.min(el.input.scrollHeight, 200)}px`
}

el.form.addEventListener('submit', (e) => {
  e.preventDefault()
  send(el.input.value)
})

el.input.addEventListener('input', () => {
  autosize()
  syncSendEnabled()
})

el.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send(el.input.value)
  }
})

el.btnNew.addEventListener('click', () => {
  const c = newChat()
  chats = [c, ...chats]
  activeId = c.id
  attachments = []
  saveChats(chats)
  setSidebarOpen(false)
  setAttachMenuOpen(false)
  setPluginOpen(false)
  render()
  el.input.focus()
})

el.btnMenu.addEventListener('click', () => setSidebarOpen(true))
el.scrim.addEventListener('click', () => setSidebarOpen(false))

el.btnAttach.addEventListener('click', (e) => {
  e.preventDefault()
  e.stopPropagation()
  const willOpen = el.attachMenu.hidden
  setAttachMenuOpen(willOpen)
})

el.attachMenu.addEventListener('click', (e) => {
  e.stopPropagation()
  const btn = e.target.closest('[data-attach]')
  if (!btn) return
  const action = btn.getAttribute('data-attach')
  setAttachMenuOpen(false)
  if (action === 'camera') el.inputCamera.click()
  else if (action === 'photo') el.inputPhoto.click()
  else if (action === 'file') el.inputFile.click()
  else if (action === 'plugin') setPluginOpen(true)
})

el.inputCamera.addEventListener('change', () => {
  addFiles(el.inputCamera.files)
  el.inputCamera.value = ''
})
el.inputPhoto.addEventListener('change', () => {
  addFiles(el.inputPhoto.files)
  el.inputPhoto.value = ''
})
el.inputFile.addEventListener('change', () => {
  addFiles(el.inputFile.files)
  el.inputFile.value = ''
})

el.btnPluginClose.addEventListener('click', () => setPluginOpen(false))
el.pluginScrim.addEventListener('click', () => setPluginOpen(false))

document.addEventListener(
  'pointerdown',
  (e) => {
    if (el.attachMenu.hidden) return
    const t = e.target
    if (
      t instanceof Node &&
      !el.attachMenu.contains(t) &&
      t !== el.btnAttach &&
      !el.btnAttach.contains(t)
    ) {
      setAttachMenuOpen(false)
    }
  },
  true,
)

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    setAttachMenuOpen(false)
    setPluginOpen(false)
  }
})

/** @type {BeforeInstallPromptEvent | null} */
let deferredInstall = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredInstall = /** @type {BeforeInstallPromptEvent} */ (e)
  el.btnInstall.hidden = false
})

el.btnInstall.addEventListener('click', async () => {
  if (!deferredInstall) return
  await deferredInstall.prompt()
  deferredInstall = null
  el.btnInstall.hidden = true
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./sw.js')
  })
}

render()
el.input.focus()
