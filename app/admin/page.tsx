"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import Logo from "@/components/Logo";

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
  dados_completos?: Record<string, any> | null;
  data_importacao?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ImportResultado = Omit<
  Resultado,
  "id" | "created_at" | "updated_at"
> & {
  streamer_id: string;
  criador_id: string;
  data_importacao: string;
};

/** Agrupamento persistido para os criadores importados do relatório. */
type StreamerGroup = {
  id: string;
  nome: string;
  streamer_principal_id: string; // chave composta do criador principal
  created_at: string;
  memberIds: string[]; // chaves compostas dos criadores membros
};

type CreatorManagement = {
  creator_key: string;
  streamer_id: string;
  criador_id: string;
  inactive_since: string | null;
  last_active_at: string | null;
  archived_at: string | null;
  manual_archived: boolean;
  archive_reason: string | null;
  updated_at?: string;
};

type MonthlyData = {
  label: string;
  fullLabel: string;
  diamantes: number;
  seguidores: number;
  batalhas: number;
  transmissoes: number;
};

const ADMIN_GROUP_PASSWORD = "0102";

export default function AdminPage() {
  const router = useRouter();

  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [grupos, setGrupos] = useState<StreamerGroup[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingResultados, setLoadingResultados] = useState(false);
  const [verificando, setVerificando] = useState(true);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [importando, setImportando] = useState(false);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [paginaCriadoresAtivos, setPaginaCriadoresAtivos] = useState(1);
  const [paginaCriadoresSaiu, setPaginaCriadoresSaiu] = useState(1);
  const [paginaCriadoresArquivados, setPaginaCriadoresArquivados] = useState(1);
  const [selecionadosCriadores, setSelecionadosCriadores] = useState<string[]>([]);
  const [gestaoCriadores, setGestaoCriadores] = useState<CreatorManagement[]>([]);
  const [resultadoSelecionado, setResultadoSelecionado] =
    useState<Resultado | null>(null);

  const [periodo, setPeriodo] =
    useState<"6" | "12">("6");

  const [mostrarAgrupamento, setMostrarAgrupamento] =
    useState(false);

  const [grupoSelecionado, setGrupoSelecionado] =
    useState<StreamerGroup | null>(null);

  const [nomeGrupo, setNomeGrupo] =
    useState("");

  const [principalSelecionado, setPrincipalSelecionado] =
    useState("");

  const [membrosSelecionados, setMembrosSelecionados] =
    useState<string[]>([]);

  const [buscaAgrupamento, setBuscaAgrupamento] = useState("");
  const [paginaListaAgrupamento, setPaginaListaAgrupamento] = useState(1);
  const [buscaContaPrincipal, setBuscaContaPrincipal] = useState("");
  const [principalDropdownAberto, setPrincipalDropdownAberto] = useState(false);
  const [paginaContaPrincipal, setPaginaContaPrincipal] = useState(1);
  const [agrupamentoExpandido, setAgrupamentoExpandido] = useState(true);

  // Gavetas independentes para organizar as listas de criadores.
  // A lista ativa começa aberta; as listas de saída e arquivo começam recolhidas.
  const [criadoresAtivosExpandido, setCriadoresAtivosExpandido] = useState(true);
  const [criadoresSaiuExpandido, setCriadoresSaiuExpandido] = useState(false);
  const [criadoresArquivadosExpandido, setCriadoresArquivadosExpandido] = useState(false);

  const [senhaAgrupamento, setSenhaAgrupamento] =
    useState("");

  const [agrupando, setAgrupando] =
    useState(false);

  /*
   * IMPORTANTE:
   * Não usamos new Date() diretamente no render.
   * O horário atual é definido somente depois que
   * o componente chega no navegador.
   */
  const [agora, setAgora] =
    useState<Date | null>(null);

  const [ultimaAtualizacao, setUltimaAtualizacao] =
    useState("—");

  /*
   * ============================================================
   * VERIFICAÇÃO DO ADMIN
   * ============================================================
   */

  useEffect(() => {
    setPaginaCriadoresAtivos(1);
    setPaginaCriadoresSaiu(1);
    setPaginaCriadoresArquivados(1);
  }, [busca, resultados, gestaoCriadores]);

  useEffect(() => {
    setAgora(new Date());

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

      const {
        data: admin,
        error: adminError,
      } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError || !admin) {
        if (adminError) {
          console.error(
            "Erro ao verificar administrador:",
            adminError
          );
        }

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
   * CARREGAR TUDO
   * ============================================================
   */

  async function carregarTudo() {
    setLoading(true);
    setErro("");

    try {
      const [, resultadosCarregados, , gestaoCarregada] = await Promise.all([
        carregarStreamers(),
        carregarResultados(),
        carregarGrupos(),
        carregarGestaoCriadores(),
      ]);

      if (resultadosCarregados) {
        await inicializarGestaoDosCriadores(
          resultadosCarregados,
          gestaoCarregada || []
        );
        const gestaoAtualizada = await carregarGestaoCriadores();
        await arquivarInativosAutomaticamente(gestaoAtualizada || []);
        await carregarGestaoCriadores();
      }

      setUltimaAtualizacao(
        new Date().toLocaleString("pt-BR")
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * STREAMERS
   * ============================================================
   */

  async function carregarStreamers() {
    const {
      data,
      error,
    } = await supabase
      .from("streamers")
      .select(
        "id, username_tiktok, email, created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Erro ao carregar streamers:",
        error
      );

      setErro(
        `Erro ao carregar streamers: ${error.message}`
      );

      return;
    }

    const lista = data || [];

    setStreamers(lista);

  }

  /*
   * ============================================================
   * RESULTADOS
   * ============================================================
   */

  async function carregarResultados() {
    setLoadingResultados(true);

    try {
      const todosResultados: Resultado[] = [];
      const tamanhoPagina = 1000;
      let inicio = 0;

      while (true) {
        const {
          data,
          error,
        } = await supabase
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
          .order("diamantes", { ascending: false })
          .order("id", { ascending: true })
          .range(inicio, inicio + tamanhoPagina - 1);

        if (error) {
          console.error("Erro ao carregar resultados:", error);
          setErro(`Erro ao carregar resultados: ${error.message}`);
          return;
        }

        const pagina = data || [];
        todosResultados.push(...pagina);

        if (pagina.length < tamanhoPagina) break;
        inicio += tamanhoPagina;
      }

      // Ignora apenas o registro legado cujo criador_id é uma mensagem de status,
      // não um ID real. Não removemos nem alteramos dados no Supabase.
      const resultadosFiltrados = todosResultados.filter((resultado) => {
        const idNormalizado = String(resultado.criador_id ?? "")
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        return idNormalizado !== "o criador deixou a agencia";
      });

      setResultados(resultadosFiltrados);
      return resultadosFiltrados;
    } finally {
      setLoadingResultados(false);
    }
  }

  /*
   * ============================================================
   * GRUPOS
   * ============================================================
   */

  async function carregarGrupos() {
    const { data: groups, error: groupError } = await supabase
      .from("criador_grupos")
      .select("id, nome, principal_creator_key, created_at")
      .order("created_at", { ascending: false });

    if (groupError) {
      console.error("Erro ao carregar grupos de criadores:", groupError);
      setErro(`Erro ao carregar grupos de criadores: ${groupError.message}. Execute o arquivo SQL de configuração antes de usar esta função.`);
      setGrupos([]);
      return [] as StreamerGroup[];
    }

    const { data: members, error: memberError } = await supabase
      .from("criador_grupo_membros")
      .select("group_id, creator_key");

    if (memberError) {
      console.error("Erro ao carregar membros dos grupos:", memberError);
      setErro(`Erro ao carregar membros dos grupos: ${memberError.message}`);
      setGrupos([]);
      return [] as StreamerGroup[];
    }

    const gruposMontados: StreamerGroup[] = (groups || []).map((group: any) => ({
      id: group.id,
      nome: group.nome,
      streamer_principal_id: group.principal_creator_key,
      created_at: group.created_at,
      memberIds: (members || [])
        .filter((member: any) => member.group_id === group.id)
        .map((member: any) => member.creator_key),
    }));

    setGrupos(gruposMontados);
    return gruposMontados;
  }

  async function carregarGestaoCriadores(): Promise<CreatorManagement[]> {
    const { data, error } = await supabase
      .from("criador_gestao")
      .select("creator_key, streamer_id, criador_id, inactive_since, last_active_at, archived_at, manual_archived, archive_reason, updated_at");

    if (error) {
      console.error("Erro ao carregar gestão de criadores:", error);
      setErro(`Erro ao carregar gestão de criadores: ${error.message}. Execute o arquivo SQL de configuração antes de usar arquivamento automático.`);
      setGestaoCriadores([]);
      return [];
    }

    const lista = (data || []) as CreatorManagement[];
    setGestaoCriadores(lista);
    return lista;
  }

  /*
   * ============================================================
   * FUNÇÕES AUXILIARES
   * ============================================================
   */

  function normalizarTexto(
    valor: any
  ): string {
    if (
      valor === null ||
      valor === undefined
    ) {
      return "";
    }

    return String(valor)
      .trim()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .replace(
        /[\s\-\/().]+/g,
        "_"
      );
  }

  function numero(
    valor: any
  ): number | null {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return null;
    }

    if (
      typeof valor === "number"
    ) {
      return Number.isFinite(valor)
        ? valor
        : null;
    }

    let texto =
      String(valor)
        .trim()
        .replace(
          /[^\d,.-]/g,
          ""
        );

    if (
      texto.includes(",") &&
      texto.includes(".")
    ) {
      texto = texto
        .replace(/\./g, "")
        .replace(",", ".");
    } else if (
      texto.includes(",")
    ) {
      texto =
        texto.replace(
          ",",
          "."
        );
    }

    const n =
      Number(texto);

    return Number.isFinite(n)
      ? n
      : null;
  }

  function encontrarColuna(
    row: Record<string, any>,
    nomes: string[]
  ) {
    const chaves =
      Object.keys(row);

    for (
      const nome of nomes
    ) {
      const procurada =
        normalizarTexto(
          nome
        );

      const chaveEncontrada =
        chaves.find(
          (chave) =>
            normalizarTexto(
              chave
            ) === procurada
        );

      if (
        chaveEncontrada
      ) {
        return row[
          chaveEncontrada
        ];
      }
    }

    return null;
  }

  function encontrarColunaContendo(
    row: Record<string, any>,
    termos: string[]
  ) {
    const chaves =
      Object.keys(row);

    const chaveEncontrada =
      chaves.find(
        (chave) => {
          const normalizada =
            normalizarTexto(
              chave
            );

          return termos.some(
            (termo) =>
              normalizada.includes(
                normalizarTexto(
                  termo
                )
              )
          );
        }
      );

    if (
      !chaveEncontrada
    ) {
      return null;
    }

    return row[
      chaveEncontrada
    ];
  }

  function obterCriadorId(
    row: Record<string, any>
  ): string {
    const valor =
      encontrarColuna(
        row,
        [
          "criador_id",
          "creator_id",
          "creatorid",
          "id_criador",
          "id do criador",
          "id",
          "creator id",
        ]
      ) ??
      encontrarColunaContendo(
        row,
        [
          "criador_id",
          "creator_id",
          "creator id",
          "id_criador",
        ]
      );

    const idOriginal = String(valor ?? "").trim();

    // Alguns registros de quem saiu da agência trazem uma mensagem no lugar
    // do ID. Essa mensagem não pode servir de chave, pois faria vários criadores
    // sobrescreverem os dados uns dos outros durante a importação.
    if (/^\d{10,}$/.test(idOriginal)) {
      return idOriginal;
    }

    // Muitas linhas podem trazer a mesma mensagem no lugar do ID; além disso,
    // o campo de nome pode repetir valores. Não usamos apenas o nome como chave.
    // A linha inteira gera uma identidade estável, evitando que os registros sem
    // ID real se sobrescrevam no upsert. Reimportar o mesmo arquivo gera as mesmas
    // chaves. Os IDs numéricos reais acima continuam preservados.
    const identidade = Object.keys(row)
      .sort((a, b) => a.localeCompare(b))
      .map((chave) => {
        const valor = String(row[chave] ?? "").trim();
        return `${normalizarTexto(chave)}:${valor}`;
      })
      .join("|");

    let hash = 2166136261;
    for (let i = 0; i < identidade.length; i++) {
      hash ^= identidade.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    // O +1 evita gerar -0 caso o hash seja zero.
    return `-${(hash >>> 0) + 1}`;
  }

  function obterNomeCriador(
    row: Record<string, any>
  ): string | null {
    const valor =
      encontrarColuna(
        row,
        [
          "nome_criador",
          "nome do criador",
          "criador",
          "nome",
          "creator_name",
          "creator name",
          "username",
          "nickname",
        ]
      );

    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      return null;
    }

    return String(
      valor
    ).trim();
  }

  function formatarNumero(
    valor:
      | number
      | null
      | undefined
  ) {
    return new Intl.NumberFormat(
      "pt-BR"
    ).format(
      Number(valor) || 0
    );
  }

  function formatarData(
    valor?: string | null
  ) {
    if (!valor) {
      return "—";
    }

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return "—";
    }

    return data.toLocaleDateString(
      "pt-BR"
    );
  }

  function formatarDataHora(
    valor?: string | null
  ) {
    if (!valor) {
      return "—";
    }

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return "—";
    }

    return data.toLocaleString(
      "pt-BR"
    );
  }

  function obterStreamer(
    id: string
  ) {
    return streamers.find(
      (streamer) =>
        streamer.id === id
    );
  }

  function obterGrupoDoCriador(creatorKey: string) {
    return grupos.find((grupo) => grupo.memberIds.includes(creatorKey));
  }

  function normalizarUsername(
    valor: any
  ): string {
    return String(valor ?? "")
      .trim()
      .replace(/^@+/, "")
      .toLowerCase();
  }

  /** Identidade estável de um criador dentro da agência/relatório. */
  function chaveCriador(resultado: Pick<Resultado, "streamer_id" | "criador_id">): string {
    return `${resultado.streamer_id}::${resultado.criador_id}`;
  }

  function obterCriadorPorChave(creatorKey: string): Resultado | undefined {
    return resultados.find((resultado) => chaveCriador(resultado) === creatorKey);
  }

  function obterGestaoDoCriador(creatorKey: string): CreatorManagement | undefined {
    return gestaoCriadores.find((item) => item.creator_key === creatorKey);
  }

  function criadorEstaArquivado(resultado: Resultado): boolean {
    return Boolean(obterGestaoDoCriador(chaveCriador(resultado))?.archived_at);
  }

  function criadorTemAtividade(resultado: Resultado): boolean {
    return (
      (Number(resultado.diamantes) || 0) > 0 ||
      (Number(resultado.duracao_live) || 0) > 0 ||
      (Number(resultado.dias_validos_live) || 0) > 0 ||
      (Number(resultado.transmissoes) || 0) > 0
    );
  }

  function obterPeriodoRelatorio(resultado?: Resultado): { inicio: Date; fim: Date } | null {
    if (!resultado) return null;
    const dados = resultado.dados_completos || {};
    const valorPeriodo = encontrarColuna(dados, [
      "período dos dados",
      "periodo dos dados",
      "data do relatório",
      "período",
      "periodo",
    ]);
    const datas = String(valorPeriodo ?? "").match(/\d{4}-\d{2}-\d{2}/g);
    if (datas && datas.length >= 2) {
      const inicio = new Date(`${datas[0]}T12:00:00`);
      const fim = new Date(`${datas[1]}T12:00:00`);
      if (!Number.isNaN(inicio.getTime()) && !Number.isNaN(fim.getTime())) {
        return { inicio, fim };
      }
    }
    return null;
  }

  async function inicializarGestaoDosCriadores(
    listaResultados: Resultado[],
    gestaoExistente: CreatorManagement[]
  ) {
    const chavesExistentes = new Set(gestaoExistente.map((item) => item.creator_key));
    const agoraIso = new Date().toISOString();
    const novos = listaResultados
      .filter((resultado) => !chavesExistentes.has(chaveCriador(resultado)))
      .map((resultado) => {
        const ativo = criadorTemAtividade(resultado);
        const periodoRelatorio = obterPeriodoRelatorio(resultado);
        const referencia = resultado.data_importacao || resultado.updated_at || agoraIso;
        return {
          creator_key: chaveCriador(resultado),
          streamer_id: resultado.streamer_id,
          criador_id: resultado.criador_id,
          inactive_since: ativo ? null : (periodoRelatorio?.inicio.toISOString() || referencia),
          last_active_at: ativo ? (periodoRelatorio?.fim.toISOString() || referencia) : null,
          archived_at: null,
          manual_archived: false,
          archive_reason: null,
          updated_at: agoraIso,
        };
      });

    if (!novos.length) return;

    const { error } = await supabase
      .from("criador_gestao")
      .upsert(novos, { onConflict: "creator_key", ignoreDuplicates: true });

    if (error) {
      console.error("Erro ao inicializar gestão de criadores:", error);
      setErro(`Erro ao inicializar gestão dos criadores: ${error.message}`);
    }
  }

  async function arquivarInativosAutomaticamente(listaGestao: CreatorManagement[]) {
    const limite = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const vencidos = listaGestao.filter((item) =>
      !item.manual_archived &&
      !item.archived_at &&
      Boolean(item.inactive_since) &&
      new Date(item.inactive_since as string).getTime() <= limite
    );

    if (!vencidos.length) return;

    const agoraIso = new Date().toISOString();
    const { error } = await supabase
      .from("criador_gestao")
      .update({
        archived_at: agoraIso,
        archive_reason: "inatividade_30_dias",
        updated_at: agoraIso,
      })
      .in("creator_key", vencidos.map((item) => item.creator_key))
      .eq("manual_archived", false)
      .is("archived_at", null);

    if (error) {
      console.error("Erro ao arquivar criadores inativos:", error);
      setErro(`Erro ao arquivar criadores inativos: ${error.message}`);
    }
  }

  async function atualizarGestaoAposImportacao(
    importados: ImportResultado[],
    resultadosAntesDaImportacao: Resultado[]
  ) {
    const { data: dadosGestao, error: erroGestao } = await supabase
      .from("criador_gestao")
      .select("creator_key, streamer_id, criador_id, inactive_since, last_active_at, archived_at, manual_archived, archive_reason, updated_at");

    if (erroGestao) {
      throw new Error(`Não consegui atualizar o controle de inatividade: ${erroGestao.message}. Confira se executou o SQL de configuração.`);
    }

    const existentes = new Map<string, CreatorManagement>(
      ((dadosGestao || []) as CreatorManagement[]).map((item) => [item.creator_key, item])
    );
    const agoraIso = new Date().toISOString();
    const periodoRelatorio = importados.length
      ? obterPeriodoRelatorio(importados[0] as Resultado)
      : null;
    const inicioPeriodo = periodoRelatorio?.inicio.toISOString() || agoraIso;
    const fimPeriodo = periodoRelatorio?.fim.toISOString() || agoraIso;
    const chavesImportadas = new Set(importados.map((item) => chaveCriador(item)));
    const porChave = new Map<string, any>();

    for (const resultado of importados) {
      const key = chaveCriador(resultado);
      const anterior = existentes.get(key);
      const ativo = criadorTemAtividade(resultado as Resultado);
      porChave.set(key, {
        creator_key: key,
        streamer_id: resultado.streamer_id,
        criador_id: resultado.criador_id,
        inactive_since: ativo ? null : (anterior?.inactive_since || inicioPeriodo),
        last_active_at: ativo ? fimPeriodo : (anterior?.last_active_at || null),
        archived_at: ativo && !anterior?.manual_archived ? null : (anterior?.archived_at || null),
        manual_archived: Boolean(anterior?.manual_archived),
        archive_reason: ativo && !anterior?.manual_archived ? null : (anterior?.archive_reason || null),
        updated_at: agoraIso,
      });
    }

    // Se o criador sumiu completamente do novo relatório mensal, começa a contar
    // inatividade a partir do início do período desse relatório.
    for (const antigo of resultadosAntesDaImportacao) {
      const key = chaveCriador(antigo);
      if (chavesImportadas.has(key)) continue;
      const anterior = existentes.get(key);
      porChave.set(key, {
        creator_key: key,
        streamer_id: antigo.streamer_id,
        criador_id: antigo.criador_id,
        inactive_since: anterior?.inactive_since || inicioPeriodo,
        last_active_at: anterior?.last_active_at || null,
        archived_at: anterior?.archived_at || null,
        manual_archived: Boolean(anterior?.manual_archived),
        archive_reason: anterior?.archive_reason || null,
        updated_at: agoraIso,
      });
    }

    const updates = Array.from(porChave.values());
    if (updates.length) {
      const { error } = await supabase
        .from("criador_gestao")
        .upsert(updates, { onConflict: "creator_key" });
      if (error) throw new Error(`Erro ao salvar status de atividade: ${error.message}`);
    }
  }

  function obterUsernameTikTokResultado(
    resultado: Resultado
  ): string {
    const valor = encontrarColuna(
      resultado.dados_completos || {},
      [
        "username_tiktok",
        "username tiktok",
        "tiktok_username",
        "tiktok username",
      ]
    );

    if (valor !== null && valor !== undefined && String(valor).trim()) {
      return String(valor).trim().replace(/^@+/, "");
    }

    const streamer = obterStreamer(
      resultado.streamer_id
    );

    return streamer?.username_tiktok || "";
  }

  function obterStreamerPorUsername(
    username: string
  ) {
    const normalizado =
      normalizarUsername(username);

    return streamers.find(
      (streamer) =>
        normalizarUsername(
          streamer.username_tiktok
        ) === normalizado
    );
  }

  function obterGrupoDoResultado(resultado: Resultado) {
    return obterGrupoDoCriador(chaveCriador(resultado));
  }

  function nomeStreamer(
    streamerId: string
  ) {
    const streamer =
      obterStreamer(
        streamerId
      );

    return streamer
      ? `@${streamer.username_tiktok}`
      : "Streamer";
  }

  /*
   * ============================================================
   * GRUPO / RESULTADOS CONSOLIDADOS
   * ============================================================
   */

  function idsDoGrupo(creatorKey: string): string[] {
    const grupo = obterGrupoDoCriador(creatorKey);
    return grupo ? grupo.memberIds : [creatorKey];
  }

  function resultadosDoGrupo(creatorKey: string) {
    const ids = idsDoGrupo(creatorKey);
    return resultados.filter((resultado) => ids.includes(chaveCriador(resultado)) && !criadorEstaArquivado(resultado));
  }

  function obterUsernameTikTokLinha(
    row: Record<string, any>
  ): string {
    const valor = encontrarColuna(
      row,
      [
        "username_tiktok",
        "username tiktok",
        "tiktok_username",
        "tiktok username",
      ]
    );

    return String(valor ?? "")
      .trim()
      .replace(/^@+/, "");
  }


  /** Identidade do criador presente no relatório, sem fallback para a conta ADM. */
  function obterUsernameDoRegistroCriador(
    resultado: Resultado
  ): string {
    const valor = encontrarColuna(
      resultado.dados_completos || {},
      [
        "username_tiktok",
        "username tiktok",
        "tiktok_username",
        "tiktok username",
        "creator_username",
        "creator username",
        "username",
        "user_name",
        "nickname",
        "@username",
      ]
    );

    return String(valor ?? "")
      .trim()
      .replace(/^@+/, "");
  }

  function obterNomeExibicaoCriador(
    resultado: Resultado
  ): string {
    const nomeSalvo = String(resultado.nome_criador ?? "").trim();
    if (nomeSalvo) return nomeSalvo;

    const dados = resultado.dados_completos || {};
    const nomeRelatorio = encontrarColuna(dados, [
      "nome_criador",
      "nome do criador",
      "creator_name",
      "creator name",
      "display_name",
      "display name",
      "nickname",
      "nome",
      "name",
      "criador",
    ]);

    if (nomeRelatorio !== null && nomeRelatorio !== undefined && String(nomeRelatorio).trim()) {
      return String(nomeRelatorio).trim();
    }

    const username = obterUsernameDoRegistroCriador(resultado);
    if (username) return `@${username}`;

    const idCriador = String(resultado.criador_id || "");
    if (idCriador.startsWith("-")) {
      return `Criador sem nome #${idCriador.slice(1, 7)}`;
    }

    return `Criador ${idCriador || "sem ID"}`;
  }

  /*
   * ============================================================
   * IMPORTAÇÃO
   * ============================================================
   */

  async function processarArquivo(
    file: File
  ) {
    setArquivo(file);
    setMensagem("");
    setErro("");

    setImportando(true);

    try {
      const extensao =
        file.name
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

      const buffer =
        await file.arrayBuffer();

      let workbook:
        XLSX.WorkBook;

      if (
        extensao === "csv"
      ) {
        const texto =
          new TextDecoder(
            "utf-8"
          ).decode(buffer);

        workbook =
          XLSX.read(
            texto,
            {
              type: "string",
              raw: true,
            }
          );
      } else {
        workbook =
          XLSX.read(
            buffer,
            {
              type: "array",
              raw: false,
            }
          );
      }

      if (
        !workbook
          .SheetNames
          .length
      ) {
        throw new Error(
          "Não encontrei nenhuma planilha no arquivo."
        );
      }

      const primeiraPlanilha =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];

      const linhas =
        XLSX.utils.sheet_to_json<
          Record<string, any>
        >(
          primeiraPlanilha,
          {
            defval: null,
            raw: false,
          }
        );

      if (
        !linhas.length
      ) {
        throw new Error(
          "A planilha está vazia ou não foi possível ler os dados."
        );
      }

      const dataImportacao =
        new Date().toISOString();

      const importados:
        ImportResultado[] =
        [];

      for (
        const row of linhas
      ) {
        const criadorIdBase = obterCriadorId(row);
        if (!criadorIdBase) continue;

        const usernameTikTok = String(
          encontrarColuna(row, [
            "username_tiktok", "username tiktok", "tiktok_username", "tiktok username",
            "creator_username", "creator username", "username", "user_name", "nickname", "@username",
          ]) ?? obterUsernameTikTokLinha(row) ?? ""
        ).trim().replace(/^@+/, "");
        const nomeDaLinha = obterNomeCriador(row);
        const nomeConfiavel = Boolean(
          nomeDaLinha &&
          !normalizarTexto(nomeDaLinha).includes("deixou_a_agencia") &&
          !normalizarTexto(nomeDaLinha).startsWith("criador_sem_nome")
        );
        const existentePelaIdentidade = resultados.find((existente) => {
          const usernameExistente = obterUsernameDoRegistroCriador(existente);
          if (usernameTikTok && usernameExistente) {
            return normalizarUsername(usernameTikTok) === normalizarUsername(usernameExistente);
          }
          if (!usernameTikTok && nomeConfiavel) {
            return normalizarTexto(obterNomeExibicaoCriador(existente)) === normalizarTexto(nomeDaLinha);
          }
          return false;
        });
        const criadorId = /^\d{10,}$/.test(criadorIdBase)
          ? criadorIdBase
          : (existentePelaIdentidade?.criador_id || criadorIdBase);

        const streamerDaLinha =
          usernameTikTok
            ? obterStreamerPorUsername(
                usernameTikTok
              )
            : undefined;

        const streamerIdParaSalvar =
          streamerDaLinha?.id ||
          streamers[0]?.id;

        if (!streamerIdParaSalvar) {
          throw new Error(
            "Não encontrei nenhuma conta base na tabela streamers. Cadastre pelo menos uma conta antes de importar o relatório."
          );
        }

        const resultado:
          ImportResultado = {
          streamer_id:
            streamerIdParaSalvar,

          criador_id:
            criadorId,

          nome_criador:
            obterNomeCriador(
              row
            ),

          grupo:
            encontrarColuna(
              row,
              [
                "grupo",
                "group",
              ]
            )?.toString() ||
            null,

          agente:
            encontrarColuna(
              row,
              [
                "agente",
                "agent",
              ]
            )?.toString() ||
            null,

          diamantes:
            numero(
              encontrarColuna(
                row,
                [
                  "diamantes",
                  "diamonds",
                  "diamantes ganhos",
                  "total de diamantes",
                ]
              )
            ),

          duracao_live:
            numero(
              encontrarColuna(
                row,
                [
                  "duracao_live",
                  "duracao da live",
                  "duração da live",
                  "live duration",
                  "duracao",
                ]
              )
            ),

          dias_validos_live:
            numero(
              encontrarColuna(
                row,
                [
                  "dias_validos_live",
                  "dias validos live",
                  "dias válidos live",
                  "dias validos",
                  "dias válidos",
                ]
              )
            ),

          novos_seguidores:
            numero(
              encontrarColuna(
                row,
                [
                  "novos_seguidores",
                  "novos seguidores",
                  "new followers",
                  "new_followers",
                ]
              )
            ),

          transmissoes:
            numero(
              encontrarColuna(
                row,
                [
                  "transmissoes",
                  "transmissões",
                  "lives",
                  "numero de transmissoes",
                  "número de transmissões",
                ]
              )
            ),

          batalhas:
            numero(
              encontrarColuna(
                row,
                [
                  "batalhas",
                  "battles",
                  "numero de batalhas",
                  "número de batalhas",
                ]
              )
            ),

          diamantes_batalhas:
            numero(
              encontrarColuna(
                row,
                [
                  "diamantes_batalhas",
                  "diamantes de batalhas",
                  "battle diamonds",
                  "battle_diamonds",
                ]
              )
            ),

          diamantes_convidados:
            numero(
              encontrarColuna(
                row,
                [
                  "diamantes_convidados",
                  "diamantes de convidados",
                  "guest diamonds",
                  "guest_diamonds",
                ]
              )
            ),

          status_graduacao:
            encontrarColuna(
              row,
              [
                "status_graduacao",
                "status graduação",
                "status de graduação",
                "graduacao",
                "graduação",
              ]
            )?.toString() ||
            null,

          status_nivel:
            encontrarColuna(
              row,
              [
                "status_nivel",
                "status nível",
                "status nivel",
                "nivel",
                "nível",
              ]
            )?.toString() ||
            null,

          status_fa_clube:
            encontrarColuna(
              row,
              [
                "status_fa_clube",
                "status fa clube",
                "fa clube",
                "fã clube",
                "fan club",
              ]
            )?.toString() ||
            null,

          status:
            encontrarColuna(
              row,
              [
                "status",
                "situacao",
                "situação",
              ]
            )?.toString() ||
            null,

          dados_completos:
            row,

          data_importacao:
            dataImportacao,
        };

        importados.push(
          resultado
        );
      }

      if (
        !importados.length
      ) {
        throw new Error(
          "Não encontrei nenhum criador válido no arquivo. Verifique se o relatório possui uma coluna de ID do criador."
        );
      }

      const mapa =
        new Map<
          string,
          ImportResultado
        >();

      for (
        const resultado of importados
      ) {
        const chave =
          `${resultado.streamer_id}_${resultado.criador_id}`;

        mapa.set(
          chave,
          resultado
        );
      }

      const resultadosUnicos =
        Array.from(
          mapa.values()
        );

      const {
        error: salvarError,
      } = await supabase
        .from(
          "resultados_streamers"
        )
        .upsert(
          resultadosUnicos,
          {
            onConflict:
              "streamer_id,criador_id",
          }
        );

      if (
        salvarError
      ) {
        throw new Error(
          `Erro ao salvar resultados: ${salvarError.message}`
        );
      }

      await atualizarGestaoAposImportacao(resultadosUnicos, resultados);
      await carregarResultados();
      const gestaoAtualizada = await carregarGestaoCriadores();
      await arquivarInativosAutomaticamente(gestaoAtualizada);
      await carregarGestaoCriadores();

      setUltimaAtualizacao(
        new Date().toLocaleString(
          "pt-BR"
        )
      );

      setMensagem(
        `Importação concluída! ${resultadosUnicos.length} criadores foram processados com sucesso.`
      );
    } catch (
      error: any
    ) {
      console.error(
        "Erro na importação:",
        error
      );

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
   * TOTAIS
   * ============================================================
   */

  const resultadosNaoArquivados = resultados.filter((item) => !criadorEstaArquivado(item));

  const totalDiamantes =
    resultadosNaoArquivados.reduce(
      (total, item) =>
        total +
        (Number(
          item.diamantes
        ) || 0),
      0
    );

  const totalSeguidores =
    resultadosNaoArquivados.reduce(
      (total, item) =>
        total +
        (Number(
          item.novos_seguidores
        ) || 0),
      0
    );

  const totalBatalhas =
    resultadosNaoArquivados.reduce(
      (total, item) =>
        total +
        (Number(
          item.batalhas
        ) || 0),
      0
    );

  const totalTransmissoes =
    resultadosNaoArquivados.reduce(
      (total, item) =>
        total +
        (Number(
          item.transmissoes
        ) || 0),
      0
    );

  /*
   * ============================================================
   * DADOS MENSAIS
   * ============================================================
   */

  const dadosMensais =
    useMemo(() => {
      if (!agora) {
        return [];
      }

      const quantidade =
        Number(periodo);

      const meses:
        MonthlyData[] = [];

      for (
        let i =
          quantidade - 1;
        i >= 0;
        i--
      ) {
        const data =
          new Date(
            agora.getFullYear(),
            agora.getMonth() - i,
            1
          );

        const ano =
          data.getFullYear();

        const mes =
          data.getMonth();

        const dados =
          resultados.filter(
            (resultado) => {
              /*
               * O relatório exportado do TikTok traz a coluna
               * "Período dos dados" (ex.: 2026-09-01 ~ 2026-09-30).
               * Usamos o início desse período para posicionar os
               * resultados no mês correto do gráfico. A data_importacao
               * é apenas uma alternativa para registros antigos que não
               * guardaram o período original.
               */
              const dadosOriginais =
                resultado.dados_completos || {};

              const campoPeriodo =
                Object.entries(dadosOriginais).find(
                  ([chave]) => {
                    const chaveNormalizada =
                      chave
                        .toLocaleLowerCase("pt-BR")
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "");

                    return (
                      chaveNormalizada.includes("periodo") &&
                      chaveNormalizada.includes("dados")
                    );
                  }
                );

              const datasDoPeriodo =
                String(campoPeriodo?.[1] ?? "").match(
                  /\b\d{4}-\d{2}-\d{2}\b/g
                );

              const dataReferencia =
                datasDoPeriodo?.length
                  ? new Date(`${datasDoPeriodo[0]}T12:00:00`)
                  : resultado.data_importacao
                    ? new Date(resultado.data_importacao)
                    : null;

              if (
                !dataReferencia ||
                Number.isNaN(dataReferencia.getTime())
              ) {
                return false;
              }

              return (
                dataReferencia.getFullYear() === ano &&
                dataReferencia.getMonth() === mes
              );
            }
          );

        const diamantes =
          dados.reduce(
            (total, item) =>
              total +
              (Number(
                item.diamantes
              ) || 0),
            0
          );

        const seguidores =
          dados.reduce(
            (total, item) =>
              total +
              (Number(
                item.novos_seguidores
              ) || 0),
            0
          );

        const batalhas =
          dados.reduce(
            (total, item) =>
              total +
              (Number(
                item.batalhas
              ) || 0),
            0
          );

        const transmissoes =
          dados.reduce(
            (total, item) =>
              total +
              (Number(
                item.transmissoes
              ) || 0),
            0
          );

        meses.push({
          label:
            data
              .toLocaleDateString(
                "pt-BR",
                {
                  month:
                    "short",
                }
              )
              .replace(
                ".",
                ""
              )
              .toUpperCase(),

          fullLabel:
            data.toLocaleDateString(
              "pt-BR",
              {
                month:
                  "long",
                year:
                  "numeric",
              }
            ),

          diamantes,
          seguidores,
          batalhas,
          transmissoes,
        });
      }

      return meses;
    }, [
      agora,
      resultados,
      periodo,
    ]);

  const mesAtual =
    dadosMensais[
      dadosMensais.length - 1
    ];

  const mesAnterior =
    dadosMensais[
      dadosMensais.length - 2
    ];

  function calcularVariacao(
    atual: number,
    anterior: number
  ) {
    if (!anterior) {
      return atual
        ? 100
        : 0;
    }

    return (
      ((atual - anterior) /
        anterior) *
      100
    );
  }

  const maxDiamantes =
    Math.max(
      ...dadosMensais.map(
        (item) =>
          item.diamantes
      ),
      1
    );

  /*
   * ============================================================
   * CRIADORES IMPORTADOS
   * ============================================================
   * A área principal do painel mostra todas as linhas de criadores
   * importadas de resultados_streamers, em uma lista única. A tabela
   * streamers continua servindo somente ao gerenciamento de contas e
   * agrupamentos; ela não limita mais quais criadores aparecem aqui.
   */
  const criadoresVisiveis = useMemo(() => {
    return resultadosNaoArquivados
      .slice()
      .sort((a, b) => (Number(b.diamantes) || 0) - (Number(a.diamantes) || 0));
  }, [resultados, gestaoCriadores]);

  const criadoresArquivados = useMemo(() => {
    return resultados
      .filter((resultado) => criadorEstaArquivado(resultado))
      .sort((a, b) => (Number(b.diamantes) || 0) - (Number(a.diamantes) || 0));
  }, [resultados, gestaoCriadores]);

  const criadoresFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca).replace(/^@+/, "");
    if (!termo) return criadoresVisiveis;

    return criadoresVisiveis.filter((resultado) => {
      const username = obterUsernameDoRegistroCriador(resultado);
      const nome = obterNomeExibicaoCriador(resultado);
      const valoresExtras = [
        resultado.criador_id,
        resultado.grupo,
        resultado.agente,
        resultado.status,
        resultado.status_graduacao,
        resultado.status_nivel,
        resultado.status_fa_clube,
      ];
      return [nome, username, ...valoresExtras]
        .some((valor) => normalizarTexto(valor).includes(termo));
    });
  }, [criadoresVisiveis, busca]);

  const criadoresArquivadosFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca).replace(/^@+/, "");
    if (!termo) return criadoresArquivados;
    return criadoresArquivados.filter((resultado) => {
      const username = obterUsernameDoRegistroCriador(resultado);
      const nome = obterNomeExibicaoCriador(resultado);
      return [nome, username, resultado.criador_id, resultado.grupo, resultado.agente, obterStatusCriador(resultado)]
        .some((valor) => normalizarTexto(valor).includes(termo));
    });
  }, [criadoresArquivados, busca]);

  function obterStatusCriador(resultado: Resultado): string {
    return String(
      resultado.status ||
      resultado.status_graduacao ||
      resultado.status_nivel ||
      resultado.status_fa_clube ||
      ""
    ).trim();
  }

  function criadorSaiuDaAgencia(resultado: Resultado): boolean {
    const status = normalizarTexto(obterStatusCriador(resultado));
    return (
      status === "saiu" ||
      status.includes("saiu") ||
      status.includes("deixou_a_agencia") ||
      status.includes("deixou_agencia") ||
      status.includes("criador_saiu")
    );
  }

  const criadoresSaiuFiltrados = useMemo(
    () => criadoresFiltrados.filter(criadorSaiuDaAgencia),
    [criadoresFiltrados]
  );

  const criadoresAtivosFiltrados = useMemo(
    () => criadoresFiltrados.filter((criador) => !criadorSaiuDaAgencia(criador)),
    [criadoresFiltrados]
  );

  const ITENS_POR_PAGINA = 20;
  const totalPaginasAtivos = Math.max(1, Math.ceil(criadoresAtivosFiltrados.length / ITENS_POR_PAGINA));
  const totalPaginasSaiu = Math.max(1, Math.ceil(criadoresSaiuFiltrados.length / ITENS_POR_PAGINA));
  const totalPaginasArquivados = Math.max(1, Math.ceil(criadoresArquivadosFiltrados.length / ITENS_POR_PAGINA));
  const criadoresAtivosPaginados = criadoresAtivosFiltrados.slice(
    (paginaCriadoresAtivos - 1) * ITENS_POR_PAGINA,
    paginaCriadoresAtivos * ITENS_POR_PAGINA
  );
  const criadoresSaiuPaginados = criadoresSaiuFiltrados.slice(
    (paginaCriadoresSaiu - 1) * ITENS_POR_PAGINA,
    paginaCriadoresSaiu * ITENS_POR_PAGINA
  );
  const criadoresArquivadosPaginados = criadoresArquivadosFiltrados.slice(
    (paginaCriadoresArquivados - 1) * ITENS_POR_PAGINA,
    paginaCriadoresArquivados * ITENS_POR_PAGINA
  );

  function renderPaginacaoCriadores(
    total: number,
    pagina: number,
    totalPaginas: number,
    setPagina: (pagina: number) => void
  ) {
    if (total <= ITENS_POR_PAGINA) return null;

    const primeiro = (pagina - 1) * ITENS_POR_PAGINA + 1;
    const ultimo = Math.min(pagina * ITENS_POR_PAGINA, total);

    return (
      <div className="flex flex-col gap-3 border-t border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          Exibindo <span className="font-semibold text-slate-200">{primeiro}–{ultimo}</span> de <span className="font-semibold text-slate-200">{formatarNumero(total)}</span> pessoas
        </p>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={() => setPagina(Math.max(1, pagina - 1))}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="whitespace-nowrap text-xs text-slate-400">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima →
          </button>
        </div>
      </div>
    );
  }

  function renderTabelaCriadores(
    lista: Resultado[],
    pagina: number,
    totalPaginas: number,
    setPagina: (pagina: number) => void,
    vazio: string
  ) {
    if (loadingResultados) {
      return (
        <div className="p-10 text-center">
          <div className="mb-3 animate-pulse text-3xl">⚡</div>
          <p className="text-slate-400">Carregando criadores...</p>
        </div>
      );
    }

    if (lista.length === 0) {
      return (
        <div className="p-10 text-center">
          <div className="mb-3 text-3xl">📊</div>
          <p className="font-semibold text-slate-300">{vazio}</p>
          <p className="mt-1 text-sm text-slate-500">Tente mudar a busca ou importe outro relatório.</p>
        </div>
      );
    }

    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-4">
                  <label className="flex items-center gap-2 whitespace-nowrap normal-case tracking-normal">
                    <input
                      type="checkbox"
                      aria-label="Selecionar todos os criadores desta página"
                      checked={lista.length > 0 && lista.every((resultado) => selecionadosCriadores.includes(chaveCriador(resultado)))}
                      onChange={() => alternarSelecaoDaPagina(lista)}
                      className="h-4 w-4 cursor-pointer accent-purple-500"
                    />
                    Página
                  </label>
                </th>
                <th className="px-6 py-4">Criador</th>
                <th className="px-6 py-4">ID do criador</th>
                <th className="px-6 py-4">Diamantes</th>
                <th className="px-6 py-4">Seguidores</th>
                <th className="px-6 py-4">Batalhas</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((resultado) => {
                const nome = obterNomeExibicaoCriador(resultado);
                const username = obterUsernameDoRegistroCriador(resultado);
                const status = obterStatusCriador(resultado);
                const rowKey = chaveCriador(resultado);
                const selecionado = selecionadosCriadores.includes(rowKey);
                const saiu = criadorSaiuDaAgencia(resultado);

                return (
                  <tr key={rowKey} className="border-b border-slate-800/70 transition hover:bg-slate-900/50">
                    <td className="px-4 py-5">
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${nome}`}
                        checked={selecionado}
                        onChange={() => alternarSelecaoCriador(rowKey)}
                        className="h-4 w-4 cursor-pointer accent-purple-500"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${saiu ? "bg-amber-500/10" : "bg-blue-500/10"}`}>{saiu ? "↗" : "👤"}</div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">{nome}</p>
                          {username && normalizarTexto(username) !== normalizarTexto(nome) && (
                            <p className="mt-1 text-xs text-slate-500">@{username}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-300">{resultado.criador_id || "—"}</td>
                    <td className="px-6 py-5"><span className="font-bold text-purple-400">{formatarNumero(resultado.diamantes)}</span></td>
                    <td className="px-6 py-5"><span className="font-semibold text-green-400">+{formatarNumero(resultado.novos_seguidores)}</span></td>
                    <td className="px-6 py-5 text-sm text-slate-300">{formatarNumero(resultado.batalhas)}</td>
                    <td className="px-6 py-5">
                      {status ? (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${saiu ? "bg-amber-500/10 text-amber-300" : "bg-green-500/10 text-green-400"}`}>{status}</span>
                      ) : (
                        <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-400">Importado</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => setResultadoSelecionado(resultado)} className="rounded-xl bg-blue-600/20 px-4 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-600 hover:text-white">
                        Ver detalhes →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {renderPaginacaoCriadores(lista.length, pagina, totalPaginas, setPagina)}
      </>
    );
  }

  function alternarSelecaoCriador(creatorKey: string) {
    setSelecionadosCriadores((atuais) =>
      atuais.includes(creatorKey)
        ? atuais.filter((key) => key !== creatorKey)
        : [...atuais, creatorKey]
    );
  }

  function alternarSelecaoDaPagina(lista: Resultado[]) {
    const chavesDaPagina = lista.map(chaveCriador);
    if (!chavesDaPagina.length) return;

    const todasSelecionadas = chavesDaPagina.every((key) =>
      selecionadosCriadores.includes(key)
    );

    setSelecionadosCriadores((atuais) => {
      if (todasSelecionadas) {
        return atuais.filter((key) => !chavesDaPagina.includes(key));
      }
      return Array.from(new Set([...atuais, ...chavesDaPagina]));
    });
  }

  async function arquivarSelecionados() {
    if (!selecionadosCriadores.length) return;
    const confirmar = window.confirm(
      `Remover ${selecionadosCriadores.length} criador(es) da lista ativa? Os dados serão arquivados e continuarão no Supabase para poderem ser restaurados.`
    );
    if (!confirmar) return;

    const agoraIso = new Date().toISOString();
    const { error } = await supabase
      .from("criador_gestao")
      .update({
        archived_at: agoraIso,
        manual_archived: true,
        archive_reason: "manual",
        updated_at: agoraIso,
      })
      .in("creator_key", selecionadosCriadores);

    if (error) {
      setErro(`Não consegui arquivar os criadores: ${error.message}`);
      return;
    }

    setMensagem(`${selecionadosCriadores.length} criador(es) arquivado(s). Os dados foram preservados.`);
    setSelecionadosCriadores([]);
    await carregarGestaoCriadores();
  }

  async function reativarSelecionados() {
    const chavesArquivadas = selecionadosCriadores.filter((key) =>
      gestaoCriadores.some((item) => item.creator_key === key && Boolean(item.archived_at))
    );

    if (!chavesArquivadas.length) {
      setErro("Selecione pelo menos um criador na tabela 'Criadores arquivados' para reativá-lo.");
      return;
    }

    const agoraIso = new Date().toISOString();
    const atualizacoes = chavesArquivadas.map((key) => {
      const criador = obterCriadorPorChave(key);
      const gestaoAnterior = obterGestaoDoCriador(key);
      const ativoNoUltimoRelatorio = criador ? criadorTemAtividade(criador) : false;
      const periodo = criador ? obterPeriodoRelatorio(criador) : null;

      return {
        creator_key: key,
        streamer_id: criador?.streamer_id || gestaoAnterior?.streamer_id || "",
        criador_id: criador?.criador_id || gestaoAnterior?.criador_id || "",
        inactive_since: ativoNoUltimoRelatorio ? null : agoraIso,
        last_active_at: ativoNoUltimoRelatorio
          ? (periodo?.fim.toISOString() || agoraIso)
          : (gestaoAnterior?.last_active_at || null),
        archived_at: null,
        manual_archived: false,
        archive_reason: null,
        updated_at: agoraIso,
      };
    });

    const { error } = await supabase
      .from("criador_gestao")
      .upsert(atualizacoes, { onConflict: "creator_key" });

    if (error) {
      setErro(`Não consegui reativar os criadores: ${error.message}`);
      return;
    }

    setMensagem(`${chavesArquivadas.length} criador(es) reativado(s). Os registros e resultados foram preservados.`);
    setSelecionadosCriadores((atuais) => atuais.filter((key) => !chavesArquivadas.includes(key)));
    await carregarGestaoCriadores();
  }

  async function excluirSelecionadosDefinitivamente() {
    const selecionados = resultados.filter((resultado) =>
      selecionadosCriadores.includes(chaveCriador(resultado))
    );
    if (!selecionados.length) return;

    const senha = window.prompt("Para excluir definitivamente, digite a senha administrativa:");
    if (senha !== ADMIN_GROUP_PASSWORD) {
      if (senha !== null) setErro("Senha administrativa incorreta.");
      return;
    }

    const confirmar = window.confirm(
      `ATENÇÃO: isso apagará definitivamente ${selecionados.length} registro(s) da tabela resultados_streamers e dos grupos. Essa ação não pode ser desfeita. Deseja continuar?`
    );
    if (!confirmar) return;

    setErro("");
    try {
      const keys = selecionados.map(chaveCriador);
      for (const grupo of grupos) {
        const membrosRestantes = grupo.memberIds.filter((key) => !keys.includes(key));
        if (membrosRestantes.length < 2) {
          const { error: groupDeleteError } = await supabase
            .from("criador_grupos")
            .delete()
            .eq("id", grupo.id);
          if (groupDeleteError) throw new Error(groupDeleteError.message);
        } else if (keys.includes(grupo.streamer_principal_id)) {
          const { error: principalError } = await supabase
            .from("criador_grupos")
            .update({ principal_creator_key: membrosRestantes[0] })
            .eq("id", grupo.id);
          if (principalError) throw new Error(principalError.message);
        }
      }

      const { error: memberError } = await supabase
        .from("criador_grupo_membros")
        .delete()
        .in("creator_key", keys);
      if (memberError) throw new Error(memberError.message);

      for (const resultado of selecionados) {
        const { error: resultDeleteError } = await supabase
          .from("resultados_streamers")
          .delete()
          .eq("streamer_id", resultado.streamer_id)
          .eq("criador_id", resultado.criador_id);
        if (resultDeleteError) throw new Error(resultDeleteError.message);
      }

      const { error: managementError } = await supabase
        .from("criador_gestao")
        .delete()
        .in("creator_key", keys);
      if (managementError) throw new Error(managementError.message);

      setMensagem(`${selecionados.length} registro(s) excluído(s) definitivamente.`);
      setSelecionadosCriadores([]);
      await carregarResultados();
      await carregarGestaoCriadores();
      await carregarGrupos();
    } catch (error: any) {
      setErro(`Erro durante a exclusão: ${error?.message || "erro desconhecido"}`);
    }
  }

  const rankingCriadores = useMemo(() => {
    return criadoresVisiveis.slice(0, 5).map((resultado) => ({
      resultado,
      nome: obterNomeExibicaoCriador(resultado),
      diamantes: Number(resultado.diamantes) || 0,
      seguidores: Number(resultado.novos_seguidores) || 0,
      batalhas: Number(resultado.batalhas) || 0,
    }));
  }, [criadoresVisiveis]);

  /*
   * ============================================================
   * AGRUPAMENTO
   * ============================================================
   */

  function abrirNovoGrupo() {
    setGrupoSelecionado(null);
    setNomeGrupo("");
    setPrincipalSelecionado("");
    setMembrosSelecionados([]);
    setBuscaAgrupamento("");
    setPaginaListaAgrupamento(1);
    setBuscaContaPrincipal("");
    setPrincipalDropdownAberto(false);
    setPaginaContaPrincipal(1);
    setSenhaAgrupamento("");
    setErro("");
    setMostrarAgrupamento(true);
  }

  function abrirEditarGrupo(grupo: StreamerGroup) {
    setGrupoSelecionado(grupo);
    setNomeGrupo(grupo.nome);
    setPrincipalSelecionado(grupo.streamer_principal_id);
    setMembrosSelecionados(grupo.memberIds);
    setBuscaAgrupamento("");
    setPaginaListaAgrupamento(1);
    setBuscaContaPrincipal("");
    setPrincipalDropdownAberto(false);
    setPaginaContaPrincipal(1);
    setSenhaAgrupamento("");
    setErro("");
    setMostrarAgrupamento(true);
  }

  function alternarMembro(creatorKey: string) {
    setMembrosSelecionados((atuais) =>
      atuais.includes(creatorKey)
        ? atuais.filter((key) => key !== creatorKey)
        : [...atuais, creatorKey]
    );
  }

  async function salvarGrupo() {
    setErro("");
    setMensagem("");

    if (senhaAgrupamento !== ADMIN_GROUP_PASSWORD) {
      setErro("Senha administrativa incorreta.");
      return;
    }
    if (!nomeGrupo.trim()) {
      setErro("Digite um nome para o grupo.");
      return;
    }
    if (!principalSelecionado) {
      setErro("Selecione o criador principal.");
      return;
    }

    const chavesMembros = Array.from(new Set([principalSelecionado, ...membrosSelecionados]));
    if (chavesMembros.length < 2) {
      setErro("Selecione pelo menos dois criadores para criar um agrupamento.");
      return;
    }

    const criadoresValidos = new Set(resultados.map(chaveCriador));
    if (chavesMembros.some((key) => !criadoresValidos.has(key))) {
      setErro("Um dos criadores selecionados não está mais na lista importada. Atualize o painel e tente novamente.");
      return;
    }

    setAgrupando(true);
    try {
      let groupId = grupoSelecionado?.id;

      if (grupoSelecionado) {
        const { error: updateError } = await supabase
          .from("criador_grupos")
          .update({
            nome: nomeGrupo.trim(),
            principal_creator_key: principalSelecionado,
          })
          .eq("id", grupoSelecionado.id);
        if (updateError) throw new Error(`Erro ao atualizar grupo: ${updateError.message}`);

        const { error: removeMembersError } = await supabase
          .from("criador_grupo_membros")
          .delete()
          .eq("group_id", grupoSelecionado.id);
        if (removeMembersError) throw new Error(`Erro ao atualizar membros: ${removeMembersError.message}`);
      } else {
        const { data: novoGrupo, error: createError } = await supabase
          .from("criador_grupos")
          .insert({
            nome: nomeGrupo.trim(),
            principal_creator_key: principalSelecionado,
          })
          .select("id")
          .single();
        if (createError) throw new Error(`Erro ao criar grupo: ${createError.message}`);
        groupId = novoGrupo.id;
      }

      if (!groupId) throw new Error("Não foi possível identificar o grupo.");

      // Cada criador só pode pertencer a um grupo. Ao transferir membros,
      // corrigimos o antigo principal ou removemos grupos que ficariam vazios.
      for (const grupoAntigo of grupos) {
        if (grupoAntigo.id === groupId) continue;
        const membrosRestantes = grupoAntigo.memberIds.filter((key) => !chavesMembros.includes(key));
        const algumSelecionadoEstavaNoGrupo = grupoAntigo.memberIds.some((key) => chavesMembros.includes(key));
        if (!algumSelecionadoEstavaNoGrupo) continue;

        if (membrosRestantes.length < 2) {
          const { error: apagarGrupoVazioError } = await supabase
            .from("criador_grupos")
            .delete()
            .eq("id", grupoAntigo.id);
          if (apagarGrupoVazioError) throw new Error(apagarGrupoVazioError.message);
        } else if (chavesMembros.includes(grupoAntigo.streamer_principal_id)) {
          const { error: atualizarPrincipalError } = await supabase
            .from("criador_grupos")
            .update({ principal_creator_key: membrosRestantes[0] })
            .eq("id", grupoAntigo.id);
          if (atualizarPrincipalError) throw new Error(atualizarPrincipalError.message);
        }
      }

      const { error: removerDeOutrosGruposError } = await supabase
        .from("criador_grupo_membros")
        .delete()
        .in("creator_key", chavesMembros);
      if (removerDeOutrosGruposError) {
        throw new Error(`Erro ao reorganizar membros: ${removerDeOutrosGruposError.message}`);
      }

      const registros = chavesMembros.map((key) => {
        const criador = obterCriadorPorChave(key)!;
        return {
          group_id: groupId,
          creator_key: key,
          streamer_id: criador.streamer_id,
          criador_id: criador.criador_id,
          nome_criador: obterNomeExibicaoCriador(criador),
          username_tiktok: obterUsernameDoRegistroCriador(criador) || null,
        };
      });

      const { error: membersError } = await supabase
        .from("criador_grupo_membros")
        .insert(registros);
      if (membersError) throw new Error(`Erro ao adicionar criadores ao grupo: ${membersError.message}`);

      await carregarGrupos();
      setMensagem(grupoSelecionado ? "Grupo de criadores atualizado com sucesso!" : "Grupo de criadores criado com sucesso!");
      setMostrarAgrupamento(false);
    } catch (error: any) {
      console.error("Erro no agrupamento de criadores:", error);
      setErro(error?.message || "Não foi possível salvar o agrupamento.");
    } finally {
      setAgrupando(false);
    }
  }

  async function excluirGrupo(grupo: StreamerGroup) {
    const senha = window.prompt("Digite a senha administrativa para excluir este grupo:");
    if (senha !== ADMIN_GROUP_PASSWORD) {
      if (senha !== null) setErro("Senha administrativa incorreta.");
      return;
    }

    const confirmar = window.confirm(`Excluir o grupo "${grupo.nome}"? Os criadores e seus resultados NÃO serão apagados.`);
    if (!confirmar) return;

    const { error } = await supabase
      .from("criador_grupos")
      .delete()
      .eq("id", grupo.id);

    if (error) {
      setErro(`Erro ao excluir grupo: ${error.message}`);
      return;
    }

    setMensagem("Grupo excluído. Os criadores continuam cadastrados normalmente.");
    await carregarGrupos();
  }

  /*
   * ============================================================
   * TELA DE VERIFICAÇÃO
   * ============================================================
   */

  if (
    verificando
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="text-center">
          <div className="mb-4 animate-pulse text-5xl">
            ⚡
          </div>

          <p className="text-slate-300">
            Verificando acesso...
          </p>
        </div>
      </main>
    );
  }

  // O carregamento do Supabase já percorre todos os lotes de 1.000 linhas.
  // Esta paginação de interface organiza a escolha de criadores em grupos de 20.
  const termoPrincipal = normalizarTexto(buscaContaPrincipal).replace(/^@+/, "");
  const criadoresPrincipaisFiltrados = criadoresVisiveis.filter((criador) => {
    if (!termoPrincipal) return true;
    return [
      obterNomeExibicaoCriador(criador),
      obterUsernameDoRegistroCriador(criador),
      criador.criador_id,
      criador.grupo,
      criador.agente,
    ].some((valor) => normalizarTexto(valor).replace(/^@+/, "").includes(termoPrincipal));
  });
  const totalPaginasPrincipal = Math.max(1, Math.ceil(criadoresPrincipaisFiltrados.length / ITENS_POR_PAGINA));
  const criadoresPrincipaisPaginados = criadoresPrincipaisFiltrados.slice(
    (paginaContaPrincipal - 1) * ITENS_POR_PAGINA,
    paginaContaPrincipal * ITENS_POR_PAGINA
  );
  const termoMembrosAgrupamento = normalizarTexto(buscaAgrupamento).replace(/^@+/, "");
  const criadoresMembrosFiltrados = criadoresVisiveis.filter((criador) => {
    if (!termoMembrosAgrupamento) return true;
    return [
      obterNomeExibicaoCriador(criador),
      obterUsernameDoRegistroCriador(criador),
      criador.criador_id,
      criador.grupo,
      criador.agente,
    ].some((valor) => normalizarTexto(valor).replace(/^@+/, "").includes(termoMembrosAgrupamento));
  });
  const totalPaginasMembrosAgrupamento = Math.max(1, Math.ceil(criadoresMembrosFiltrados.length / ITENS_POR_PAGINA));
  const criadoresMembrosPaginados = criadoresMembrosFiltrados.slice(
    (paginaListaAgrupamento - 1) * ITENS_POR_PAGINA,
    paginaListaAgrupamento * ITENS_POR_PAGINA
  );

  /*
   * ============================================================
   * PÁGINA
   * ============================================================
   */

  return (
    <main className="min-h-screen bg-[#020617] text-white">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#020617]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <Logo size={20} />
            </div>

            <div>
              <h1 className="text-lg font-bold">
                Trovão Azul
              </h1>

              <p className="text-xs text-blue-400">
                Painel Administrativo
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={
                carregarTudo
              }
              disabled={
                loading
              }
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
            >
              {loading
                ? "Atualizando..."
                : "↻ Atualizar"}
            </button>

            <button
              onClick={() =>
                router.push(
                  "/dashboard"
                )
              }
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Voltar
            </button>

          </div>

        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-6">

        {/* HERO */}

        <div className="mb-8 overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 via-[#0f172a] to-purple-600/10 p-7">

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">

            <div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                Administração
              </p>

              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Dashboard ADM
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Visão geral da agência, desempenho de todos os criadores,
                resultados importados e contas agrupadas.
              </p>

            </div>

            <div className="rounded-2xl border border-slate-700/80 bg-slate-950/50 px-5 py-4">

              <p className="text-xs text-slate-500">
                Última atualização
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-200">
                {ultimaAtualizacao}
              </p>

            </div>

          </div>

        </div>

        {/* CARDS PRINCIPAIS */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            icon="👥"
            title="Criadores"
            value={formatarNumero(
              criadoresVisiveis.length
            )}
            subtitle="Total importado"
            accent="blue"
          />

          <MetricCard
            icon="💎"
            title="Diamantes"
            value={formatarNumero(
              totalDiamantes
            )}
            subtitle="Total registrado"
            accent="purple"
          />

          <MetricCard
            icon="👤"
            title="Novos seguidores"
            value={formatarNumero(
              totalSeguidores
            )}
            subtitle="Total registrado"
            accent="green"
          />

          <MetricCard
            icon="⚔️"
            title="Batalhas"
            value={formatarNumero(
              totalBatalhas
            )}
            subtitle={`${formatarNumero(
              totalTransmissoes
            )} transmissões`}
            accent="orange"
          />

        </div>

        {/* COMPARAÇÃO */}

        <div className="mb-8 rounded-3xl border border-slate-800 bg-[#0b1224] p-6">

          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Performance
              </p>

              <h3 className="mt-1 text-2xl font-bold">
                Comparação com o mês anterior
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Acompanhe a evolução dos
                principais indicadores.
              </p>

            </div>

            <select
              value={
                periodo
              }
              onChange={(
                event
              ) =>
                setPeriodo(
                  event.target
                    .value as
                    | "6"
                    | "12"
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="6">
                Últimos 6 meses
              </option>

              <option value="12">
                Últimos 12 meses
              </option>
            </select>

          </div>

          <div className="grid gap-4 md:grid-cols-3">

            <ComparisonCard
              title="💎 Diamantes"
              current={
                mesAtual?.diamantes ||
                0
              }
              previous={
                mesAnterior?.diamantes ||
                0
              }
              variation={calcularVariacao(
                mesAtual?.diamantes ||
                  0,
                mesAnterior?.diamantes ||
                  0
              )}
            />

            <ComparisonCard
              title="👤 Seguidores"
              current={
                mesAtual?.seguidores ||
                0
              }
              previous={
                mesAnterior?.seguidores ||
                0
              }
              variation={calcularVariacao(
                mesAtual?.seguidores ||
                  0,
                mesAnterior?.seguidores ||
                  0
              )}
            />

            <ComparisonCard
              title="⚔️ Batalhas"
              current={
                mesAtual?.batalhas ||
                0
              }
              previous={
                mesAnterior?.batalhas ||
                0
              }
              variation={calcularVariacao(
                mesAtual?.batalhas ||
                  0,
                mesAnterior?.batalhas ||
                  0
              )}
            />

          </div>

          {/* GRÁFICO */}

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h4 className="font-bold">
                  Evolução de diamantes
                </h4>

                <p className="text-xs capitalize text-slate-500">
                  {mesAtual?.fullLabel ||
                    "Carregando período..."}
                </p>

              </div>

              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400">
                💎 Total
              </span>

            </div>

            <div className="flex h-64 items-end gap-2 overflow-x-auto pb-2">

              {dadosMensais.map(
                (item) => {

                  const altura =
                    Math.max(
                      (item.diamantes /
                        maxDiamantes) *
                        100,
                      item.diamantes
                        ? 5
                        : 1
                    );

                  return (
                    <div
                      key={
                        item.fullLabel
                      }
                      className="flex min-w-[48px] flex-1 flex-col items-center justify-end gap-2"
                    >

                      <span className="text-[10px] font-semibold text-slate-400">
                        {item.diamantes
                          ? formatarNumero(
                              item.diamantes
                            )
                          : "0"}
                      </span>

                      <div className="flex h-44 w-full items-end justify-center">

                        <div
                          title={`${item.fullLabel}: ${formatarNumero(
                            item.diamantes
                          )} diamantes`}
                          className="w-full max-w-[52px] rounded-t-xl bg-gradient-to-t from-blue-700 to-purple-500 transition-all duration-700 hover:from-blue-500 hover:to-purple-400"
                          style={{
                            height: `${altura}%`,
                          }}
                        />

                      </div>

                      <span className="text-[10px] font-bold text-slate-500">
                        {item.label}
                      </span>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>

        {/* RANKING DE CRIADORES */}

        <div className="mb-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">

          <div className="rounded-3xl border border-slate-800 bg-[#0b1224] p-6">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Ranking
                </p>
                <h3 className="mt-1 text-2xl font-bold">
                  Desempenho dos criadores
                </h3>
              </div>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
                Top {Math.min(criadoresVisiveis.length, 5)}
              </span>
            </div>

            <div className="space-y-3">
              {rankingCriadores.map((item, index) => {
                const maior = rankingCriadores[0]?.diamantes || 1;
                const largura = (item.diamantes / maior) * 100;

                return (
                  <div
                    key={item.resultado.id ?? `${item.resultado.streamer_id}-${item.resultado.criador_id}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold">{item.nome}</p>
                          <p className="text-[11px] text-slate-500">
                            ID: {item.resultado.criador_id || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-400">
                          {formatarNumero(item.diamantes)}
                        </p>
                        <p className="text-[11px] text-slate-500">diamantes</p>
                      </div>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-700"
                        style={{ width: `${Math.max(largura, item.diamantes ? 3 : 0)}%` }}
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                      <span>+ {formatarNumero(item.seguidores)} seguidores</span>
                      <span>⚔️ {formatarNumero(item.batalhas)}</span>
                    </div>
                  </div>
                );
              })}

              {rankingCriadores.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                  Nenhum criador importado ainda.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#0b1224] p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400">
              Resumo
            </p>
            <h3 className="mt-1 text-2xl font-bold">Visão da agência</h3>

            <div className="mt-6 space-y-4">
              <SummaryRow
                label="Criadores"
                value={criadoresVisiveis.length}
                icon="👤"
              />
              <SummaryRow
                label="Grupos de criadores"
                value={grupos.length}
                icon="🔗"
              />
              <SummaryRow
                label="Transmissões"
                value={totalTransmissoes}
                icon="📡"
              />
              <SummaryRow
                label="Batalhas"
                value={totalBatalhas}
                icon="⚔️"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
              <p className="text-xs text-slate-500">Criador com mais diamantes</p>
              {rankingCriadores[0] ? (
                <>
                  <p className="mt-1 text-lg font-bold">
                    {rankingCriadores[0].nome}
                  </p>
                  <p className="mt-1 text-sm text-purple-400">
                    💎 {formatarNumero(rankingCriadores[0].diamantes)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-slate-500">Sem dados</p>
              )}
            </div>
          </div>
        </div>

        {/* AGRUPAMENTO */}

        <div className="mb-8 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-[#0b1224] to-blue-500/5">

          <div className="flex flex-col justify-between gap-5 border-b border-slate-800 p-6 md:flex-row md:items-center">

            <div>

              <p className="text-xs font-bold uppercase tracking-widest text-purple-400">
                Gestão de contas
              </p>

              <h3 className="mt-1 text-2xl font-bold">
                🔗 Agrupamento de criadores
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
                Agrupe os criadores importados que pertencem à mesma pessoa. A lista usa todos os registros do relatório, não apenas as contas cadastradas para login.
              </p>

            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAgrupamentoExpandido((aberto) => !aberto)}
                aria-expanded={agrupamentoExpandido}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                {agrupamentoExpandido ? "Recolher gaveta ⌃" : "Abrir gaveta ⌄"}
              </button>

              <button
                onClick={abrirNovoGrupo}
                className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold transition hover:bg-purple-500"
              >
                + Agrupar criadores
              </button>
            </div>

          </div>

          {agrupamentoExpandido && (
          <div className="p-6">

            {grupos.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center">

                <div className="text-4xl">
                  🔗
                </div>

                <p className="mt-3 font-bold text-slate-300">
                  Nenhum criador agrupado ainda
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Use “Agrupar criadores” para reunir perfis do mesmo integrante. Todos os criadores importados aparecem na seleção.
                </p>

              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">

                {grupos.map(
                  (grupo) => {

                    const principal = obterCriadorPorChave(grupo.streamer_principal_id);
                    const membros = grupo.memberIds
                      .map((key) => obterCriadorPorChave(key))
                      .filter(Boolean) as Resultado[];
                    const dados = resultadosDoGrupo(grupo.streamer_principal_id);

                    const diamantes =
                      dados.reduce(
                        (
                          total,
                          item
                        ) =>
                          total +
                          (Number(
                            item.diamantes
                          ) || 0),
                        0
                      );

                    const seguidores =
                      dados.reduce(
                        (
                          total,
                          item
                        ) =>
                          total +
                          (Number(
                            item.novos_seguidores
                          ) || 0),
                        0
                      );

                    const batalhas =
                      dados.reduce(
                        (
                          total,
                          item
                        ) =>
                          total +
                          (Number(
                            item.batalhas
                          ) || 0),
                        0
                      );

                    return (
                      <div
                        key={
                          grupo.id
                        }
                        className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div>

                            <div className="flex items-center gap-2">

                              <span className="rounded-lg bg-purple-500/10 px-2 py-1 text-xs font-bold text-purple-400">
                                GRUPO
                              </span>

                              <span className="text-xs text-slate-600">
                                {
                                  membros.length
                                }{" "}
                                criadores
                              </span>

                            </div>

                            <h4 className="mt-3 text-xl font-bold">
                              {
                                grupo.nome
                              }
                            </h4>

                            <p className="mt-1 text-xs text-slate-500">
                              Principal:{" "}
                              {principal
                                ? (obterUsernameDoRegistroCriador(principal)
                                    ? `@${obterUsernameDoRegistroCriador(principal)}`
                                    : obterNomeExibicaoCriador(principal))
                                : "—"}
                            </p>

                          </div>

                          <div className="text-right">

                            <p className="text-xs text-slate-500">
                              Consolidado
                            </p>

                            <p className="mt-1 font-bold text-purple-400">
                              💎{" "}
                              {formatarNumero(
                                diamantes
                              )}
                            </p>

                          </div>

                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-2">

                          <MiniStat
                            label="Seguidores"
                            value={formatarNumero(
                              seguidores
                            )}
                          />

                          <MiniStat
                            label="Batalhas"
                            value={formatarNumero(
                              batalhas
                            )}
                          />

                          <MiniStat
                            label="Relatórios"
                            value={formatarNumero(
                              dados.length
                            )}
                          />

                        </div>

                        <div className="mt-5 space-y-2">

                          {membros.map(
                            (
                              membro
                            ) => (
                              <div
                                key={
                                  chaveCriador(membro)
                                }
                                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2.5"
                              >

                                <div className="flex items-center gap-2">

                                  <span className="text-sm">
                                    👤
                                  </span>

                                  <span className="text-sm font-semibold">
                                    {obterUsernameDoRegistroCriador(membro)
                                      ? `@${obterUsernameDoRegistroCriador(membro)}`
                                      : obterNomeExibicaoCriador(membro)}
                                  </span>

                                </div>

                                {chaveCriador(membro) ===
                                  grupo.streamer_principal_id && (
                                  <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-400">
                                    PRINCIPAL
                                  </span>
                                )}

                              </div>
                            )
                          )}

                        </div>

                        <div className="mt-4 flex gap-2">

                          <button
                            onClick={() =>
                              abrirEditarGrupo(
                                grupo
                              )
                            }
                            className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                          >
                            Editar grupo
                          </button>

                          <button
                            onClick={() =>
                              excluirGrupo(
                                grupo
                              )
                            }
                            className="rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                          >
                            Excluir
                          </button>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>
          )}

        </div>

        {/* IMPORTAÇÃO */}

        <div className="mb-8 overflow-hidden rounded-3xl border border-blue-500/20 bg-[#0b1224]">

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
                  Todos os criadores do relatório serão exibidos juntos nesta lista, com os indicadores importados.
                </p>

              </div>

            </div>

          </div>

          <div className="p-6">

            <label
              className={`flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
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

              <span className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500">
                Escolher arquivo
              </span>

              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                disabled={
                  importando
                }
                className="hidden"
                onChange={(
                  event
                ) => {

                  const file =
                    event.target
                      .files?.[0];

                  if (!file) {
                    return;
                  }

                  processarArquivo(
                    file
                  );

                  event.target.value =
                    "";
                }}
              />

            </label>

            {arquivo && (
              <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4">

                <p className="text-xs text-slate-500">
                  Arquivo selecionado
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <span>
                    📄
                  </span>

                  <span className="text-sm font-semibold text-white">
                    {
                      arquivo.name
                    }
                  </span>

                </div>

              </div>
            )}

            {mensagem && (
              <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4">

                <p className="text-sm font-semibold text-green-400">
                  ✓{" "}
                  {mensagem}
                </p>

              </div>
            )}

            {erro && (
              <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-4">

                <p className="text-sm font-semibold text-red-400">
                  ✕{" "}
                  {erro}
                </p>

              </div>
            )}

            <p className="mt-4 text-xs text-slate-500">
              Os dados importados continuam armazenados no Supabase.
            </p>

          </div>

        </div>

        {/* CONTROLE MANUAL / INATIVIDADE */}
        <div className="mb-8 rounded-3xl border border-slate-800 bg-[#0b1224] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-lg font-bold">🧹 Organização e inatividade</h3>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                Criadores sem diamantes, duração de live, dias válidos e transmissões por 30 dias são arquivados automaticamente. O arquivamento os tira dos totais, mas preserva os registros e permite restaurar.
              </p>
              <p className="mt-1 text-xs text-slate-500">Selecionados: {selecionadosCriadores.length}. A exclusão definitiva apaga dados do relatório; use com cuidado.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={!selecionadosCriadores.length} onClick={arquivarSelecionados} className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40">
                Arquivar selecionados
              </button>
              <button type="button" disabled={!selecionadosCriadores.length} onClick={reativarSelecionados} className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-40">
                Reativar selecionados
              </button>
              <button type="button" disabled={!selecionadosCriadores.length} onClick={excluirSelecionadosDefinitivamente} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40">
                Excluir definitivamente
              </button>
            </div>
          </div>
        </div>

        {/* PESQUISA GLOBAL DAS TRÊS GAVETAS */}
        <div className="mb-4 rounded-2xl border border-slate-800 bg-[#0b1224] p-5">
          <label htmlFor="busca-criadores-listas" className="mb-2 block text-sm font-semibold text-slate-200">
            🔎 Pesquisar nas listas de criadores
          </label>
          <input
            id="busca-criadores-listas"
            type="text"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Pesquisar por nome, usuário TikTok, ID ou status..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
          />
          <p className="mt-2 text-xs text-slate-500">
            A pesquisa filtra as três gavetas. Cada lista mostra 20 criadores por página.
          </p>
        </div>

        {/* CRIADORES ATIVOS / IMPORTADOS — GAVETA */}
        <div className="mb-4 overflow-hidden rounded-3xl border border-slate-800 bg-[#0b1224]">
          <button
            type="button"
            onClick={() => setCriadoresAtivosExpandido((aberto) => !aberto)}
            aria-expanded={criadoresAtivosExpandido}
            aria-controls="painel-criadores-ativos"
            className="w-full border-b border-slate-800 px-6 py-5 text-left transition hover:bg-slate-900/60"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold">👥 Criadores ativos / importados</h3>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                    {formatarNumero(criadoresAtivosFiltrados.length)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Criadores que não estão marcados como “Saiu”.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 sm:inline-flex">
                  20 por página
                </span>
                <span aria-hidden="true" className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-xl text-slate-300 transition ${criadoresAtivosExpandido ? "rotate-180 bg-blue-500/10" : ""}`}>
                  ⌄
                </span>
              </div>
            </div>
          </button>
          {criadoresAtivosExpandido && (
            <div id="painel-criadores-ativos">
              {renderTabelaCriadores(
                criadoresAtivosPaginados,
                paginaCriadoresAtivos,
                totalPaginasAtivos,
                setPaginaCriadoresAtivos,
                "Nenhum criador ativo/importado encontrado."
              )}
            </div>
          )}
        </div>

        {/* CRIADORES QUE SAÍRAM — GAVETA */}
        <div className="mb-4 overflow-hidden rounded-3xl border border-amber-500/20 bg-[#0b1224]">
          <button
            type="button"
            onClick={() => setCriadoresSaiuExpandido((aberto) => !aberto)}
            aria-expanded={criadoresSaiuExpandido}
            aria-controls="painel-criadores-sairam"
            className="w-full border-b border-slate-800 px-6 py-5 text-left transition hover:bg-slate-900/60"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold">↗ Criadores que saíram da agência</h3>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                    {formatarNumero(criadoresSaiuFiltrados.length)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Registros com status “Saiu”, separados para facilitar a organização.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 sm:inline-flex">
                  20 por página
                </span>
                <span aria-hidden="true" className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-xl text-slate-300 transition ${criadoresSaiuExpandido ? "rotate-180 bg-amber-500/10" : ""}`}>
                  ⌄
                </span>
              </div>
            </div>
          </button>
          {criadoresSaiuExpandido && (
            <div id="painel-criadores-sairam">
              {renderTabelaCriadores(
                criadoresSaiuPaginados,
                paginaCriadoresSaiu,
                totalPaginasSaiu,
                setPaginaCriadoresSaiu,
                "Nenhum criador marcado como saiu."
              )}
            </div>
          )}
        </div>

        {/* CRIADORES ARQUIVADOS — GAVETA */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-700 bg-[#0b1224]">
          <button
            type="button"
            onClick={() => setCriadoresArquivadosExpandido((aberto) => !aberto)}
            aria-expanded={criadoresArquivadosExpandido}
            aria-controls="painel-criadores-arquivados"
            className="w-full border-b border-slate-800 px-6 py-5 text-left transition hover:bg-slate-900/60"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold">📦 Criadores arquivados</h3>
                  <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-300">
                    {formatarNumero(criadoresArquivadosFiltrados.length)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  Arquivados automaticamente após 30 dias sem atividade ou por ação manual. Os registros podem ser restaurados.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 sm:inline-flex">
                  20 por página
                </span>
                <span aria-hidden="true" className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-xl text-slate-300 transition ${criadoresArquivadosExpandido ? "rotate-180 bg-slate-500/10" : ""}`}>
                  ⌄
                </span>
              </div>
            </div>
          </button>
          {criadoresArquivadosExpandido && (
            <div id="painel-criadores-arquivados">
              {renderTabelaCriadores(
                criadoresArquivadosPaginados,
                paginaCriadoresArquivados,
                totalPaginasArquivados,
                setPaginaCriadoresArquivados,
                "Nenhum criador arquivado."
              )}
            </div>
          )}
        </div>

      </section>

      {/* ========================================================
          MODAL DE AGRUPAMENTO
          ======================================================== */}

      {mostrarAgrupamento && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() =>
            setMostrarAgrupamento(
              false
            )
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-purple-500/20 bg-[#0b1224] shadow-2xl"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="border-b border-slate-800 p-6">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="text-xs font-bold uppercase tracking-widest text-purple-400">
                    Administração
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    🔗{" "}
                    {
                      grupoSelecionado
                        ? "Editar agrupamento"
                        : "Agrupar criadores"
                    }
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Selecione todos os perfis do mesmo integrante. A lista inclui os criadores importados do relatório, não apenas contas de login.
                  </p>

                </div>

                <button
                  onClick={() =>
                    setMostrarAgrupamento(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-700 px-3 py-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>

              </div>

            </div>

            <div className="space-y-6 p-6">

              {/* NOME */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Nome do grupo
                </label>

                <input
                  value={
                    nomeGrupo
                  }
                  onChange={(
                    event
                  ) =>
                    setNomeGrupo(
                      event.target
                        .value
                    )
                  }
                  placeholder="Ex.: João Silva"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-purple-500"
                />

              </div>

              {/* PRINCIPAL */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Criador principal
                </label>

                <div className="relative">
                  <input
                    value={buscaContaPrincipal}
                    onChange={(event) => {
                      setBuscaContaPrincipal(event.target.value);
                      setPaginaContaPrincipal(1);
                      setPrincipalDropdownAberto(true);
                    }}
                    onFocus={() => setPrincipalDropdownAberto(true)}
                    placeholder="Pesquisar conta principal por nome, @usuário ou ID..."
                    aria-label="Pesquisar criador principal"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-purple-500"
                  />

                  {buscaContaPrincipal && (
                    <button
                      type="button"
                      onClick={() => {
                        setBuscaContaPrincipal("");
                        setPaginaContaPrincipal(1);
                        setPrincipalDropdownAberto(true);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
                      aria-label="Limpar pesquisa do criador principal"
                    >
                      Limpar
                    </button>
                  )}

                  {principalDropdownAberto && (
                    <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-purple-500/30 bg-[#0b1224] shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                        <p className="text-xs text-slate-400">
                          {formatarNumero(criadoresPrincipaisFiltrados.length)} criador(es) encontrados · 20 por página
                        </p>
                        <button
                          type="button"
                          onClick={() => setPrincipalDropdownAberto(false)}
                          className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          Fechar
                        </button>
                      </div>

                      <div className="max-h-72 overflow-y-auto p-2">
                        {criadoresPrincipaisPaginados.length === 0 ? (
                          <p className="p-5 text-center text-sm text-slate-500">Nenhum criador encontrado. Tente outro nome ou ID.</p>
                        ) : (
                          criadoresPrincipaisPaginados.map((criador) => {
                            const key = chaveCriador(criador);
                            const username = obterUsernameDoRegistroCriador(criador);
                            const selecionado = principalSelecionado === key;
                            return (
                              <button
                                type="button"
                                key={key}
                                onClick={() => {
                                  setPrincipalSelecionado(key);
                                  setBuscaContaPrincipal("");
                                  setPrincipalDropdownAberto(false);
                                  setPaginaContaPrincipal(1);
                                  setMembrosSelecionados((atuais) => Array.from(new Set([...atuais, key])));
                                }}
                                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${selecionado ? "border-purple-500/50 bg-purple-500/10" : "border-transparent hover:border-slate-700 hover:bg-slate-900"}`}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-white">
                                    {username ? `@${username}` : obterNomeExibicaoCriador(criador)}
                                  </span>
                                  <span className="mt-1 block truncate text-xs text-slate-500">
                                    ID: {criador.criador_id} · 💎 {formatarNumero(criador.diamantes)}
                                  </span>
                                </span>
                                <span className="shrink-0 text-xs font-bold text-purple-300">
                                  {selecionado ? "✓ Selecionado" : "Escolher"}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {criadoresPrincipaisFiltrados.length > ITENS_POR_PAGINA && (
                        <div className="flex items-center justify-between border-t border-slate-800 px-3 py-3">
                          <button
                            type="button"
                            disabled={paginaContaPrincipal <= 1}
                            onClick={() => setPaginaContaPrincipal((pagina) => Math.max(1, pagina - 1))}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                          >
                            ← Anterior
                          </button>
                          <span className="text-xs text-slate-400">Página {paginaContaPrincipal} de {totalPaginasPrincipal}</span>
                          <button
                            type="button"
                            disabled={paginaContaPrincipal >= totalPaginasPrincipal}
                            onClick={() => setPaginaContaPrincipal((pagina) => Math.min(totalPaginasPrincipal, pagina + 1))}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                          >
                            Próxima →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">
                  <p className="text-xs text-purple-300">Conta principal selecionada</p>
                  {principalSelecionado && obterCriadorPorChave(principalSelecionado) ? (
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {(() => {
                            const principal = obterCriadorPorChave(principalSelecionado)!;
                            const username = obterUsernameDoRegistroCriador(principal);
                            return username ? `@${username}` : obterNomeExibicaoCriador(principal);
                          })()}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">ID: {obterCriadorPorChave(principalSelecionado)!.criador_id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPrincipalSelecionado("");
                          setMembrosSelecionados((atuais) => atuais.filter((key) => key !== principalSelecionado));
                          setPrincipalDropdownAberto(true);
                        }}
                        className="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                      >
                        Trocar
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">Nenhum criador principal selecionado. Pesquise e escolha um acima.</p>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Pesquise pelo nome, usuário TikTok ou ID. A lista tem páginas de 20 criadores e procura em todos os registros carregados.
                </p>

              </div>

              {/* CONTAS */}

              <div>

                <div className="mb-3 flex items-center justify-between">

                  <label className="text-sm font-semibold text-slate-300">
                    Criadores que pertencem ao grupo
                  </label>

                  <span className="text-xs text-slate-500">
                    {
                      membrosSelecionados.length
                    }{" "}
                    selecionada(s)
                  </span>

                </div>

                <input
                  value={buscaAgrupamento}
                  onChange={(event) => {
                    setBuscaAgrupamento(event.target.value);
                    setPaginaListaAgrupamento(1);
                  }}
                  placeholder="Pesquisar entre todos os criadores por nome, @usuário ou ID..."
                  className="mb-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-purple-500"
                />

                <p className="mb-3 text-xs text-slate-500">
                  {formatarNumero(criadoresMembrosFiltrados.length)} criador(es) encontrados · mostrando 20 por página
                </p>

                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">

                  {criadoresMembrosPaginados
                    .map((criador) => {
                      const creatorKey = chaveCriador(criador);
                      const username = obterUsernameDoRegistroCriador(criador);
                      const marcado = membrosSelecionados.includes(creatorKey) || principalSelecionado === creatorKey;
                      const outroGrupo = obterGrupoDoCriador(creatorKey);

                      return (
                        <button
                          type="button"
                          key={creatorKey}
                          onClick={() => alternarMembro(creatorKey)}
                          className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                            marcado
                              ? "border-purple-500/50 bg-purple-500/10"
                              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                          }`}
                        >

                          <div className="flex items-center gap-3">

                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                marcado
                                  ? "bg-purple-600"
                                  : "bg-slate-800"
                              }`}
                            >
                              {
                                marcado
                                  ? "✓"
                                  : "👤"
                              }
                            </div>

                            <div>

                              <p className="font-semibold">
                                {username ? `@${username}` : obterNomeExibicaoCriador(criador)}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                ID: {criador.criador_id} · 💎 {formatarNumero(criador.diamantes)}
                              </p>

                            </div>

                          </div>

                          <div className="text-right">

                            {
                              principalSelecionado ===
                                creatorKey && (

                                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-400">
                                  PRINCIPAL
                                </span>

                              )
                            }

                            {
                              (!principalSelecionado ||
                                principalSelecionado !==
                                  creatorKey) &&
                                outroGrupo &&
                                outroGrupo.id !==
                                  grupoSelecionado?.id && (

                                  <p className="mt-1 text-[10px] text-amber-400">
                                    Já está em{" "}
                                    {
                                      outroGrupo.nome
                                    }
                                  </p>

                                )
                            }

                          </div>

                        </button>

                      );
                    }
                  )}

                </div>

                {criadoresMembrosFiltrados.length > ITENS_POR_PAGINA && (
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                    <button
                      type="button"
                      disabled={paginaListaAgrupamento <= 1}
                      onClick={() => setPaginaListaAgrupamento((pagina) => Math.max(1, pagina - 1))}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                    >
                      ← Anterior
                    </button>
                    <span className="text-xs text-slate-400">Página {paginaListaAgrupamento} de {totalPaginasMembrosAgrupamento}</span>
                    <button
                      type="button"
                      disabled={paginaListaAgrupamento >= totalPaginasMembrosAgrupamento}
                      onClick={() => setPaginaListaAgrupamento((pagina) => Math.min(totalPaginasMembrosAgrupamento, pagina + 1))}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                    >
                      Próxima →
                    </button>
                  </div>
                )}

              </div>

              {/* SENHA */}

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">

                <div className="flex items-start gap-3">

                  <div className="text-xl">
                    🔐
                  </div>

                  <div className="flex-1">

                    <p className="font-bold text-amber-300">
                      Confirmação administrativa
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Digite a senha administrativa para
                      confirmar o agrupamento.
                    </p>

                    <input
                      type="password"
                      value={
                        senhaAgrupamento
                      }
                      onChange={(
                        event
                      ) =>
                        setSenhaAgrupamento(
                          event.target
                            .value
                        )
                      }
                      placeholder="Senha administrativa"
                      className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-500"
                    />

                  </div>

                </div>

              </div>

              {erro && (

                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
                  {
                    erro
                  }
                </div>

              )}

              <div className="flex gap-3">

                <button
                  onClick={() =>
                    setMostrarAgrupamento(
                      false
                    )
                  }
                  className="flex-1 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  onClick={
                    salvarGrupo
                  }
                  disabled={
                    agrupando
                  }
                  className="flex-1 rounded-xl bg-purple-600 px-5 py-3 font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {
                    agrupando
                      ? "Salvando..."
                      : grupoSelecionado
                      ? "Salvar alterações"
                      : "Criar agrupamento"
                  }
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ========================================================
          MODAL DE DETALHES
          ======================================================== */}

      {resultadoSelecionado && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() =>
            setResultadoSelecionado(
              null
            )
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-700 bg-[#0b1224] shadow-2xl"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0b1224]/95 px-6 py-5 backdrop-blur">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Detalhes do criador
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  {
                    obterNomeExibicaoCriador(resultadoSelecionado)
                  }
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  ID:{" "}
                  {
                    resultadoSelecionado.criador_id
                  }
                </p>

              </div>

              <button
                onClick={() =>
                  setResultadoSelecionado(
                    null
                  )
                }
                className="rounded-xl border border-slate-700 px-3 py-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>

            </div>

            <div className="space-y-6 p-6">

              {/* DESEMPENHO */}

              <div>

                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Desempenho
                </h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  <InfoCard
                    titulo="Diamantes"
                    valor={formatarNumero(
                      resultadoSelecionado.diamantes
                    )}
                    accent="purple"
                  />

                  <InfoCard
                    titulo="Novos seguidores"
                    valor={formatarNumero(
                      resultadoSelecionado.novos_seguidores
                    )}
                    accent="green"
                  />

                  <InfoCard
                    titulo="Batalhas"
                    valor={formatarNumero(
                      resultadoSelecionado.batalhas
                    )}
                    accent="blue"
                  />

                  <InfoCard
                    titulo="Transmissões"
                    valor={formatarNumero(
                      resultadoSelecionado.transmissoes
                    )}
                    accent="white"
                  />

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
                    titulo="Usuário TikTok"
                    valor={
                      obterUsernameDoRegistroCriador(
                        resultadoSelecionado
                      )
                        ? `@${obterUsernameDoRegistroCriador(
                            resultadoSelecionado
                          )}`
                        : "—"
                    }
                  />

                  <Info
                    titulo="Grupo"
                    valor={
                      obterGrupoDoResultado(
                        resultadoSelecionado
                      )?.nome
                    }
                  />

                  <Info
                    titulo="Grupo do relatório"
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
                      resultadoSelecionado.diamantes_batalhas
                    )}
                  />

                  <Info
                    titulo="Diamantes de convidados"
                    valor={formatarNumero(
                      resultadoSelecionado.diamantes_convidados
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

                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">

                    <table className="w-full min-w-[600px]">

                      <tbody>

                        {Object.entries(
                          resultadoSelecionado.dados_completos
                        ).map(
                          ([
                            chave,
                            valor,
                          ]) => (

                            <tr
                              key={
                                chave
                              }
                              className="border-b border-slate-800/70 last:border-0"
                            >

                              <td className="w-1/3 px-5 py-3 text-xs font-semibold text-slate-500">
                                {
                                  chave
                                }
                              </td>

                              <td className="px-5 py-3 text-sm text-slate-200">
                                {
                                  valor ===
                                    null ||
                                  valor ===
                                    undefined ||
                                  valor ===
                                    ""
                                    ? "—"
                                    : String(
                                        valor
                                      )
                                }
                              </td>

                            </tr>

                          )
                        )}

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

            <div className="border-t border-slate-800 px-6 py-4 text-right">

              <button
                onClick={() =>
                  setResultadoSelecionado(
                    null
                  )
                }
                className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
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
 * COMPONENTES
 * ============================================================
 */

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  accent,
}: {
  icon: string;
  title: string;
  value: string | number;
  subtitle: string;
  accent:
    | "blue"
    | "purple"
    | "green"
    | "orange";
}) {
  const accentClasses = {
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      glow: "border-blue-500/20",
    },

    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      glow: "border-purple-500/20",
    },

    green: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      glow: "border-green-500/20",
    },

    orange: {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      glow: "border-orange-500/20",
    },
  };

  const style =
    accentClasses[
      accent
    ];

  return (
    <div
      className={`group rounded-3xl border ${style.glow} bg-[#0b1224] p-5 transition duration-300 hover:-translate-y-1 hover:bg-[#0f172a]`}
    >

      <div className="flex items-start justify-between">

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style.bg} text-xl`}
        >
          {
            icon
          }
        </div>

        <span
          className={`text-xs font-bold ${style.text}`}
        >
          LIVE
        </span>

      </div>

      <p className="mt-5 text-sm text-slate-500">
        {
          title
        }
      </p>

      <p className="mt-1 text-3xl font-bold tracking-tight">
        {
          value
        }
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {
          subtitle
        }
      </p>

    </div>
  );
}

function ComparisonCard({
  title,
  current,
  previous,
  variation,
}: {
  title: string;
  current: number;
  previous: number;
  variation: number;
}) {
  const positivo =
    variation >= 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-sm font-semibold text-slate-300">
            {
              title
            }
          </p>

          <p className="mt-3 text-3xl font-bold">
            {
              new Intl.NumberFormat(
                "pt-BR"
              ).format(
                current
              )
            }
          </p>

        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            positivo
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {
            positivo
              ? "↑"
              : "↓"
          }{" "}
          {
            Math.abs(
              variation
            ).toFixed(1)
          }
          %
        </span>

      </div>

      <div className="mt-4 flex items-center justify-between text-xs">

        <span className="text-slate-500">
          Mês anterior
        </span>

        <span className="font-semibold text-slate-300">
          {
            new Intl.NumberFormat(
              "pt-BR"
            ).format(
              previous
            )
          }
        </span>

      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">

        <div
          className={`h-full rounded-full ${
            positivo
              ? "bg-green-500"
              : "bg-red-500"
          }`}
          style={{
            width: `${Math.min(
              Math.max(
                Math.abs(
                  variation
                ),
                3
              ),
              100
            )}%`,
          }}
        />

      </div>

    </div>
  );
}

function SummaryRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">

      <div className="flex items-center gap-3">

        <span className="text-lg">
          {
            icon
          }
        </span>

        <span className="text-sm text-slate-400">
          {
            label
          }
        </span>

      </div>

      <span className="font-bold">
        {
          new Intl.NumberFormat(
            "pt-BR"
          ).format(
            value
          )
        }
      </span>

    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">

      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {
          label
        }
      </p>

      <p className="mt-1 text-sm font-bold text-slate-200">
        {
          value
        }
      </p>

    </div>
  );
}

function InfoCard({
  titulo,
  valor,
  accent,
}: {
  titulo: string;
  valor: string;
  accent:
    | "purple"
    | "green"
    | "blue"
    | "white";
}) {
  const classes = {
    purple:
      "text-purple-400",

    green:
      "text-green-400",

    blue:
      "text-blue-400",

    white:
      "text-white",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">

      <p className="text-xs text-slate-500">
        {
          titulo
        }
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${classes[accent]}`}
      >
        {
          valor
        }
      </p>

    </div>
  );
}

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">

      <p className="text-xs font-medium text-slate-500">
        {
          titulo
        }
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-200">

        {
          valor ===
            null ||
          valor ===
            undefined ||
          valor ===
            ""
            ? "—"
            : String(
                valor
              )
        }

      </p>

    </div>
  );
}