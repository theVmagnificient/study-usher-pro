import type { ValidatorComment } from '@/types/study'
import type { Report, User } from '@/types/api'
import { formatPhysicianName } from './utils'


export interface ReportToValidatorCommentContext {
  report: Report
  author?: User
}


export function mapReportToValidatorComment(
  ctx: ReportToValidatorCommentContext
): ValidatorComment | null {
  const { report, author } = ctx



  if (!report.impression) {
    return null
  }

  return {
    id: `COMMENT-${report.id}`,
    text: report.impression,
    validatorName: author
      ? formatPhysicianName(author.first_name, author.last_name)
      : 'Unknown Validator',
    timestamp: report.created_at,
    isCritical: false,
  }
}


export interface ReportSubmitData {

  protocol: string
  findings: string
  impression: string

  protocol_en?: string
  findings_en?: string
  impression_en?: string
}


export function mapReportSubmit(data: ReportSubmitData) {
  return {

    protocol: data.protocol,
    findings: data.findings,
    impression: data.impression,

    protocol_en: data.protocol_en || null,
    findings_en: data.findings_en || null,
    impression_en: data.impression_en || null,
  }
}
