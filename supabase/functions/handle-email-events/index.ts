import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { outcomeRows, type EmailOutcome } from '../_shared/email-audit.ts'

async function recordOutcome(event: { event_id: string; data: { recipient: string; message_id?: string } }, reason: EmailOutcome) {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Missing audit configuration')
  const client = createClient(url, key)
  const rows = outcomeRows(reason, event.data.recipient, event.data.message_id)
  // Stable primary key makes replayed/concurrent deliveries append only once.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(event.event_id))
  const bytes = new Uint8Array(digest).slice(0, 16)
  bytes[6] = (bytes[6] & 15) | 80
  bytes[8] = (bytes[8] & 63) | 128
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  const { data: existing, error: lookupError } = await client.from('email_send_log').select('id').eq('id', id).maybeSingle()
  if (lookupError) throw lookupError
  if (existing) return
  const { error: suppressionError } = await client.from('suppressed_emails').upsert(rows.suppression, { onConflict: 'email' })
  if (suppressionError) throw suppressionError
  const { error: logError } = await client.from('email_send_log').upsert({ id, ...rows.log }, { onConflict: 'id', ignoreDuplicates: true })
  if (logError) throw logError
}

const apiKey = Deno.env.get('LOVABLE_API_KEY')
if (!apiKey) throw new Error('Missing email webhook configuration')
const handler = createEmailWebhookHandler({
  apiKey,
  on: {
    // Placeholder handlers — replace each log with the feature's reaction.
    // Throw on failure so the delivery is retried.
    'email.bounced': async (event) => {
      await recordOutcome(event, 'bounce')
    },
    'email.complaint': async (event) => {
      await recordOutcome(event, 'complaint')
    },
    'email.unsubscribed': async (event) => {
      await recordOutcome(event, 'unsubscribe')
    },
  },
})

Deno.serve((req) => handler(req))
