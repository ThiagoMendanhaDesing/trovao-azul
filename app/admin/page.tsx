"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

type Streamer = {
  id: string;
  username_tiktok: string;
  email: string;
  created_at: string;
};

type Resultado = {
  id?: number;
  streamer_id: string;
  criador_id: string;
  nome_criador?: string | null;
  grupo?: string | null;
  agente?: string | null;
  diamantes?: number | null;
  duracao_live?: number | null;
  dias_validos_live?: number | null;
  novos_seguidores?: number | null;
  transmissoes?: number | null;
  batalhas?: number | null;
  diamantes_batalhas?: number | null;
  diamantes_convidados?: number | null;
  status_graduacao?: string | null;
  status_nivel?: string | null;
  status_fa_clube?: string | null;
  status?: string | null;
  dados_completos?: any;
  data_importacao?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ImportResultado = {
  streamer_id: string;
  criador_id: string;
  nome_criador: string | null;
  grupo: string | null;
  agente: string | null;
  diamantes: number | null;
  duracao_live: number | null;
  dias_validos_live: number | null;
  novos_seguidores: number | null;
  transmissoes: number | null;
  batalhas: number | null;
  diamantes_batalhas: number | null;
  diamantes_convidados: number | null;
  status_graduacao: string | null;
  status_nivel: string | null;
  status_fa_clube: string | null;
  status: string | null;
  dados_completos: any;
  data_importacao: string;
};

export default function AdminPage() {
  const router = useRouter();

  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingResultados, setLoadingResultados] = useState(false);
  const [verificando, setVerificando] = useState(true);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [resultadoSelecionado, setResultadoSelecionado] =
    useState<Resultado | null>(null);

  const [streamerSelecionado, setStreamerSelecionado] =
    useState<string>("");

  /*
   * ============================================================
   * VERIFICAÇÃO DO ADMIN
   * ============================================================
   */

  useEffect(() => {
    async function verificarAdmin() {
      setVerificando(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        console.error("Erro ao verificar administrador:", adminError);
        router.replace("/dashboard");
        return;
      }

      if (!admin) {
        router.replace("/dashboard");
        return;
      }

      setVerificando(false);

      await carregarTudo();
    }

    verificarAdmin();
  }, [router]);

  /*
   * ============================================================
   * CARREGAR DADOS
   * ============================================================
   */

  async function carregarTudo() {
    setLoading(true);

    try {
      await Promise.all([
        carregarStreamers(),
        carregarResultados(),
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function carregarStreamers() {
    const { data, error } = await supabase
      .from("streamers")
      .select("id, username_tiktok, email, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar streamers:", error);
      return;
    }

    const lista = data || [];

    setStreamers(lista);

    /*
     * Se existir somente um streamer, seleciona automaticamente.
     */
    if (lista.length === 1) {
      setStreamerSelecionado(lista[0].id);
    }
  }

  async function carregarResultados() {
    setLoadingResultados(true);

    const { data, error } = await supabase
      .from("resultados_streamers")
      .select(`
        id,
        streamer_id,
        criador_id,
        nome_criador,
        grupo,
        agente,
        diamantes,
        duracao_live,
        dias_validos_live,
        novos_seguidores,
        transmissoes,
        batalhas,
        diamantes_batalhas,
        diamantes_convidados,
        status_graduacao,
        status_nivel,
        status_fa_clube,
        status,
        dados_completos,
        data_importacao,
        created_at,
        updated_at
      `)
      .order("diamantes", { ascending: false });

    if (error) {
      console.error("Erro ao carregar resultados:", error);
      setErro(`Erro ao carregar resultados: ${error.message}`);
      setLoadingResultados(false);
      return;
    }

    setResultados(data || []);
    setLoadingResultados(false);
  }

  /*
   * ============================================================
   * FUNÇÕES AUXILIARES
   * ============================================================
   */

  function normalizarTexto(valor: any): string {
    if (valor === null || valor === undefined) return "";

    return String(valor)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[\s\-\/().]+/g, "_");
  }

  function numero(valor: any): number | null {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return null;
    }

    if (typeof valor === "number") {
      return Number.isFinite(valor) ? valor : null;
    }

    let texto = String(valor).trim();

    /*
     * Remove símbolos e trata números brasileiros.
     */
    texto = texto.replace(/[^\d,.-]/g, "");

    if (texto.includes(",") && texto.includes(".")) {
      texto = texto.replace(/\./g, "").replace(",", ".");
    } else if (texto.includes(",")) {
      texto = texto.replace(",", ".");
    }

    const n = Number(texto);

    return Number.isFinite(n) ? n : null;
  }

  function encontrarColuna(
    row: Record<string, any>,
    nomes: string[]
  ) {
    const chaves = Object.keys(row);

    for (const nome of nomes) {
      const procurada = normalizarTexto(nome);

      const chaveEncontrada = chaves.find(
        (chave) => normalizarTexto(chave) === procurada
      );

      if (chaveEncontrada) {
        return row[chaveEncontrada];
      }
    }

    return null;
  }

  function encontrarColunaContendo(
    row: Record<string, any>,
    termos: string[]
  ) {
    const chaves = Object.keys(row);

    const chaveEncontrada = chaves.find((chave) => {
      const normalizada = normalizarTexto(chave);

      return termos.some((termo) =>
        normalizada.includes(normalizarTexto(termo))
      );
    });

    if (!chaveEncontrada) return null;

    return row[chaveEncontrada];
  }

  function obterCriadorId(row: Record<string, any>): string {
    const valor =
      encontrarColuna(row, [
        "criador_id",
        "creator_id",
        "creatorid",
        "id_criador",
        "id do criador",
        "id",
        "creator id",
      ]) ??
      encontrarColunaContendo(row, [
        "criador_id",
        "creator_id",
        "creator id",
        "id_criador",
      ]);

    return String(valor ?? "").trim();
  }

  function obterNomeCriador(row: Record<string, any>): string | null {
    const valor =
      encontrarColuna(row, [
        "nome_criador",
        "nome do criador",
        "criador",
        "nome",
        "creator_name",
        "creator name",
        "username",
        "nickname",
      ]);

    if (valor === null || valor === undefined || valor === "") {
      return null;
    }

    return String(valor).trim();
  }

  /*
   * ============================================================
   * IMPORTAÇÃO DO ARQUIVO
   * ============================================================
   */

  async function processarArquivo(file: File) {
    setArquivo(file);
    setMensagem("");
    setErro("");

    if (!streamerSelecionado) {
      setErro(
        "Selecione primeiro o streamer ao qual este relatório pertence."
      );
      return;
    }

    setImportando(true);

    try {
      const extensao = file.name
        .split(".")
        .pop()
        ?.toLowerCase();

      if (
        extensao !== "xlsx" &&
        extensao !== "xls" &&
        extensao !== "csv"
      ) {
        throw new Error(
          "Formato inválido. Escolha um arquivo XLSX, XLS ou CSV."
        );
      }

      const buffer = await file.arrayBuffer();

      let workbook: XLSX.WorkBook;

      if (extensao === "csv") {
        const texto = new TextDecoder("utf-8").decode(buffer);

        workbook = XLSX.read(texto, {
          type: "string",
          raw: true,
        });
      } else {
        workbook = XLSX.read(buffer, {
          type: "array",
          raw: false,
        });
      }

      if (!workbook.SheetNames.length) {
        throw new Error("Não encontrei nenhuma planilha no arquivo.");
      }

      /*
       * Pega a primeira planilha.
       */
      const primeiraPlanilha =
        workbook.Sheets[workbook.SheetNames[0]];

      const linhas = XLSX.utils.sheet_to_json<
        Record<string, any>
      >(primeiraPlanilha, {
        defval: null,
        raw: false,
      });

      if (!linhas.length) {
        throw new Error(
          "A planilha está vazia ou não foi possível ler os dados."
        );
      }

      console.log("Linhas encontradas:", linhas.length);
      console.log("Primeira linha:", linhas[0]);

      /*
       * ========================================================
       * TRANSFORMA CADA LINHA DO EXCEL
       * ========================================================
       */

      const importados: ImportResultado[] = [];

      for (const row of linhas) {
        const criadorId = obterCriadorId(row);

        /*
         * Se não existe ID do criador, ignora a linha.
         */
        if (!criadorId) {
          continue;
        }

        const nomeCriador = obterNomeCriador(row);

        const resultado: ImportResultado = {
          streamer_id: streamerSelecionado,

          criador_id: criadorId,

          nome_criador: nomeCriador,

          grupo:
            encontrarColuna(row, [
              "grupo",
              "group",
            ])?.toString() || null,

          agente:
            encontrarColuna(row, [
              "agente",
              "agent",
            ])?.toString() || null,

          diamantes: numero(
            encontrarColuna(row, [
              "diamantes",
              "diamonds",
              "diamantes ganhos",
              "total de diamantes",
            ])
          ),

          duracao_live: numero(
            encontrarColuna(row, [
              "duracao_live",
              "duracao da live",
              "duração da live",
              "live duration",
              "duracao",
            ])
          ),

          dias_validos_live: numero(
            encontrarColuna(row, [
              "dias_validos_live",
              "dias validos live",
              "dias válidos live",
              "dias validos",
              "dias válidos",
            ])
          ),

          novos_seguidores: numero(
            encontrarColuna(row, [
              "novos_seguidores",
              "novos seguidores",
              "new followers",
              "new_followers",
            ])
          ),

          transmissoes: numero(
            encontrarColuna(row, [
              "transmissoes",
              "transmissões",
              "lives",
              "numero de transmissoes",
              "número de transmissões",
            ])
          ),

          batalhas: numero(
            encontrarColuna(row, [
              "batalhas",
              "battles",
              "numero de batalhas",
              "número de batalhas",
            ])
          ),

          diamantes_batalhas: numero(
            encontrarColuna(row, [
              "diamantes_batalhas",
              "diamantes de batalhas",
              "battle diamonds",
              "battle_diamonds",
            ])
          ),

          diamantes_convidados: numero(
            encontrarColuna(row, [
              "diamantes_convidados",
              "diamantes de convidados",
              "guest diamonds",
              "guest_diamonds",
            ])
          ),

          status_graduacao:
            encontrarColuna(row, [
              "status_graduacao",
              "status graduação",
              "status de graduação",
              "graduacao",
              "graduação",
            ])?.toString() || null,

          status_nivel:
            encontrarColuna(row, [
              "status_nivel",
              "status nível",
              "status nivel",
              "nivel",
              "nível",
            ])?.toString() || null,

          status_fa_clube:
            encontrarColuna(row, [
              "status_fa_clube",
              "status fa clube",
              "fa clube",
              "fã clube",
              "fan club",
            ])?.toString() || null,

          status:
            encontrarColuna(row, [
              "status",
              "situacao",
              "situação",
            ])?.toString() || null,

          /*
           * Guardamos a linha COMPLETA do Excel.
           *
           * Isso é importante porque, se futuramente tiver
           * alguma coluna nova no relatório, os dados continuam
           * disponíveis dentro do JSON.
           */
          dados_completos: row,

          data_importacao: new Date().toISOString(),
        };

        importados.push(resultado);
      }

      if (!importados.length) {
        throw new Error(
          "Não encontrei nenhum criador válido no arquivo. Verifique se o relatório possui uma coluna de ID do criador."
        );
      }

      /*
       * ========================================================
       * REMOVE DUPLICADOS
       * ========================================================
       *
       * A tabela possui uma chave única:
       *
       * streamer_id + criador_id
       *
       * Então duas linhas iguais não podem ser enviadas juntas.
       */

      const mapa = new Map<string, ImportResultado>();

      for (const resultado of importados) {
        const chave =
          `${resultado.streamer_id}_${resultado.criador_id}`;

        /*
         * Se o criador aparecer várias vezes no relatório,
         * usamos a última ocorrência.
         */
        mapa.set(chave, resultado);
      }

      const resultadosUnicos = Array.from(mapa.values());

      console.log(
        "Linhas lidas:",
        importados.length
      );

      console.log(
        "Linhas únicas:",
        resultadosUnicos.length
      );

      /*
       * ========================================================
       * SALVAR NO SUPABASE
       * ========================================================
       */

      const { error: salvarError } = await supabase
        .from("resultados_streamers")
        .upsert(resultadosUnicos, {
          onConflict: "streamer_id,criador_id",
        });

      if (salvarError) {
        console.error(
          "Erro ao salvar resultados:",
          salvarError
        );

        throw new Error(
          `Erro ao salvar resultados: ${salvarError.message}`
        );
      }

      /*
       * Atualiza a tela depois da importação.
       */
      await carregarResultados();

      setMensagem(
        `Importação concluída! ${resultadosUnicos.length} criadores foram processados com sucesso.`
      );

    } catch (error: any) {
      console.error("Erro na importação:", error);

      setErro(
        error?.message ||
          "Ocorreu um erro durante a importação."
      );
    } finally {
      setImportando(false);
    }
  }

  /*
   * ============================================================
   * FILTRO
   * ============================================================
   */

  const resultadosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return resultados;
    }

    return resultados.filter((resultado) => {
      return (
        resultado.nome_criador
          ?.toLowerCase()
          .includes(termo) ||
        resultado.criador_id
          ?.toLowerCase()
          .includes(termo) ||
        resultado.grupo
          ?.toLowerCase()
          .includes(termo) ||
        resultado.agente
          ?.toLowerCase()
          .includes(termo)
      );
    });
  }, [resultados, busca]);

  /*
   * ============================================================
   * ESTATÍSTICAS
   * ============================================================
   */

  const totalDiamantes = resultados.reduce(
    (total, item) =>
      total + (Number(item.diamantes) || 0),
    0
  );

  const totalSeguidores = resultados.reduce(
    (total, item) =>
      total + (Number(item.novos_seguidores) || 0),
    0
  );

  const totalBatalhas = resultados.reduce(
    (total, item) =>
      total + (Number(item.batalhas) || 0),
    0
  );

  /*
   * ============================================================
   * FORMATADORES
   * ============================================================
   */

  function formatarNumero(valor: number | null | undefined) {
    return new Intl.NumberFormat("pt-BR").format(
      Number(valor) || 0
    );
  }

  function formatarData(valor?: string | null) {
    if (!valor) return "—";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return "—";
    }

    return data.toLocaleDateString("pt-BR");
  }

  function formatarDataHora(valor?: string | null) {
    if (!valor) return "—";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      return "—";
    }

    return data.toLocaleString("pt-BR");
  }

  /*
   * ============================================================
   * TELA DE VERIFICAÇÃO
   * ============================================================
   */

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="text-center">
          <div className="mb-4 text-4xl animate-pulse">
            ⚡
          </div>

          <p className="text-slate-300">
            Verificando acesso...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ============================================================
   * PÁGINA
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-[#020617] text-white">

      {/* HEADER */}

      <header className="border-b border-slate-800 bg-[#020617]">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold">
              ⚡ Trovão Azul
            </h1>

            <p className="text-sm text-blue-400">
              Painel Administrativo
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            Voltar
          </button>

        </div>

      </header>

      {/* CONTEÚDO */}

      <section className="mx-auto max-w-7xl px-6 py-10">

        {/* TÍTULO */}

        <div className="mb-8">

          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-400">
            Administração
          </p>

          <h2 className="text-4xl font-bold">
            Dashboard ADM
          </h2>

          <p className="mt-2 max-w-2xl text-slate-400">
            Gerencie os streamers, importe relatórios
            do TikTok e acompanhe o desempenho
            detalhado de cada criador.
          </p>

        </div>

        {/* CARDS */}

        <div className="mb-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">

            <p className="text-sm text-slate-400">
              Streamers cadastrados
            </p>

            <p className="mt-3 text-4xl font-bold">
              {streamers.length}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">

            <p className="text-sm text-slate-400">
              Criadores encontrados
            </p>

            <p className="mt-3 text-4xl font-bold text-blue-400">
              {resultados.length}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">

            <p className="text-sm text-slate-400">
              Diamantes registrados
            </p>

            <p className="mt-3 text-4xl font-bold text-purple-400">
              {formatarNumero(totalDiamantes)}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6">

            <p className="text-sm text-slate-400">
              Novos seguidores
            </p>

            <p className="mt-3 text-4xl font-bold text-green-400">
              {formatarNumero(totalSeguidores)}
            </p>

          </div>

        </div>

        {/* IMPORTAÇÃO */}

        <div className="mb-8 overflow-hidden rounded-2xl border border-blue-500/20 bg-[#0f172a]">

          <div className="border-b border-slate-800 px-6 py-5">

            <div className="flex items-start gap-4">

              <div className="rounded-xl bg-blue-500/10 p-3 text-xl">
                📥
              </div>

              <div>

                <h3 className="text-xl font-bold">
                  Importar resultados
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Envie o relatório exportado do TikTok.
                  O sistema identifica os criadores automaticamente.
                </p>

              </div>

            </div>

          </div>

          <div className="p-6">

            {/* STREAMER DO RELATÓRIO */}

            <div className="mb-5">

              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Streamer deste relatório
              </label>

              <select
                value={streamerSelecionado}
                onChange={(event) =>
                  setStreamerSelecionado(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 md:max-w-md"
              >

                <option value="">
                  Selecione o streamer
                </option>

                {streamers.map((streamer) => (
                  <option
                    key={streamer.id}
                    value={streamer.id}
                  >
                    @{streamer.username_tiktok}
                  </option>
                ))}

              </select>

              <p className="mt-2 text-xs text-slate-500">
                Os criadores encontrados no arquivo ficarão
                vinculados a este streamer.
              </p>

            </div>

            {/* ÁREA DO ARQUIVO */}

            <label
              className={`flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                importando
                  ? "cursor-not-allowed border-slate-800 bg-slate-950"
                  : "border-slate-700 bg-slate-900/50 hover:border-blue-500 hover:bg-slate-900"
              }`}
            >

              <span className="mb-4 text-5xl">
                📊
              </span>

              <span className="text-lg font-bold">
                {importando
                  ? "Importando..."
                  : "Selecionar arquivo"}
              </span>

              <span className="mt-2 text-sm text-slate-500">
                Excel (.xlsx / .xls) ou CSV
              </span>

              <span className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500">
                Escolher arquivo
              </span>

              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                disabled={importando}
                className="hidden"
                onChange={(event) => {

                  const file =
                    event.target.files?.[0];

                  if (!file) return;

                  processarArquivo(file);

                  /*
                   * Permite selecionar o mesmo arquivo
                   * novamente depois.
                   */
                  event.target.value = "";
                }}
              />

            </label>

            {/* ARQUIVO SELECIONADO */}

            {arquivo && (
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4">

                <p className="text-xs text-slate-500">
                  Arquivo selecionado
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <span>📄</span>

                  <span className="text-sm font-semibold text-white">
                    {arquivo.name}
                  </span>

                </div>

              </div>
            )}

            {/* MENSAGEM DE SUCESSO */}

            {mensagem && (
              <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4">

                <p className="text-sm font-semibold text-green-400">
                  ✓ {mensagem}
                </p>

              </div>
            )}

            {/* ERRO */}

            {erro && (
              <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4">

                <p className="text-sm font-semibold text-red-400">
                  ✕ Erro na importação
                </p>

                <p className="mt-1 text-sm text-red-300">
                  {erro}
                </p>

              </div>
            )}

            <p className="mt-4 text-xs text-slate-500">
              Os dados importados são armazenados no
              Supabase e continuam disponíveis depois
              de atualizar a página.
            </p>

          </div>

        </div>

        {/* CRIADORES */}

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a]">

          {/* CABEÇALHO */}

          <div className="border-b border-slate-800 px-6 py-5">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <h3 className="text-xl font-bold">
                    👥 Criadores
                  </h3>

                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                    {resultados.length}
                  </span>

                </div>

                <p className="mt-1 text-sm text-slate-400">
                  Clique em um criador para visualizar
                  todos os dados disponíveis.
                </p>

              </div>

              <input
                type="text"
                value={busca}
                onChange={(event) =>
                  setBusca(event.target.value)
                }
                placeholder="Pesquisar criador..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 lg:w-72"
              />

            </div>

          </div>

          {/* TABELA */}

          {loadingResultados ? (

            <div className="p-12 text-center">

              <div className="mb-3 text-3xl animate-pulse">
                ⚡
              </div>

              <p className="text-slate-400">
                Carregando resultados...
              </p>

            </div>

          ) : resultadosFiltrados.length === 0 ? (

            <div className="p-12 text-center">

              <div className="mb-3 text-4xl">
                📊
              </div>

              <p className="font-semibold text-slate-300">
                Nenhum resultado encontrado.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Importe um relatório para começar.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead>

                  <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">

                    <th className="px-6 py-4">
                      Criador
                    </th>

                    <th className="px-6 py-4">
                      Grupo
                    </th>

                    <th className="px-6 py-4">
                      Diamantes
                    </th>

                    <th className="px-6 py-4">
                      Seguidores
                    </th>

                    <th className="px-6 py-4">
                      Batalhas
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right">
                      Ação
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {resultadosFiltrados.map(
                    (resultado) => (

                      <tr
                        key={`${resultado.streamer_id}-${resultado.criador_id}`}
                        className="border-b border-slate-800/70 transition hover:bg-slate-900/50"
                      >

                        {/* CRIADOR */}

                        <td className="px-6 py-5">

                          <div>

                            <p className="font-semibold text-white">
                              {resultado.nome_criador ||
                                "Criador sem nome"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              ID: {resultado.criador_id}
                            </p>

                          </div>

                        </td>

                        {/* GRUPO */}

                        <td className="px-6 py-5 text-sm text-slate-300">
                          {resultado.grupo || "—"}
                        </td>

                        {/* DIAMANTES */}

                        <td className="px-6 py-5">

                          <span className="font-bold text-purple-400">
                            {formatarNumero(
                              resultado.diamantes
                            )}
                          </span>

                        </td>

                        {/* SEGUIDORES */}

                        <td className="px-6 py-5">

                          <span className="font-semibold text-green-400">
                            +
                            {formatarNumero(
                              resultado.novos_seguidores
                            )}
                          </span>

                        </td>

                        {/* BATALHAS */}

                        <td className="px-6 py-5 text-sm text-slate-300">
                          {formatarNumero(
                            resultado.batalhas
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">

                          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                            {resultado.status ||
                              "Importado"}
                          </span>

                        </td>

                        {/* AÇÃO */}

                        <td className="px-6 py-5 text-right">

                          <button
                            onClick={() =>
                              setResultadoSelecionado(
                                resultado
                              )
                            }
                            className="rounded-lg bg-blue-600/20 px-4 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-600 hover:text-white"
                          >
                            Ver detalhes →
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </section>

      {/* ======================================================
          MODAL DE DETALHES
          ====================================================== */}

      {resultadoSelecionado && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() =>
            setResultadoSelecionado(null)
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#0f172a] shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0f172a] px-6 py-5">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Detalhes do criador
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {resultadoSelecionado.nome_criador ||
                    "Criador sem nome"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  ID: {resultadoSelecionado.criador_id}
                </p>

              </div>

              <button
                onClick={() =>
                  setResultadoSelecionado(null)
                }
                className="rounded-lg border border-slate-700 px-3 py-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>

            </div>

            {/* MODAL CONTENT */}

            <div className="space-y-6 p-6">

              {/* PRINCIPAIS */}

              <div>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Desempenho
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">

                    <p className="text-xs text-slate-500">
                      Diamantes
                    </p>

                    <p className="mt-2 text-2xl font-bold text-purple-400">
                      {formatarNumero(
                        resultadoSelecionado.diamantes
                      )}
                    </p>

                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">

                    <p className="text-xs text-slate-500">
                      Novos seguidores
                    </p>

                    <p className="mt-2 text-2xl font-bold text-green-400">
                      {formatarNumero(
                        resultadoSelecionado.novos_seguidores
                      )}
                    </p>

                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">

                    <p className="text-xs text-slate-500">
                      Batalhas
                    </p>

                    <p className="mt-2 text-2xl font-bold text-blue-400">
                      {formatarNumero(
                        resultadoSelecionado.batalhas
                      )}
                    </p>

                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">

                    <p className="text-xs text-slate-500">
                      Transmissões
                    </p>

                    <p className="mt-2 text-2xl font-bold text-white">
                      {formatarNumero(
                        resultadoSelecionado.transmissoes
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* INFORMAÇÕES */}

              <div>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Informações do criador
                </h3>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                  <Info
                    titulo="Nome"
                    valor={
                      resultadoSelecionado.nome_criador
                    }
                  />

                  <Info
                    titulo="ID do criador"
                    valor={
                      resultadoSelecionado.criador_id
                    }
                  />

                  <Info
                    titulo="Grupo"
                    valor={
                      resultadoSelecionado.grupo
                    }
                  />

                  <Info
                    titulo="Agente"
                    valor={
                      resultadoSelecionado.agente
                    }
                  />

                  <Info
                    titulo="Duração da live"
                    valor={
                      resultadoSelecionado.duracao_live
                    }
                  />

                  <Info
                    titulo="Dias válidos de live"
                    valor={
                      resultadoSelecionado.dias_validos_live
                    }
                  />

                  <Info
                    titulo="Diamantes de batalhas"
                    valor={formatarNumero(
                      resultadoSelecionado
                        .diamantes_batalhas
                    )}
                  />

                  <Info
                    titulo="Diamantes de convidados"
                    valor={formatarNumero(
                      resultadoSelecionado
                        .diamantes_convidados
                    )}
                  />

                  <Info
                    titulo="Status graduação"
                    valor={
                      resultadoSelecionado.status_graduacao
                    }
                  />

                  <Info
                    titulo="Status nível"
                    valor={
                      resultadoSelecionado.status_nivel
                    }
                  />

                  <Info
                    titulo="Status fã-clube"
                    valor={
                      resultadoSelecionado.status_fa_clube
                    }
                  />

                  <Info
                    titulo="Status"
                    valor={
                      resultadoSelecionado.status
                    }
                  />

                </div>

              </div>

              {/* DADOS ORIGINAIS */}

              {resultadoSelecionado.dados_completos && (

                <div>

                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Dados originais do relatório
                  </h3>

                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">

                    <table className="w-full min-w-[600px]">

                      <tbody>

                        {Object.entries(
                          resultadoSelecionado.dados_completos
                        ).map(([chave, valor]) => (

                          <tr
                            key={chave}
                            className="border-b border-slate-800/70 last:border-0"
                          >

                            <td className="w-1/3 px-5 py-3 text-xs font-semibold text-slate-500">
                              {chave}
                            </td>

                            <td className="px-5 py-3 text-sm text-slate-200">
                              {valor === null ||
                              valor === undefined ||
                              valor === ""
                                ? "—"
                                : String(valor)}
                            </td>

                          </tr>

                        ))}

                      </tbody>

                    </table>

                  </div>

                </div>

              )}

              {/* DATAS */}

              <div className="grid gap-4 md:grid-cols-2">

                <Info
                  titulo="Data da importação"
                  valor={formatarDataHora(
                    resultadoSelecionado.data_importacao
                  )}
                />

                <Info
                  titulo="Última atualização"
                  valor={formatarDataHora(
                    resultadoSelecionado.updated_at
                  )}
                />

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="border-t border-slate-800 px-6 py-4 text-right">

              <button
                onClick={() =>
                  setResultadoSelecionado(null)
                }
                className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Fechar
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

/*
 * ============================================================
 * COMPONENTE DE INFORMAÇÃO
 * ============================================================
 */

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: any;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">

      <p className="text-xs font-medium text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-200">
        {valor === null ||
        valor === undefined ||
        valor === ""
          ? "—"
          : String(valor)}
      </p>

    </div>
  );
}