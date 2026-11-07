import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { EmailAPIError } from 'npm:@lovable.dev/email-js@0.5.0'
import { sendTemplateEmail, type SendTemplateEmailOptions } from './transactional-email-templates/send-email.ts'
import { sendAuditRow } from './email-audit.ts'

export async function sendAuditedEmail(
  client: SupabaseClient,
  template: string,
  recipient: string,
  options: SendTemplateEmailOptions,
) {
  async function audit(status: 'sent' | 'suppressed' | 'failed', error?: unknown) {
    try {
      const { error: writeError } = await client.from('email_send_log').insert(sendAuditRow(template, recipient, status, error))
      if (writeError) console.error('Email audit write failed', { code: writeError.code, message: writeError.message })
    } catch {
      console.error('Email audit write failed')
    }
  }

  try {
    let result
    try {
      result = await sendTemplateEmail(template, recipient, options)
    } catch (error) {
      if (!(error instanceof EmailAPIError) || error.status !== 429) throw error
      // Retry only after the API's prescribed cooldown; same logical send key.
      await new Promise((resolve) => setTimeout(resolve, (error.retryAfterSeconds ?? 60) * 1000))
      result = await sendTemplateEmail(template, recipient, options)
    }
    await audit(result.sent ? 'sent' : 'suppressed')
    return result
  } catch (error) {
    await audit('failed', error)
    throw error
  }
}