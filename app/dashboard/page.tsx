"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Streamer = {
  id: string;
  username_tiktok: string;
  email: string;
  created_at: string;
};

type ChartPoint = {
  month: string;
  current: number;
  previous: number;
};

const chartData: ChartPoint[] = [
  { month: "Mai", current: 42, previous: 35 },
  { month: "Jun", current: 58, previous: 46 },
  { month: "Jul", current: 51, previous: 49 },
  { month: "Ago", current: 67, previous: 54 },
  { month: "Set", current: 74, previous: 61 },
  { month: "Out", current: 86, previous: 69 },
];

const ranking = [
  { position: 1, name: "Você", value: 86 },
  { position: 2, name: "Streamer Alpha", value: 78 },
  { position: 3, name: "Streamer Blue", value: 71 },
  { position: 4, name: "Streamer Max", value: 64 },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function StatIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
      {children}
    </div>
  );
}

function Trend({
  value,
  positive = true,
}: {
  value: string;
  positive?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
        positive
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {positive ? "↗" : "↘"} {value}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("Este mês");

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      try {
        console.log("DASHBOARD: iniciando carregamento...");

        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();

        console.log("DASHBOARD: sessão:", session);
        console.log("DASHBOARD: erro auth:", authError);

        if (!ativo) return;

        if (authError) {
          console.error("Erro de autenticação:", authError);
          setError("Erro ao verificar sua sessão.");
          setLoading(false);
          return;
        }

        if (!session?.user) {
          console.log("DASHBOARD: usuário não autenticado.");
          router.replace("/login");
          return;
        }

        const user = session.user;

        console.log("DASHBOARD: usuário encontrado:", user.id);

        const { data, error: profileError } = await supabase
          .from("streamers")
          .select("id, username_tiktok, email, created_at")
          .eq("id", user.id)
          .maybeSingle();

        console.log("DASHBOARD: perfil:", data);
        console.log("DASHBOARD: erro perfil:", profileError);

        if (!ativo) return;

        if (profileError) {
          console.error("Erro ao buscar streamer:", profileError);
          setError("Não foi possível carregar seu perfil.");
          setLoading(false);
          return;
        }

        if (!data) {
          setError("Seu perfil de streamer não foi encontrado.");
          setLoading(false);
          return;
        }

        setStreamer(data);
        setLoading(false);
      } catch (err) {
        console.error("DASHBOARD: erro inesperado:", err);

        if (!ativo) return;

        setError("Ocorreu um erro ao carregar o painel.");
        setLoading(false);
      }
    }

    carregarPerfil();

    return () => {
      ativo = false;
    };
  }, [router]);

  async function sair() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
          <p className="text-sm text-slate-400">
            Carregando seu painel...
          </p>
        </div>
      </main>
    );
  }

  if (error || !streamer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b132b] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
            ⚠️
          </div>

          <h1 className="text-2xl font-bold">
            Perfil não encontrado
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {error || "Não foi possível encontrar seus dados."}
          </p>

          <button
            onClick={() => router.replace("/login")}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Voltar para o login
          </button>
        </div>
      </main>
    );
  }

  const currentMonth = 86;
  const previousMonth = 69;
  const growth = Math.round(
    ((currentMonth - previousMonth) / previousMonth) * 100
  );

  const goal = 100;
  const goalProgress = Math.min(
    Math.round((currentMonth / goal) * 100),
    100
  );

  const maxChartValue = Math.max(
    ...chartData.flatMap((item) => [item.current, item.previous])
  );

  return (
    <main className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30">
      {/* FUNDO */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-180px] top-[-180px] h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-220px] right-[-180px] h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-[130px]" />
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-10">

          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25">
              <span className="text-xl">⚡</span>
            </div>

            <div>
              <h1 className="text-base font-bold tracking-tight sm:text-lg">
                Trovão Azul
              </h1>

              <p className="text-[11px] font-medium text-blue-400 sm:text-xs">
                Agência TikTok LIVE
              </p>
            </div>
          </div>

          {/* DIREITA */}
          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">
                @{streamer.username_tiktok}
              </p>

              <p className="text-xs text-slate-500">
                Área do criador
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 font-bold text-blue-300">
              {streamer.username_tiktok
                .charAt(0)
                .toUpperCase()}
            </div>

            <button
              onClick={sair}
              className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 sm:block"
            >
              Sair
            </button>

          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <section className="relative z-10 mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">

        {/* CABEÇALHO */}
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
              Área do Criador
            </p>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Olá, @{streamer.username_tiktok} 👋
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Acompanhe seu desempenho, suas metas e a evolução das
              suas lives em um só lugar.
            </p>
          </div>

          {/* PERÍODO */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {["Este mês", "Últimos 30 dias", "Últimos 90 dias"].map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setPeriod(item)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    period === item
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>

        {/* STATUS */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] px-4 py-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>

          <p className="text-sm text-slate-300">
            Sua conta está <strong className="text-emerald-400">ativa</strong>
            {" "}e conectada à Trovão Azul.
          </p>

          <span className="ml-auto hidden text-xs text-slate-500 sm:block">
            Dados atualizados agora
          </span>
        </div>

        {/* CARDS PRINCIPAIS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* DESEMPENHO */}
          <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-white/[0.05]">
            <div className="flex items-start justify-between">
              <StatIcon>📊</StatIcon>
              <Trend value="+24,6%" />
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Desempenho
            </p>

            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-bold">
                {currentMonth}
              </span>

              <span className="mb-1 text-sm text-slate-500">
                pontos
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              +17 pontos desde o mês anterior
            </p>
          </div>

          {/* HORAS */}
          <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-white/[0.05]">
            <div className="flex items-start justify-between">
              <StatIcon>⏱️</StatIcon>
              <Trend value="+12,4%" />
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Horas ao vivo
            </p>

            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-bold">
                42h
              </span>

              <span className="mb-1 text-sm text-slate-500">
                este mês
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Média de 1h24 por live
            </p>
          </div>

          {/* GANHOS */}
          <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-white/[0.05]">
            <div className="flex items-start justify-between">
              <StatIcon>💰</StatIcon>
              <Trend value="+18,2%" />
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Ganhos estimados
            </p>

            <div className="mt-1">
              <span className="text-3xl font-bold">
                {formatCurrency(1280)}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Comparado a {formatCurrency(1081)} no mês anterior
            </p>
          </div>

          {/* LIVES */}
          <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-white/[0.05]">
            <div className="flex items-start justify-between">
              <StatIcon>🎥</StatIcon>
              <Trend value="+5 lives" />
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Lives realizadas
            </p>

            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-bold">
                31
              </span>

              <span className="mb-1 text-sm text-slate-500">
                lives
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              26 no mês anterior
            </p>
          </div>

        </div>

        {/* GRÁFICO + META */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">

          {/* GRÁFICO */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">
                    Evolução do desempenho
                  </h3>

                  <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-400">
                    AO VIVO
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Comparação entre seu desempenho atual e o período anterior.
                </p>
              </div>

              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Este período
                </span>

                <span className="flex items-center gap-2 text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                  Anterior
                </span>
              </div>

            </div>

            {/* ÁREA DO GRÁFICO */}
            <div className="mt-8">

              <div className="flex h-[260px] gap-3">

                {/* EIXO */}
                <div className="flex flex-col justify-between pb-7 text-[10px] text-slate-600">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>

                {/* GRÁFICO */}
                <div className="relative flex-1">

                  {/* GRID */}
                  <div className="absolute inset-0 flex flex-col justify-between pb-7">
                    {[0, 1, 2, 3, 4].map((line) => (
                      <div
                        key={line}
                        className="border-t border-white/[0.05]"
                      />
                    ))}
                  </div>

                  {/* BARRAS */}
                  <div className="absolute inset-x-0 bottom-7 top-0 flex items-end justify-between gap-2 sm:gap-4">

                    {chartData.map((item) => (
                      <div
                        key={item.month}
                        className="flex h-full flex-1 items-end justify-center gap-1 sm:gap-2"
                      >

                        {/* ANTERIOR */}
                        <div
                          className="w-2 rounded-t-md bg-slate-700/80 transition-all duration-500 sm:w-3"
                          style={{
                            height: `${(item.previous / maxChartValue) * 88}%`,
                          }}
                          title={`Período anterior: ${item.previous}`}
                        />

                        {/* ATUAL */}
                        <div
                          className="w-2 rounded-t-md bg-blue-500 shadow-lg shadow-blue-500/20 transition-all duration-500 hover:bg-blue-400 sm:w-3"
                          style={{
                            height: `${(item.current / maxChartValue) * 88}%`,
                          }}
                          title={`Este período: ${item.current}`}
                        />

                      </div>
                    ))}

                  </div>

                  {/* MESES */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between gap-2">
                    {chartData.map((item) => (
                      <span
                        key={item.month}
                        className="flex-1 text-center text-[10px] text-slate-600"
                      >
                        {item.month}
                      </span>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* META */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">

            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Meta mensal
                </p>

                <h3 className="mt-2 text-xl font-bold">
                  Seu objetivo
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                🎯
              </div>
            </div>

            <div className="mt-8 flex items-end justify-between">
              <div>
                <span className="text-4xl font-bold">
                  {currentMonth}
                </span>

                <span className="ml-2 text-sm text-slate-500">
                  / {goal} pontos
                </span>
              </div>

              <span className="text-sm font-bold text-blue-400">
                {goalProgress}%
              </span>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400 transition-all duration-1000"
                style={{ width: `${goalProgress}%` }}
              />
            </div>

            <div className="mt-5 flex justify-between text-xs">
              <span className="text-slate-500">
                Atual
              </span>

              <span className="font-medium text-slate-300">
                Faltam {goal - currentMonth} pontos
              </span>
            </div>

            <div className="mt-7 rounded-xl border border-blue-500/10 bg-blue-500/[0.04] p-4">
              <p className="text-sm font-semibold text-blue-300">
                🚀 Você está no caminho certo!
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Mantendo esse ritmo, sua meta pode ser alcançada antes do
                final do período.
              </p>
            </div>

          </div>
        </div>

        {/* COMPARAÇÃO DO MÊS */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Análise de desempenho
              </p>

              <h3 className="mt-2 text-xl font-bold">
                Este mês x mês anterior
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Veja rapidamente onde você evoluiu.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-xs text-emerald-400">
                Crescimento geral
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-300">
                +{growth}%
              </p>
            </div>

          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* COMPARAÇÃO 1 */}
            <div className="rounded-xl border border-white/5 bg-black/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Desempenho
                </span>

                <span className="text-lg">📊</span>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    86
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    anterior: 69
                  </p>
                </div>

                <Trend value="+24,6%" />
              </div>
            </div>

            {/* COMPARAÇÃO 2 */}
            <div className="rounded-xl border border-white/5 bg-black/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Horas ao vivo
                </span>

                <span className="text-lg">⏱️</span>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    42h
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    anterior: 37h
                  </p>
                </div>

                <Trend value="+13,5%" />
              </div>
            </div>

            {/* COMPARAÇÃO 3 */}
            <div className="rounded-xl border border-white/5 bg-black/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Lives
                </span>

                <span className="text-lg">🎥</span>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    31
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    anterior: 26
                  </p>
                </div>

                <Trend value="+19,2%" />
              </div>
            </div>

            {/* COMPARAÇÃO 4 */}
            <div className="rounded-xl border border-white/5 bg-black/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Ganhos
                </span>

                <span className="text-lg">💰</span>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    R$ 1.280
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    anterior: R$ 1.081
                  </p>
                </div>

                <Trend value="+18,2%" />
              </div>
            </div>

          </div>
        </div>

        {/* RANKING + RESUMO */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* RANKING */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Performance
                </p>

                <h3 className="mt-2 text-xl font-bold">
                  Ranking da agência
                </h3>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-500/10 text-xl">
                🏆
              </div>
            </div>

            <div className="mt-6 space-y-3">

              {ranking.map((item) => (
                <div
                  key={item.position}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    item.name === "Você"
                      ? "border-blue-500/20 bg-blue-500/[0.06]"
                      : "border-white/5 bg-black/10"
                  }`}
                >

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      item.position === 1
                        ? "bg-yellow-500/10 text-yellow-400"
                        : item.position === 2
                        ? "bg-slate-400/10 text-slate-300"
                        : item.position === 3
                        ? "bg-orange-500/10 text-orange-400"
                        : "bg-white/5 text-slate-500"
                    }`}
                  >
                    {item.position}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold">
                        {item.name}
                      </p>

                      <span className="text-sm font-bold">
                        {item.value}
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${
                          item.name === "Você"
                            ? "bg-blue-500"
                            : "bg-slate-600"
                        }`}
                        style={{
                          width: `${item.value}%`,
                        }}
                      />
                    </div>
                  </div>

                </div>
              ))}

            </div>

          </div>

          {/* RESUMO */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Resumo
              </p>

              <h3 className="mt-2 text-xl font-bold">
                Seu mês em números
              </h3>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">

              <div className="rounded-xl border border-white/5 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Média por live
                </p>

                <p className="mt-2 text-xl font-bold">
                  1h24
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Melhor desempenho
                </p>

                <p className="mt-2 text-xl font-bold">
                  96
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Crescimento
                </p>

                <p className="mt-2 text-xl font-bold text-emerald-400">
                  +24,6%
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/10 p-4">
                <p className="text-xs text-slate-500">
                  Posição
                </p>

                <p className="mt-2 text-xl font-bold">
                  #1
                </p>
              </div>

            </div>

            <div className="mt-4 rounded-xl border border-blue-500/10 bg-blue-500/[0.04] p-4">
              <div className="flex gap-3">
                <span className="text-xl">
                  💡
                </span>

                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Destaque do período
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Seu desempenho está acima do mês anterior. Continue
                    mantendo a frequência das suas lives para alcançar a
                    próxima meta.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* INFORMAÇÕES DA CONTA */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Minha conta
              </p>

              <h3 className="mt-2 text-xl font-bold">
                Informações do perfil
              </h3>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">
                Conta ativa
              </span>
            </div>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-xl border border-white/5 bg-black/10 p-4">
              <p className="text-xs text-slate-500">
                Usuário TikTok
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-slate-200">
                @{streamer.username_tiktok}
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/10 p-4">
              <p className="text-xs text-slate-500">
                E-mail
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-slate-200">
                {streamer.email}
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/10 p-4">
              <p className="text-xs text-slate-500">
                Membro desde
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-200">
                {new Date(streamer.created_at).toLocaleDateString(
                  "pt-BR"
                )}
              </p>
            </div>

          </div>
        </div>

        {/* RODAPÉ */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-slate-600 sm:flex-row">
          <p>
            © 2026 Trovão Azul • Agência TikTok LIVE
          </p>

          <p>
            Painel do Criador
          </p>
        </div>

      </section>
    </main>
  );
}