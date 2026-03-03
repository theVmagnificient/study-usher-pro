/**
 * Data structures and parsing for the unified Final Report editor.
 */

export interface FinalReportSentence {
  id: string
  text: string
  html?: string
  originalText?: string
  isAI?: boolean
  isNormal?: boolean
  isConfirmed?: boolean
}

export interface FinalReportBlock {
  id: string
  title?: string
  sentences: FinalReportSentence[]
  isImpressionItem?: boolean
  itemNumber?: number
}

export interface FinalReportSection {
  id: string
  title: string
  blocks: FinalReportBlock[]
}

export interface FinalReportData {
  sections: FinalReportSection[]
  confirmedNormalPhrases: string[]
}

// --------------- Parsing ---------------

export function parseFinalReport(
  protocol: string,
  findings: string,
  impression: string,
  confirmedPhrases: string[] = [],
  aiSentenceTexts: string[] = []
): FinalReportData {
  const confirmedSet = new Set(confirmedPhrases.map(p => p.toLowerCase()))
  const aiSet = new Set(aiSentenceTexts.map(s => s.trim().toLowerCase()))

  const parts: string[] = []
  if (protocol.trim()) parts.push(protocol.trim())
  if (findings.trim()) parts.push(findings.trim())
  if (impression.trim()) parts.push(impression.trim())
  const fullText = parts.join('\n\n')

  const lines = fullText.split('\n')
  const sections: FinalReportSection[] = []

  let currentSection: FinalReportSection | null = null
  let currentBlock: FinalReportBlock | null = null
  let pendingLines: string[] = []

  function flushPendingLines() {
    if (pendingLines.length === 0) return
    if (!currentBlock) {
      currentBlock = { id: uid(), sentences: [] }
    }
    for (const line of pendingLines) {
      currentBlock.sentences.push(...parseSentences(line, confirmedSet, aiSet))
    }
    pendingLines = []
  }

  function flushBlock() {
    flushPendingLines()
    if (currentBlock && currentSection) {
      if (currentBlock.sentences.length > 0 || currentBlock.title) {
        currentSection.blocks.push(currentBlock)
      }
    }
    currentBlock = null
  }

  function flushSection() {
    flushBlock()
    if (currentSection) {
      if (currentSection.blocks.length > 0 || currentSection.title) {
        sections.push(currentSection)
      }
    }
    currentSection = null
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (isH1Header(trimmed)) {
      flushSection()
      currentSection = {
        id: uid(),
        title: trimmed.replace(/:$/, ''),
        blocks: []
      }
      continue
    }

    if (!currentSection && trimmed) {
      currentSection = { id: uid(), title: '', blocks: [] }
    }

    if (
      currentSection &&
      isImpressionSection(currentSection.title) &&
      /^\d+\.\s+/.test(trimmed)
    ) {
      flushBlock()
      const match = trimmed.match(/^(\d+)\.\s+(.+)/)
      if (match) {
        const itemBlock: FinalReportBlock = {
          id: uid(),
          isImpressionItem: true,
          itemNumber: parseInt(match[1]),
          sentences: parseSentences(match[2], confirmedSet, aiSet)
        }
        currentSection.blocks.push(itemBlock)
      }
      continue
    }

    if (currentSection && isH2Header(trimmed)) {
      flushBlock()
      currentBlock = { id: uid(), title: trimmed, sentences: [] }
      continue
    }

    if (!trimmed) continue

    pendingLines.push(trimmed)
  }

  flushSection()

  if (sections.length === 0 && fullText.trim()) {
    sections.push({
      id: uid(),
      title: '',
      blocks: [{
        id: uid(),
        sentences: parseSentences(fullText, confirmedSet, aiSet)
      }]
    })
  }

  return { sections, confirmedNormalPhrases: confirmedPhrases }
}

// --------------- Serialization ---------------

const FINDINGS_TITLES = new Set(['FINDINGS', 'НАХОДКИ'])
const IMPRESSION_TITLES = new Set(['IMPRESSION', 'ЗАКЛЮЧЕНИЕ', 'CONCLUSION'])

export function serializeFinalReport(data: FinalReportData): {
  protocol: string
  findings: string
  impression: string
} {
  const protocolParts: string[] = []
  const findingsParts: string[] = []
  const impressionParts: string[] = []

  let target: string[] = protocolParts

  for (const section of data.sections) {
    const upper = section.title.toUpperCase()
    if (FINDINGS_TITLES.has(upper)) target = findingsParts
    else if (IMPRESSION_TITLES.has(upper)) target = impressionParts

    target.push(serializeSection(section))
  }

  return {
    protocol: protocolParts.join('\n\n'),
    findings: findingsParts.join('\n\n'),
    impression: impressionParts.join('\n\n')
  }
}

