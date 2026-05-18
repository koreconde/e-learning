import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Download, LogOut, RefreshCw } from "lucide-react";

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
};

export default function AdminLeads() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">("all");

  useEffect(() => {
    document.title = "Admin · Lead";
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate("/admin/auth", { replace: true });
        return;
      }
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
      .select("id,name,email,phone,level,score,total,completed,utm_source,utm_campaign,created_at,completed_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      toast.error(error.message);
      return;
    }
    setLeads(data as Lead[]);
  };

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filter === "completed" && !l.completed) return false;
      if (filter === "incomplete" && l.completed) return false;
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        l.name?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.phone?.toLowerCase().includes(s)
      );
    });
  }, [leads, q, filter]);

  const exportCSV = () => {
    const headers = ["Nome", "Email", "Telefono", "Livello", "Score", "Totale", "Completato", "UTM Source", "UTM Campaign", "Creato", "Completato il"];
    const rows = filtered.map((l) => [
      l.name, l.email, l.phone, l.level ?? "", l.score ?? "", l.total ?? "",
      l.completed ? "Sì" : "No", l.utm_source ?? "", l.utm_campaign ?? "",
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
                <TableHead>Sorgente</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                    <TableCell>{l.phone}</TableCell>
                    <TableCell>
                      {l.level ? <Badge>{l.level}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {l.score != null ? `${l.score}/${l.total ?? "?"}` : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {l.utm_source ?? "diretto"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(l.created_at).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </main>
  );
}