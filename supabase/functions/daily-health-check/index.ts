import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { sendAuditedEmail } from '../_shared/send-audited-email.ts';
import { getVerifyServiceSid } from '../_shared/twilio-verify.ts';
import { transcriptMatches, shouldPauseAI, type Check } from './checks.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'Configuration unavailable' }, 500);
  const client = createClient(url, key);
  const { data: config, error: configError } = await client.from('health_monitor_config').select('*').eq('id', true).single();
  if (configError || !config) return json({ error: 'Monitor not configured' }, 503);
  if (req.headers.get('x-monitor-token') !== config.token) return json({ error: 'Unauthorized' }, 401);
  const day = new Date().toISOString().slice(0, 10);
  const { data: claimed, error: claimError } = await client.rpc('claim_health_monitor', { p_day: day });
  if (claimError) return json({ error: 'Lock unavailable' }, 503);
  if (!claimed) return json({ skipped: true });
  const { data: previous } = await client.from('health_monitor_runs').select('checks').eq('day', day).single();
  const checks: Check[] = Array.isArray(previous?.checks) ? previous.checks : [];
  const persist = async () => {
    const { error } = await client.from('health_monitor_runs').update({ checks }).eq('day', day);
    if (error) throw new Error('Cannot persist monitor progress');
  };
  const run = async (name: string, task: () => Promise<string>) => {
    if (checks.some(c => c.name === name)) return;
    try { checks.push({ name, ok: true, detail: await task() }); }
    catch { checks.push({ name, ok: false, detail: 'Controllo non riuscito; verificare il servizio.' }); }
    await persist();
  };
  try {
    await run('Sito', async () => {
      const response = await fetch('https://test.englishinfinity.io');
      if (!response.ok || !(await response.text()).includes('<div id="root"')) throw new Error('Site unavailable');
      return 'Pagina raggiungibile (non è una verifica del browser).';
    });
    await run('Database', async () => {
      const { error } = await client.from('leads').select('id', { head: true, count: 'exact' });
      if (error) throw error;
      return 'Lettura disponibile; nessun contatto creato.';
    });
    await run('Twilio', async () => {
      const service = await getVerifyServiceSid();
      const response = await fetch(`https://connector-gateway.lovable.dev/twilio/verify/v2/Services/${service}`, { headers: { Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY') ?? ''}`, 'X-Connection-Api-Key': Deno.env.get('TWILIO_API_KEY') ?? '' } });
      if (!response.ok) throw new Error('Twilio unavailable');
      await response.body?.cancel();
      return 'Servizio di verifica accessibile; nessun codice inviato.';
    });
    await run('Errori email recenti', async () => {
      const since = new Date(Date.now() - 86400000).toISOString();
      const { count, error } = await client.from('email_send_log').select('id', { head: true, count: 'exact' }).eq('status', 'failed').gte('created_at', since);
      if (error || (count ?? 0) > 0) throw new Error('Email failures');
      return 'Nessun invio fallito registrato nelle ultime 24 ore.';
    });
    await run('Audio e trascrizione', async () => {
      if (config.ai_paused) throw new Error('AI checks paused');
      const headers = { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' };
      const checkStatus = async (response: Response) => {
        if (shouldPauseAI(response.status)) {
          await client.from('health_monitor_config').update({ ai_paused: true, pause_reason: `Servizio AI sospeso dopo risposta ${response.status}; richiede verifica e riattivazione.` }).eq('id', true);
        }
        if (!response.ok) throw new Error('Audio service unavailable');
      };
      const speech = await fetch(`${url}/functions/v1/text-to-speech`, { method: 'POST', headers, body: JSON.stringify({ text: 'The English test audio is working.', voice: 'nova' }) });
      await checkStatus(speech);
      const bytes = new Uint8Array(await speech.arrayBuffer());
      if (!bytes.length || !speech.headers.get('content-type')?.startsWith('audio/')) throw new Error('Empty audio');
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      const transcript = await fetch(`${url}/functions/v1/transcribe-audio`, { method: 'POST', headers, body: JSON.stringify({ audio: btoa(binary), mimeType: 'audio/mpeg' }) });
      await checkStatus(transcript);
      const data = await transcript.json();
      if (!transcriptMatches(data.text ?? '')) throw new Error('Transcript mismatch');
      return 'Voce di esempio generata e trascritta correttamente.';
    });
    const failures = checks.filter(check => !check.ok);
    let alertStatus = 'not_needed';
    if (failures.length) {
      try {
        const result = await sendAuditedEmail(client, 'health-alert', 'raff@escapecampus.it', { idempotencyKey: `health-alert-${day}`, templateData: { day, summary: checks.map(c => `${c.ok ? 'OK' : 'ATTENZIONE'} · ${c.name}: ${c.detail}`).join('\n') } });
        alertStatus = result.sent ? 'sent' : 'suppressed';
      } catch { alertStatus = 'failed'; console.error('Daily health alert failed'); }
    }
    const { error } = await client.from('health_monitor_runs').update({ checks, completed_at: new Date().toISOString(), alert_status: alertStatus }).eq('day', day);
    if (error) throw error;
    return json({ day, checks, alertStatus });
  } catch {
    console.error('Daily health monitor failed');
    return json({ error: 'Monitor failed' }, 500);
  }
});