function serializeSection(section: FinalReportSection): string {
  const parts: string[] = []
  if (section.title) parts.push(`${section.title}:`)

  for (const block of section.blocks) {
    if (block.title) parts.push(block.title)

    if (block.isImpressionItem && block.itemNumber != null) {
      const text = block.sentences.map(s => s.text).join(' ')
      parts.push(`${block.itemNumber}. ${text}`)
    } else {
      for (const s of block.sentences) {
        if (s.text.trim()) parts.push(s.text)
      }
    }
  }

  return parts.join('\n')
}

// --------------- Keyword highlighting ---------------

import { normalKeywords } from '@/data/demoReportCtChest'

export function highlightKeywordsInText(
  text: string,
  confirmedSet: Set<string>
): string {
  const escaped = escapeHtml(text)
  if (!normalKeywords.length) return escaped

  const lowerText = text.toLowerCase()
  const sorted = [...normalKeywords].sort((a, b) => b.length - a.length)

  interface Match { start: number; end: number; kw: string }
  const matches: Match[] = []

  for (const kw of sorted) {
    const lowerKw = kw.toLowerCase()
    let pos = 0
    while ((pos = lowerText.indexOf(lowerKw, pos)) !== -1) {
      const overlaps = matches.some(
        m => (pos < m.end && pos + lowerKw.length > m.start)
      )
      if (!overlaps) {
        matches.push({ start: pos, end: pos + lowerKw.length, kw })
      }
      pos += lowerKw.length
    }
  }

  if (matches.length === 0) return escaped

  matches.sort((a, b) => a.start - b.start)

  let result = ''
  let cursor = 0

  for (const m of matches) {
    result += escapeHtml(text.slice(cursor, m.start))
    const isConfirmed = confirmedSet.has(m.kw.toLowerCase())
    const cls = isConfirmed
      ? 'text-green-600 dark:text-green-400 font-semibold'
      : 'text-red-600 dark:text-red-400 font-semibold'
    result += `<span class="${cls}">${escapeHtml(text.slice(m.start, m.end))}</span>`
    cursor = m.end
  }

  result += escapeHtml(text.slice(cursor))
  return result
}

// --------------- Helpers ---------------

function isH1Header(line: string): boolean {
  return /^[A-ZА-ЯЁ\s]+:$/.test(line) && line.length < 60
}

function isH2Header(line: string): boolean {
  if (!line.endsWith(':')) return false
  if (line.length >= 50) return false
  if (/^\d+\./.test(line)) return false
  if (isH1Header(line)) return false
  return true
}

function isImpressionSection(title: string): boolean {
  const t = title.toUpperCase()
  return t === 'IMPRESSION' || t === 'ЗАКЛЮЧЕНИЕ' || t === 'CONCLUSION'
}

export function isNormalPhrase(text: string): boolean {
  const lower = text.toLowerCase()
  return normalKeywords.some(kw => lower.includes(kw.toLowerCase()))
}

function parseSentences(
  text: string,
  confirmedSet: Set<string>,
  aiSet: Set<string>
): FinalReportSentence[] {
  if (!text.trim()) return []

  const sentences: FinalReportSentence[] = []
  const lines = text.split(/\n/).filter(l => l.trim())

  if (lines.length > 1) {
    for (const line of lines) {
      const t = line.trim()
      if (t) sentences.push(makeSentence(t, confirmedSet, aiSet))
    }
  } else {
    const parts = text.split(/(?<=[.!?])\s+/)
    for (const part of parts) {
      const t = part.trim()
      if (t) sentences.push(makeSentence(t, confirmedSet, aiSet))
    }
  }

  if (sentences.length === 0 && text.trim()) {
    sentences.push(makeSentence(text.trim(), confirmedSet, aiSet))
  }

  return sentences
}

function makeSentence(
  text: string,
  confirmedSet: Set<string>,
  aiSet: Set<string>
): FinalReportSentence {
  const normal = isNormalPhrase(text)
  return {
    id: uid(),
    text,
    originalText: text,
    isNormal: normal,
    isConfirmed: normal && confirmedSet.has(text.toLowerCase()),
    isAI: aiSet.size > 0 && aiSet.has(text.trim().toLowerCase())
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

let _counter = 0
function uid(): string {
  return `fr_${++_counter}_${Math.random().toString(36).slice(2, 8)}`
}
