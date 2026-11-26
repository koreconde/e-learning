import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Send, TestTube2, Trash2, Users, Mail, Plus, RotateCw } from "lucide-react";

type Audience = { id: string; name: string; stats?: { member_count?: number } };
type Campaign = {
  id: string;
  status: string;
  create_time: string;
  send_time: string | null;
  emails_sent: number;
  settings: { subject_line: string; title: string; from_name: string; reply_to: string };
  recipients: { list_id: string; list_name: string };
  report_summary?: { opens?: number; unique_opens?: number; open_rate?: number; clicks?: number; click_rate?: number } | null;
};

const statusColor = (s: string) => {
  switch (s) {
    case "sent": return "bg-emerald-500";
    case "sending": return "bg-blue-500";
    case "schedule":
    case "scheduled": return "bg-amber-500";
    case "save": return "bg-slate-500";
    case "paused": return "bg-orange-500";
    default: return "bg-zinc-500";
  }
};

async function callMc(action: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("mailchimp-admin", {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message || "Errore Mailchimp");
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as any;
}

export default function AdminCampaigns() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [sendConfirm, setSendConfirm] = useState<Campaign | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Campaign | null>(null);
  const [testOpen, setTestOpen] = useState<Campaign | null>(null);
  const [testEmails, setTestEmails] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncListId, setSyncListId] = useState<string>("");

  // create form
  const [cListId, setCListId] = useState("");
  const [cSubject, setCSubject] = useState("");
  const [cPreview, setCPreview] = useState("");
  const [cFromName, setCFromName] = useState("Escape Campus");
  const [cReplyTo, setCReplyTo] = useState("raff@escapecampus.it");
  const [cTitle, setCTitle] = useState("");
  const [cHtml, setCHtml] = useState(
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">\n  <h1>Ciao *|FNAME|*</h1>\n  <p>Il tuo messaggio qui...</p>\n  <p style="margin-top:32px;font-size:12px;color:#888">*|UNSUB|*</p>\n</div>`,
  );
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    document.title = "Admin · Campagne";
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { navigate("/admin/auth", { replace: true }); return; }
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", sess.session.user.id);
      const admin = roles?.some((r) => r.role === "admin") ?? false;
      setIsAdmin(admin);
      if (admin) await refresh();
      setLoading(false);
    })();
  }, [navigate]);

  const refresh = async () => {
    try {
      const [a, c] = await Promise.all([
        callMc("audiences"),
        callMc("campaigns"),
      ]);
      setAudiences(a.audiences || []);
      setCampaigns(c.campaigns || []);
      if (!syncListId && a.audiences?.[0]?.id) setSyncListId(a.audiences[0].id);
      if (!cListId && a.audiences?.[0]?.id) setCListId(a.audiences[0].id);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filtered = useMemo(() => {
    if (!q) return campaigns;
    const s = q.toLowerCase();
    return campaigns.filter((c) =>
      c.settings.subject_line?.toLowerCase().includes(s) ||
      c.settings.title?.toLowerCase().includes(s) ||
      c.recipients?.list_name?.toLowerCase().includes(s),
    );
  }, [campaigns, q]);

  const handleCreate = async () => {
    if (!cListId || !cSubject || !cFromName || !cReplyTo || !cHtml) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    setCreating(true);
    try {
      await callMc("campaign_create", {
        listId: cListId, subject: cSubject, previewText: cPreview,
        fromName: cFromName, replyTo: cReplyTo, title: cTitle || cSubject, html: cHtml,
      });
      toast.success("Campagna creata in bozza");
      setCreateOpen(false);
      setCSubject(""); setCPreview(""); setCTitle("");
      await refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async () => {
    if (!sendConfirm) return;
    try {
      await callMc("campaign_send", { campaignId: sendConfirm.id });
      toast.success("Campagna inviata!");
      setSendConfirm(null);
      await refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await callMc("campaign_delete", { campaignId: deleteConfirm.id });
      toast.success("Campagna eliminata");
      setDeleteConfirm(null);
      await refresh();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleTest = async () => {
    if (!testOpen) return;
    const emails = testEmails.split(/[,\s;]+/).map((s) => s.trim()).filter(Boolean);
    if (emails.length === 0) { toast.error("Inserisci almeno un'email"); return; }
    try {
      await callMc("campaign_send_test", { campaignId: testOpen.id, emails });
      toast.success(`Test inviato a ${emails.length} indirizzo/i`);
      setTestOpen(null);
      setTestEmails("");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleSyncAll = async () => {
    if (!syncListId) { toast.error("Seleziona un'audience"); return; }
    setSyncing(true);
    try {
      const r = await callMc("sync_all_leads", { listId: syncListId });
      toast.success(`Sync completato: ${r.added} nuovi, ${r.updated} aggiornati${r.errors ? `, ${r.errors} errori` : ""}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setSyncing(false); }
  };

  if (loading) return <main className="min-h-screen flex items-center justify-center">Caricamento...</main>;
  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Accesso negato</h1>
          <p className="text-muted-foreground">Solo admin.</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Lead</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Campagne Mailchimp</h1>
              <p className="text-sm text-muted-foreground">
                {campaigns.length} campagne · {audiences.length} audience
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nuova campagna
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {audiences.slice(0, 3).map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Users className="h-4 w-4" /> Audience
              </div>
              <div className="font-semibold mt-1">{a.name}</div>
              <div className="text-2xl font-bold mt-2">{a.stats?.member_count ?? 0}</div>
              <div className="text-xs text-muted-foreground">iscritti</div>
            </Card>
          ))}
        </div>

        <Card className="p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Sync leads → audience:</Label>
            <Select value={syncListId} onValueChange={setSyncListId}>
              <SelectTrigger className="w-[260px] h-9"><SelectValue placeholder="Seleziona audience" /></SelectTrigger>
              <SelectContent>
                {audiences.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={handleSyncAll} disabled={syncing || !syncListId}>
              <RotateCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sync in corso..." : "Sincronizza tutti"}
            </Button>
          </div>
          <div className="ml-auto">
            <Input placeholder="Cerca campagna..." value={q} onChange={(e) => setQ(e.target.value)} className="w-[260px]" />
          </div>
        </Card>

        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Oggetto</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Inviate</TableHead>
                <TableHead className="text-right">Aperture</TableHead>
                <TableHead className="text-right">Click</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nessuna campagna</TableCell>
                </TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium max-w-xs truncate">{c.settings.subject_line || c.settings.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.recipients?.list_name || "—"}</TableCell>
                  <TableCell>
                    <Badge className={statusColor(c.status)}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{c.emails_sent ?? 0}</TableCell>
                  <TableCell className="text-right">
                    {c.report_summary?.open_rate != null
                      ? `${(c.report_summary.open_rate * 100).toFixed(1)}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.report_summary?.click_rate != null
                      ? `${(c.report_summary.click_rate * 100).toFixed(1)}%`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(c.send_time || c.create_time) ? new Date(c.send_time || c.create_time).toLocaleString("it-IT") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {(c.status === "save" || c.status === "paused") && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setTestOpen(c)}>
                            <TestTube2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" onClick={() => setSendConfirm(c)}>
                            <Send className="h-3.5 w-3.5 mr-1" /> Invia
                          </Button>
                        </>
                      )}
                      {c.status !== "sending" && c.status !== "sent" && (
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(c)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Create Campaign */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuova campagna</DialogTitle>
            <DialogDescription>Verrà creata in bozza. Potrai inviare un test prima della spedizione.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Audience *</Label>
              <Select value={cListId} onValueChange={setCListId}>
                <SelectTrigger><SelectValue placeholder="Seleziona audience" /></SelectTrigger>
                <SelectContent>
                  {audiences.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.stats?.member_count ?? 0})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Oggetto *</Label>
              <Input value={cSubject} onChange={(e) => setCSubject(e.target.value)} placeholder="Migliora il tuo inglese in 30 giorni" />
            </div>
            <div>
              <Label>Anteprima (preview text)</Label>
              <Input value={cPreview} onChange={(e) => setCPreview(e.target.value)} placeholder="Testo che appare dopo l'oggetto nell'inbox" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mittente *</Label>
                <Input value={cFromName} onChange={(e) => setCFromName(e.target.value)} />
              </div>
              <div>
                <Label>Reply-to *</Label>
                <Input value={cReplyTo} onChange={(e) => setCReplyTo(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Titolo interno (opzionale)</Label>
              <Input value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="Es: Newsletter Maggio 2026" />
            </div>
            <div>
              <Label>HTML email *</Label>
              <Textarea value={cHtml} onChange={(e) => setCHtml(e.target.value)} rows={12} className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground mt-1">
                Usa <code>*|FNAME|*</code>, <code>*|LNAME|*</code> per personalizzare. <code>*|UNSUB|*</code> è obbligatorio.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annulla</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creazione..." : "Crea bozza"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Test */}
      <Dialog open={!!testOpen} onOpenChange={(o) => !o && setTestOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle><Mail className="inline h-4 w-4 mr-1" />Invia test</DialogTitle>
            <DialogDescription>Una o più email separate da virgola.</DialogDescription>
          </DialogHeader>
          <Input value={testEmails} onChange={(e) => setTestEmails(e.target.value)} placeholder="me@example.com, colleague@example.com" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(null)}>Annulla</Button>
            <Button onClick={handleTest}>Invia test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send confirm */}
      <AlertDialog open={!!sendConfirm} onOpenChange={(o) => !o && setSendConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inviare la campagna?</AlertDialogTitle>
            <AlertDialogDescription>
              "{sendConfirm?.settings.subject_line}" verrà inviata a tutta l'audience "{sendConfirm?.recipients.list_name}". L'azione è irreversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>Invia ora</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la campagna?</AlertDialogTitle>
            <AlertDialogDescription>"{deleteConfirm?.settings.subject_line}" verrà cancellata da Mailchimp.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}