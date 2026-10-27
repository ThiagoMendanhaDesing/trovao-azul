"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        console.error("Erro ao enviar recuperação:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      setMessage(
        "Enviamos um link de recuperação para o seu e-mail. Verifique também a caixa de spam."
      );

      setLoading(false);
    } catch (err) {
      console.error("Erro inesperado:", err);
      setError("Ocorreu um erro. Tente novamente.");
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
              <span className="text-3xl">🔐</span>
            </div>
          </div>

          {/* TÍTULO */}
          <div className="mb-8 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-400">
              Trovão Azul
            </p>

            <h1 className="text-3xl font-bold text-white">
              Esqueci minha senha
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Digite seu e-mail e enviaremos um link para você criar uma nova senha.
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
          <form onSubmit={handleReset} className="space-y-5">

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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>

          </form>

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