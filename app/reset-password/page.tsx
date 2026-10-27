tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        setError(
          "Este link de recuperação é inválido ou expirou. Solicite um novo link."
        );
      }

      setCheckingSession(false);
    }

    checkSession();
  }, []);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error("Erro ao atualizar senha:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      setMessage(
        "Senha alterada com sucesso! Você será redirecionado para o login."
      );

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (err) {
      console.error("Erro inesperado:", err);
      setError("Ocorreu um erro. Tente novamente.");
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#020817] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500" />
          <p className="text-sm text-slate-400">
            Verificando seu link de recuperação...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#020817] px-4">
      <div className="w-full max-w-md">

        <div className="rounded-3xl border border-white/10 bg-[#0b132b] p-8 shadow-2xl">

          {/* ÍCONE */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <span className="text-3xl">🔑</span>
            </div>
          </div>

          {/* TÍTULO */}
          <div className="mb-8 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-400">
              Trovão Azul
            </p>

            <h1 className="text-3xl font-bold text-white">
              Criar nova senha
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Escolha uma nova senha para acessar sua conta.
            </p>
          </div>

          {/* MENSAGEM */}
          {message && (
            <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm leading-5 text-green-300">
              {message}
            </div>
          )}

          {/* ERRO */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
              {error}
            </div>
          )}

          {/* FORMULÁRIO */}
          {!message && !error && (
            <form
              onSubmit={handleUpdatePassword}
              className="space-y-5"
            >

              {/* NOVA SENHA */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Nova senha
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  disabled={loading}
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                />
              </div>

              {/* CONFIRMAR SENHA */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Confirmar nova senha
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  required
                  disabled={loading}
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Alterando senha..." : "Alterar minha senha"}
              </button>

            </form>
          )}

          {/* VOLTAR */}
          <div className="mt-7 text-center">
            <Link
              href="/login"
              className="font-semibold text-blue-400 transition hover:text-blue-300"
            >
              ← Voltar para o login
            </Link>
          </div>

        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          © 2026 Trovão Azul • Agência TikTok LIVE
        </p>

      </div>
    </main>
  );
}
