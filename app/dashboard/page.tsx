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

export default function DashboardPage() {
  const router = useRouter();

  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontSize: "18px",
          }}
        >
          Carregando seu painel...
        </div>
      </main>
    );
  }

  if (error || !streamer) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "16px",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "28px",
            }}
          >
            Perfil não encontrado
          </h1>

          <p
            style={{
              color: "#94a3b8",
              margin: "0 0 24px",
              lineHeight: 1.6,
            }}
          >
            {error || "Não foi possível encontrar seus dados."}
          </p>

          <button
            onClick={() => router.replace("/login")}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              padding: "12px 24px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "15px",
            }}
          >
            Voltar para o login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          height: "72px",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          background: "#020617",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            ⚡ Trovão Azul
          </div>

          <div
            style={{
              color: "#60a5fa",
              fontSize: "13px",
              marginTop: "2px",
            }}
          >
            Agência TikTok LIVE
          </div>
        </div>

        <button
          onClick={sair}
          style={{
            background: "transparent",
            color: "#94a3b8",
            border: "1px solid #334155",
            borderRadius: "8px",
            padding: "9px 16px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Sair
        </button>
      </header>

      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "50px 30px",
        }}
      >
        <div
          style={{
            marginBottom: "35px",
          }}
        >
          <p
            style={{
              color: "#3b82f6",
              fontSize: "13px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "1px",
              margin: "0 0 8px",
            }}
          >
            Área do Criador
          </p>

          <h1
            style={{
              fontSize: "36px",
              margin: 0,
            }}
          >
            Olá, @{streamer.username_tiktok} 👋
          </h1>

          <p
            style={{
              color: "#94a3b8",
              marginTop: "10px",
            }}
          >
            Bem-vindo ao seu painel da Trovão Azul.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "16px",
              padding: "25px",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Usuário do TikTok
            </div>

            <div
              style={{
                fontSize: "22px",
                fontWeight: "bold",
                marginTop: "10px",
              }}
            >
              @{streamer.username_tiktok}
            </div>
          </div>

          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "16px",
              padding: "25px",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              E-mail
            </div>

            <div
              style={{
                fontSize: "17px",
                fontWeight: "bold",
                marginTop: "10px",
                wordBreak: "break-word",
              }}
            >
              {streamer.email}
            </div>
          </div>

          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "16px",
              padding: "25px",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Status
            </div>

            <div
              style={{
                fontSize: "22px",
                fontWeight: "bold",
                marginTop: "10px",
                color: "#22c55e",
              }}
            >
              ✓ Ativo
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "25px",
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "16px",
            padding: "30px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "10px",
            }}
          >
            Seu painel
          </h2>

          <p
            style={{
              color: "#94a3b8",
              lineHeight: 1.6,
              marginBottom: 0,
            }}
          >
            Aqui vamos colocar seus dados de streamer,
            metas, resultados das lives, ranking,
            pagamentos e outras informações da agência.
          </p>
        </div>
      </section>
    </main>
  );
}