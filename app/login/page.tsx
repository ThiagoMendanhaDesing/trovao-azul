"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // LOGIN NO SUPABASE
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        setError("E-mail ou senha incorretos.");
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Não foi possível encontrar sua conta.");
        setLoading(false);
        return;
      }

      const userId = data.user.id;

      // =====================================================
      // 1. VERIFICA SE É ADMIN
      // =====================================================

      const { data: admin, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (adminError) {
        console.error("Erro ao verificar administrador:", adminError);
        setError("Não foi possível verificar seu acesso.");
        setLoading(false);
        return;
      }

      // SE FOR ADMIN → VAI PARA /admin
      if (admin) {
        router.replace("/admin");
        return;
      }

      // =====================================================
      // 2. SE NÃO FOR ADMIN, PROCURA O STREAMER
      // =====================================================

      const { data: streamer, error: streamerError } = await supabase
        .from("streamers")
        .select("id, username_tiktok, email")
        .eq("id", userId)
        .maybeSingle();

      if (streamerError) {
        console.error("Erro ao buscar streamer:", streamerError);
        setError("Ocorreu um erro ao buscar seu perfil.");
        setLoading(false);
        return;
      }

      // SE FOR STREAMER → VAI PARA /dashboard
      if (streamer) {
        router.replace("/dashboard");
        return;
      }

      // NÃO É ADMIN NEM STREAMER
      setError(
        "Sua conta foi autenticada, mas não possui acesso ao sistema."
      );

      await supabase.auth.signOut();
      setLoading(false);

    } catch (err) {
      console.error("Erro inesperado no login:", err);
      setError("Ocorreu um erro inesperado. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#020817] px-4">
      <div className="w-full max-w-md">

        <div className="rounded-3xl border border-white/10 bg-[#0b132b] p-8 shadow-2xl">

          {/* ÍCONE */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <span className="text-3xl">⚡</span>
            </div>
          </div>

          {/* TÍTULO */}
          <div className="mb-8 text-center">

            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-400">
              Trovão Azul
            </p>

            <h1 className="text-3xl font-bold text-white">
              Bem-vindo de volta
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Entre na sua conta para acessar seu painel.
            </p>

          </div>

          {/* FORMULÁRIO */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* E-MAIL */}
            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                E-mail
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />

            </div>

            {/* SENHA */}
            <div>

              <div className="mb-2 flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-200"
                >
                  Senha
                </label>

                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-sm font-medium text-blue-400 transition hover:text-blue-300"
                >
                  Esqueci minha senha
                </button>

              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />

            </div>

            {/* ERRO */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
                {error}
              </div>
            )}

            {/* BOTÃO */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verificando acesso..." : "Entrar na minha conta"}
            </button>

          </form>

          {/* CADASTRO */}
          <div className="mt-7 text-center">

            <p className="text-sm text-slate-400">
              Ainda não possui uma conta?
            </p>

            <button
              type="button"
              onClick={() => router.push("/cadastro")}
              className="mt-2 font-semibold text-blue-400 transition hover:text-blue-300"
            >
              Criar minha conta →
            </button>

          </div>

        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          © 2026 Trovão Azul • Agência TikTok LIVE
        </p>

      </div>
    </main>
  );
}