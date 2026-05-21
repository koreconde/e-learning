import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CalendarPlus, Download, LogOut, RefreshCw, StickyNote, Trash2 } from "lucide-react";

const OUTCOMES = [
  { value: "da_contattare", label: "Da contattare", color: "bg-slate-500" },
  { value: "contattato", label: "Contattato", color: "bg-blue-500" },
  { value: "non_risponde", label: "Non risponde", color: "bg-amber-500" },
  { value: "richiamare", label: "Richiamare", color: "bg-orange-500" },
  { value: "interessato", label: "Interessato", color: "bg-emerald-500" },
  { value: "meeting_fissato", label: "Meeting fissato 📅", color: "bg-violet-500" },
  { value: "non_interessato", label: "Non interessato", color: "bg-rose-500" },
  { value: "iscritto", label: "Iscritto ✓", color: "bg-green-600" },
] as const;
type Outcome = typeof OUTCOMES[number]["value"];
const outcomeLabel = (v: string) => OUTCOMES.find((o) => o.value === v)?.label ?? v;
const outcomeColor = (v: string) => OUTCOMES.find((o) => o.value === v)?.color ?? "bg-slate-500";

const SELLERS = [
  "serena@escapecampus.it",
  "manar@escapecampus.it",
  "antonella@escapecampus.it",
  "cristina@escapecampus.it",
] as const;

const MANAGERS = [
  "francesca@escapecampus.it",
  "raff@escapecampus.it",
  "giada@escapecampus.it",
  "info@englishinfinity.io",
] as const;

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: string | null;
  score: number | null;
  total: number | null;
  completed: boolean;
  utm_source: string | null;
  utm_campaign: string | null;
  created_at: string;
  completed_at: string | null;
  call_status: Outcome;
  call_notes: string | null;
  call_updated_at: string | null;
  assigned_to: string | null;
};

