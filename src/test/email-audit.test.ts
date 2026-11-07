import { describe, expect, it } from 'vitest'
import { outcomeRows, sendAuditRow } from '../../supabase/functions/_shared/email-audit'

describe('preserved email audit contract', () => {
  it('records bounces with the legacy bounce reason and bounced status', () => {
    const rows = outcomeRows('bounce', 'Person@Example.test', 'msg-1')
    expect(rows.suppression).toEqual({ email: 'person@example.test', reason: 'bounce', metadata: null })
    expect(rows.log).toMatchObject({ message_id: 'msg-1', status: 'bounced', template_name: 'system', error_message: 'Permanent bounce — email address is invalid or rejected' })
  })
  it('records complaints with the legacy complaint reason and complained status', () => {
    const rows = outcomeRows('complaint', 'person@example.test')
    expect(rows.suppression.reason).toBe('complaint')
    expect(rows.log.status).toBe('complained')
    expect(rows.log.error_message).toBe('Spam complaint — recipient marked email as spam')
  })
  it('records unsubscribe with suppressed status', () => {
    const rows = outcomeRows('unsubscribe', 'person@example.test')
    expect(rows.suppression.reason).toBe('unsubscribe')
    expect(rows.log.status).toBe('suppressed')
    expect(rows.log.error_message).toBe('Recipient unsubscribed')
  })
  it('records sent sends without a dead queue message ID', () => {
    expect(sendAuditRow('test-result-lead', 'person@example.test', 'sent')).toEqual({ message_id: null, template_name: 'test-result-lead', recipient_email: 'person@example.test', status: 'sent' })
  })
  it('records suppressed sends as a normal audit outcome', () => {
    expect(sendAuditRow('new-lead-admin', 'person@example.test', 'suppressed').status).toBe('suppressed')
  })
  it('records failures with their original error message', () => {
    expect(sendAuditRow('test-result-admin', 'person@example.test', 'failed', new Error('Send refused'))).toMatchObject({ status: 'failed', error_message: 'Send refused' })
  })
})