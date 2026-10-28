"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

type Streamer = {
  id: string;
  username_tiktok: string;
  email: string;
  created_at: string;
};

type Resultado = {
  id: number | string;
  streamer_id: string;
  criador_id: string;
  nome_criador?: string | null;
  diamantes?: number | string | null;
  duracao_live?: number | string | null;
  dias_validos_live?: number | string | null;
  novos_seguidores?: number | string | null;
  transmissoes?: number | string | null;
  batalhas?: number | string | null;
  diamantes_batalhas?: number | string | null;
  diamantes_convidados?: number | string | null;
  status?: string | null;
  dados_completos?: Record<string, unknown> | null;
  data_importacao?: string | null;
  created_at?: string | null;
};

type Estado = "loading" | "ready" | "not_in_agency" | "no_results" | "profile_missing" | "error";

function normalizarUsername(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

function numero(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  let raw = String(value).trim().replace(/[^\d,.-]/g, "");
  if (!raw) return 0;

  const comma = raw.lastIndexOf(",");
  const dot = raw.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    // Formato brasileiro, por exemplo 1.234,56.
    raw = comma > dot ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  } else if (comma >= 0) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatarNumero(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}

function obterCampo(dados: Record<string, unknown> | null | undefined, aliases: string[]): string {
  if (!dados) return "";
  const normalizarChave = (key: string) => key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const wanted = new Set(aliases.map(normalizarChave));
  for (const [key, value] of Object.entries(dados)) {
    if (wanted.has(normalizarChave(key)) && value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "";
}

function dataCurta(value?: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("pt-BR");
}

function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-blue-500/30 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-400">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-xl">{icon}</span>
      </div>
      <p className="mt-4 break-words text-2xl font-bold sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [estado, setEstado] = useState<Estado>("loading");
  const [erro, setErro] = useState("");
  const [recarregando, setRecarregando] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarPainel() {
      setEstado("loading");
      setErro("");

      try {
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;

        const user = authData.session?.user;
        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: perfil, error: perfilError } = await supabase
          .from("streamers")
          .select("id, username_tiktok, email, created_at")
          .eq("id", user.id)
          .maybeSingle();

        if (perfilError) throw perfilError;
        if (!perfil || !perfil.username_tiktok) {
          if (ativo) setEstado("profile_missing");
          return;
        }

        if (!ativo) return;
        setStreamer(perfil as Streamer);

        // Confirma que o @ do perfil corresponde a alguém no relatório oficial da agência.
        const { data: fazParte, error: rosterError } = await supabase.rpc(
          "verificar_criador_na_agencia",
          { p_username: perfil.username_tiktok }
        );

        if (rosterError) throw rosterError;
        if (!fazParte) {
          if (ativo) {
            setResultados([]);
            setEstado("not_in_agency");
          }
          return;
        }

        // A função do banco retorna somente os resultados associados ao @ da sessão atual.
        const { data: rows, error: resultadosError } = await supabase.rpc("meus_resultados_do_criador");
        if (resultadosError) throw resultadosError;

        const lista = (rows || []) as Resultado[];
        if (!ativo) return;
        setResultados(lista);
        setEstado(lista.length ? "ready" : "no_results");
      } catch (err) {
        console.error("Erro ao carregar painel do criador:", err);
        if (ativo) {
          setErro(err instanceof Error ? err.message : "Não foi possível validar seu cadastro e carregar seus dados.");
          setEstado("error");
        }
      }
    }

    void carregarPainel();
    return () => { ativo = false; };
  }, [router]);

  async function recarregar() {
    setRecarregando(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      if (!authData.session?.user) {
        router.replace("/login");
        return;
      }
      const { data: perfil, error: perfilError } = await supabase
        .from("streamers")
        .select("id, username_tiktok, email, created_at")
        .eq("id", authData.session.user.id)
        .maybeSingle();
      if (perfilError) throw perfilError;
      if (!perfil?.username_tiktok) {
        setEstado("profile_missing");
        return;
      }
      setStreamer(perfil as Streamer);
      const { data: fazParte, error: rosterError } = await supabase.rpc(
        "verificar_criador_na_agencia",
        { p_username: perfil.username_tiktok }
      );
      if (rosterError) throw rosterError;
      if (!fazParte) {
        setResultados([]);
        setEstado("not_in_agency");
        return;
      }
      const { data, error } = await supabase.rpc("meus_resultados_do_criador");
      if (error) throw error;
      const lista = (data || []) as Resultado[];
      setResultados(lista);
      setEstado(lista.length ? "ready" : "no_results");
      setErro("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao atualizar os dados.");
      setEstado("error");
    } finally {
      setRecarregando(false);
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const totais = useMemo(() => resultados.reduce((acc, row) => {
    acc.diamantes += numero(row.diamantes);
    acc.seguidores += numero(row.novos_seguidores);
    acc.transmissoes += numero(row.transmissoes);
    acc.batalhas += numero(row.batalhas);
    acc.duracao += numero(row.duracao_live);
    acc.dias += numero(row.dias_validos_live);
    return acc;
  }, { diamantes: 0, seguidores: 0, transmissoes: 0, batalhas: 0, duracao: 0, dias: 0 }), [resultados]);

  const resultadosOrdenados = useMemo(() => [...resultados].sort((a, b) => {
    const ad = new Date(a.data_importacao || a.created_at || 0).getTime();
    const bd = new Date(b.data_importacao || b.created_at || 0).getTime();
    return bd - ad;
  }), [resultados]);

  if (estado === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
          <p className="text-sm text-slate-400">Validando seu @ e carregando seus dados...</p>
        </div>
      </main>
    );
  }

  if (estado === "profile_missing" || estado === "not_in_agency" || estado === "no_results" || estado === "error") {
    const profileMissing = estado === "profile_missing";
    const notInAgency = estado === "not_in_agency";
    const noResults = estado === "no_results";
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-5 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0b132b] p-8 text-center shadow-2xl sm:p-10">
          <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${estado === "error" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
            {estado === "error" ? "⚠️" : "🔎"}
          </div>
          <h1 className="text-2xl font-bold">
            {profileMissing ? "Cadastro não vinculado" : notInAgency ? "@ não localizado na agência" : noResults ? "Ainda sem relatório vinculado" : "Não foi possível validar o cadastro"}
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            {profileMissing
              ? "Não encontramos um perfil de criador associado à sua conta. Entre em contato com a agência para validar seu cadastro."
              : notInAgency
                ? `O @${streamer?.username_tiktok || "informado"} não foi encontrado no relatório oficial da Trovão Azul. Entre em contato com a agência para confirmar seu @ e vincular seus dados. Por segurança, nenhum dado de outra pessoa será mostrado.`
                : noResults
                  ? `O @${streamer?.username_tiktok || "informado"} foi encontrado no cadastro da agência, mas ainda não há resultados disponíveis para ele. Entre em contato com a agência para conferir o vínculo dos dados.`
                  : "Não conseguimos validar seu vínculo com a agência neste momento. Entre em contato com a equipe da Trovão Azul. Nenhum dado de outro criador será exibido."}
          </p>
          {estado === "error" && erro && <p className="mt-3 break-words text-xs text-red-300">Detalhe técnico: {erro}</p>}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={() => void recarregar()} disabled={recarregando} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60">
              {recarregando ? "Verificando..." : "Tentar novamente"}
            </button>
            <button onClick={sair} className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5">
              Sair da conta
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-220px] right-[-180px] h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-[130px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/85 backdrop-blur-xl">
        <div className="relative mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25">
              <Logo size={28} />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight sm:text-lg">Trovão Azul</h1>
              <p className="text-[11px] font-medium text-blue-400 sm:text-xs">Agência TikTok LIVE</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">@{streamer?.username_tiktok}</p>
              <p className="text-xs text-slate-500">Área do criador</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 font-bold text-blue-300">
              {streamer?.username_tiktok?.charAt(0).toUpperCase() || "T"}
            </div>
            <button onClick={sair} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300">Sair</button>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Área do Criador</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Olá, @{streamer?.username_tiktok} 👋</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Estes dados são vinculados ao @ cadastrado para sua conta e conferidos contra a lista da agência.</p>
          </div>
          <button onClick={() => void recarregar()} disabled={recarregando} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.07] disabled:opacity-60">
            {recarregando ? "Atualizando..." : "↻ Atualizar dados"}
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <p className="text-sm text-slate-300">Cadastro validado para <strong className="text-emerald-400">@{streamer?.username_tiktok}</strong>.</p>
          <span className="ml-auto hidden text-xs text-slate-500 sm:block">{resultados.length} registro(s) vinculado(s)</span>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Diamantes no relatório" value={formatarNumero(totais.diamantes)} detail="Soma dos registros vinculados ao seu @" icon="💎" />
          <StatCard label="Novos seguidores" value={formatarNumero(totais.seguidores)} detail="Conforme o relatório da agência" icon="👥" />
          <StatCard label="Transmissões" value={formatarNumero(totais.transmissoes)} detail="Lives contabilizadas no relatório" icon="🎥" />
          <StatCard label="Batalhas" value={formatarNumero(totais.batalhas)} detail="Batalhas registradas no relatório" icon="⚔️" />
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Duração registrada" value={formatarNumero(totais.duracao)} detail="Valor original do campo de duração; unidade conforme o relatório" icon="⏱️" />
          <StatCard label="Dias válidos de live" value={formatarNumero(totais.dias)} detail="Dias válidos registrados no relatório" icon="📅" />
          <StatCard label="Registros associados" value={formatarNumero(resultados.length)} detail="Linhas de relatório encontradas para o seu @" icon="📊" />
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
          <div className="border-b border-white/10 px-5 py-5 sm:px-6">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Dados vinculados</p>
            <h3 className="mt-2 text-xl font-bold">Seus registros do relatório</h3>
            <p className="mt-1 text-sm text-slate-400">A tabela abaixo inclui somente os registros cujo @ corresponde ao seu perfil.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4">Criador / @</th>
                  <th className="px-5 py-4">Diamantes</th>
                  <th className="px-5 py-4">Seguidores</th>
                  <th className="px-5 py-4">Transmissões</th>
                  <th className="px-5 py-4">Batalhas</th>
                  <th className="px-5 py-4">Importado em</th>
                </tr>
              </thead>
              <tbody>
                {resultadosOrdenados.map((row) => {
                  const username = obterCampo(row.dados_completos, ["username_tiktok", "tiktok_username", "creator_username", "username", "user_name", "nickname", "@username"]);
                  const nome = row.nome_criador || username || row.criador_id;
                  return (
                    <tr key={`${row.streamer_id}-${row.criador_id}-${row.id}`} className="border-b border-white/5 transition hover:bg-white/[0.025]">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold">{nome}</p>
                        {username && <p className="mt-1 text-xs text-slate-500">@{normalizarUsername(username)}</p>}
                      </td>
                      <td className="px-5 py-4 font-bold text-blue-300">{formatarNumero(numero(row.diamantes))}</td>
                      <td className="px-5 py-4 text-sm text-slate-300">{formatarNumero(numero(row.novos_seguidores))}</td>
                      <td className="px-5 py-4 text-sm text-slate-300">{formatarNumero(numero(row.transmissoes))}</td>
                      <td className="px-5 py-4 text-sm text-slate-300">{formatarNumero(numero(row.batalhas))}</td>
                      <td className="px-5 py-4 text-sm text-slate-400">{dataCurta(row.data_importacao || row.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-white/10 px-5 py-4 text-xs leading-5 text-slate-500 sm:px-6">
            Os valores mostrados vêm do relatório da agência. O painel não usa valores de demonstração nem os dados de outra conta.
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-slate-600 sm:flex-row">
          <p>© 2026 Trovão Azul • Agência TikTok LIVE</p>
          <p>Área do Criador</p>
        </div>
      </section>
    </main>
  );
}
