// Kept legacy tables are notification/audit copies, never send-time authority.
export type EmailOutcome = 'bounce' | 'complaint' | 'unsubscribe'

export function outcomeRows(reason: EmailOutcome, recipient: string, messageId?: string) {
  const email = recipient.toLowerCase()
  const statuses = { bounce: 'bounced', complaint: 'complained', unsubscribe: 'suppressed' } as const
  const messages = {
    bounce: 'Permanent bounce — email address is invalid or rejected',
    complaint: 'Spam complaint — recipient marked email as spam',
    unsubscribe: 'Recipient unsubscribed',
  }
  return {
    suppression: { email, reason, metadata: null },
    log: {
      message_id: messageId ?? null,
      template_name: 'system',
      recipient_email: email,
      status: statuses[reason],
      error_message: messages[reason],
      metadata: null,
    },
  }
}

export function sendAuditRow(template: string, recipient: string, status: 'sent' | 'suppressed' | 'failed', error?: unknown) {
  return {
    message_id: null,
    template_name: template,
    recipient_email: recipient,
    status,
    ...(status === 'failed' ? { error_message: (error instanceof Error ? error.message : String(error)).slice(0, 1000) } : {}),
  }
}