export default function AdminLeads() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [statusFilter, setStatusFilter] = useState<Outcome | "all">("all");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [scheduling, setScheduling] = useState<Lead | null>(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("10:00");
  const [meetingDuration, setMeetingDuration] = useState(30);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingCalendar, setMeetingCalendar] = useState<"raffaele" | "francesca">("raffaele");
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Admin · Lead";
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate("/admin/auth", { replace: true });
        return;
      }
      setUserEmail((sess.session.user.email ?? "").toLowerCase());
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.session.user.id);
      const admin = roles?.some((r) => r.role === "admin") ?? false;
      setIsAdmin(admin);
      if (admin) await loadLeads();
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/admin/auth", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const loadLeads = async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("id,name,email,phone,level,score,total,completed,utm_source,utm_campaign,created_at,completed_at,call_status,call_notes,call_updated_at,assigned_to")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLeads(data as Lead[]);
  };

  const filtered = useMemo(() => {
    const isManager = (MANAGERS as readonly string[]).includes(userEmail);
    return leads.filter((l) => {
      if (!isManager) {
        if ((l.assigned_to ?? "").toLowerCase() !== userEmail) return false;
      }
      if (filter === "completed" && !l.completed) return false;
      if (filter === "incomplete" && l.completed) return false;
      if (statusFilter !== "all" && l.call_status !== statusFilter) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        l.name?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.phone?.toLowerCase().includes(s)
      );
    });
  }, [leads, q, filter, statusFilter, userEmail]);

  const isManager = (MANAGERS as readonly string[]).includes(userEmail);

  const assignLead = async (id: string, assigned_to: string | null) => {
    const { error } = await supabase
      .from("leads")
      .update({ assigned_to })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, assigned_to } : l)));
    toast.success(assigned_to ? `Assegnato a ${assigned_to.split("@")[0]}` : "Assegnazione rimossa");
  };

  const updateOutcome = async (id: string, call_status: Outcome, call_notes?: string | null) => {
    const patch: any = { call_status, call_updated_at: new Date().toISOString() };
    if (call_notes !== undefined) patch.call_notes = call_notes;
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    toast.success("Esito aggiornato");
  };

  const saveNotes = async () => {
    if (!editing) return;
    await updateOutcome(editing.id, editing.call_status, editNotes);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("leads").delete().eq("id", deleting.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== deleting.id));
    toast.success("Lead eliminato");
    setDeleting(null);
  };

  const openScheduler = (l: Lead) => {
    setScheduling(l);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMeetingDate(tomorrow.toISOString().slice(0, 10));
    setMeetingTime("10:00");
    setMeetingDuration(30);
    setMeetingTitle(`Call EnglishInfinity · ${l.name}`);
    setMeetingNotes("");
    setMeetingCalendar("raffaele");
  };

  const submitMeeting = async () => {
    if (!scheduling) return;
    if (!meetingDate || !meetingTime) {
      toast.error("Seleziona data e orario");
      return;
    }
    setScheduleSubmitting(true);
    const startISO = new Date(`${meetingDate}T${meetingTime}:00`).toISOString();
    const { data, error } = await supabase.functions.invoke("schedule-meeting", {
      body: {
        leadId: scheduling.id,
        startISO,
        durationMinutes: meetingDuration,
        title: meetingTitle,
        description: meetingNotes,
        calendar: meetingCalendar,
      },
    });
    setScheduleSubmitting(false);
    if (error || !data?.success) {
      toast.error((data?.error as string) || error?.message || "Errore nella creazione del meeting");
      return;
    }
    toast.success("Meeting creato. Invito inviato al lead.");
    // Update local UI: lead status becomes "meeting fissato"
    setLeads((prev) =>
      prev.map((l) =>
        l.id === scheduling.id
          ? { ...l, call_status: "meeting_fissato" as Outcome, call_updated_at: new Date().toISOString() }
          : l,
      ),
    );
    setScheduling(null);
  };

  const exportCSV = () => {
    const headers = ["Nome", "Email", "Telefono", "Livello", "Score", "Totale", "Completato", "Esito", "Note", "UTM Source", "UTM Campaign", "Creato", "Completato il"];
    const rows = filtered.map((l) => [
      l.name, l.email, l.phone, l.level ?? "", l.score ?? "", l.total ?? "",
      l.completed ? "Sì" : "No", outcomeLabel(l.call_status), l.call_notes ?? "",
      l.utm_source ?? "", l.utm_campaign ?? "",
      new Date(l.created_at).toLocaleString("it-IT"),
      l.completed_at ? new Date(l.completed_at).toLocaleString("it-IT") : "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/auth", { replace: true });
  };

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center">Caricamento...</main>;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center">
          <h1 className="text-xl font-bold mb-2">Accesso negato</h1>
          <p className="text-muted-foreground mb-4">
            Il tuo account non ha i permessi di amministratore. Contatta il team per essere aggiunto alla lista.
          </p>
          <Button onClick={logout} variant="outline">Esci</Button>
        </Card>
      </main>
    );
  }

  const completedCount = leads.filter((l) => l.completed).length;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold">Lead</h1>
            <p className="text-sm text-muted-foreground">
              {leads.length} totali · {completedCount} test completati
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadLeads}>
              <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" /> Esci
            </Button>
          </div>
        </div>

        <Card className="p-4 mb-4 flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Cerca nome, email, telefono..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-1">
            {(["all", "completed", "incomplete"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "Tutti" : f === "completed" ? "Completati" : "Incompleti"}
              </Button>
            ))}
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtra per esito" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli esiti</SelectItem>
              {OUTCOMES.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Livello</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Esito</TableHead>
                <TableHead>Assegnato a</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Data</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    Nessun lead trovato
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>
                      <a href={`mailto:${l.email}`} className="text-primary hover:underline">{l.email}</a>
                    </TableCell>
                    <TableCell>
                      <a href={`tel:${l.phone}`} className="text-primary hover:underline">{l.phone}</a>
                    </TableCell>
                    <TableCell>
                      {l.level ? <Badge>{l.level}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {l.score != null ? `${l.score}/${l.total ?? "?"}` : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Select value={l.call_status} onValueChange={(v) => updateOutcome(l.id, v as Outcome)}>
                        <SelectTrigger className="w-[170px] h-8">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${outcomeColor(l.call_status)}`} />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OUTCOMES.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {isManager ? (
                        <Select
                          value={l.assigned_to ?? "__none__"}
                          onValueChange={(v) => assignLead(l.id, v === "__none__" ? null : v)}
                        >
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue placeholder="Non assegnato" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Non assegnato</SelectItem>
                            {SELLERS.map((s) => (
                              <SelectItem key={s} value={s}>{s.split("@")[0]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">{l.assigned_to ? l.assigned_to.split("@")[0] : <span className="text-muted-foreground">—</span>}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(l);
                          setEditNotes(l.call_notes ?? "");
                        }}
                        className="gap-1"
                      >
                        <StickyNote className="h-4 w-4" />
                        {l.call_notes ? <span className="text-xs max-w-[120px] truncate">{l.call_notes}</span> : <span className="text-xs text-muted-foreground">aggiungi</span>}
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(l.created_at).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => openScheduler(l)}
                        aria-label="Fissa meeting"
                        title="Fissa meeting Google Calendar"
                      >
                        <CalendarPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleting(l)}
                        aria-label="Elimina lead"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Note · {editing?.name}</DialogTitle>
            </DialogHeader>
            <Textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Es. Ha richiamato lunedì, interessato al corso B2..."
              rows={6}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Annulla</Button>
              <Button onClick={saveNotes}>Salva</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare questo lead?</AlertDialogTitle>
              <AlertDialogDescription>
                Stai per eliminare definitivamente <strong>{deleting?.name}</strong> ({deleting?.email}). L'azione non è reversibile.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!scheduling} onOpenChange={(o) => !o && setScheduling(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Fissa meeting · {scheduling?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Titolo</label>
                <Input value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Orario</label>
                  <Input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Durata</label>
                <Select value={String(meetingDuration)} onValueChange={(v) => setMeetingDuration(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[15, 30, 45, 60, 90].map((m) => (
                      <SelectItem key={m} value={String(m)}>{m} minuti</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Calendario</label>
                <Select value={meetingCalendar} onValueChange={(v) => setMeetingCalendar(v as "raffaele" | "francesca")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raffaele">Raffaele</SelectItem>
                    <SelectItem value="francesca">Francesca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Note / agenda (opzionale)</label>
                <Textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Argomenti, link, contesto…"
                  rows={3}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Verrà creato un evento Google Calendar con link Meet e l'invito sarà inviato automaticamente a <strong>{scheduling?.email}</strong>.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setScheduling(null)} disabled={scheduleSubmitting}>Annulla</Button>
              <Button onClick={submitMeeting} disabled={scheduleSubmitting}>
                {scheduleSubmitting ? "Creazione…" : "Crea meeting"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}