"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

export default function CadastroPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();

    setErro("");
    setMensagem("");

    const usernameTikTok = username.trim().replace(/^@/, "");

    if (!usernameTikTok) {
      setErro("Digite seu username do TikTok.");
      return;
    }

    if (!email.trim()) {
      setErro("Digite seu e-mail.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não são iguais.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,

        options: {
          data: {
            username_tiktok: usernameTikTok,
          },
        },
      });

      if (error) {
        setErro(error.message);
        setLoading(false);
        return;
      }

      console.log("Usuário criado:", data.user);

      setMensagem(
        "Cadastro realizado! Enviamos um código/link de confirmação para seu e-mail."
      );

      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (error) {
      console.error(error);
      setErro("Ocorreu um erro inesperado. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="rounded-3xl border border-white/10 bg-[#0b1124] p-8 shadow-2xl">

          {/* ÍCONE */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <Logo size={32} />
          </div>

          {/* TÍTULO */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              Faça seu cadastro
            </h1>

            <p className="mt-2 text-slate-400">
              Entre para a Trovão Azul
            </p>
          </div>

          <form onSubmit={handleCadastro} className="space-y-5">

            {/* USERNAME TIKTOK */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Username do TikTok
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  @
                </span>

                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seuusername"
                  className="w-full rounded-xl border border-white/10 bg-[#11182d] py-4 pl-10 pr-4 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Use exatamente o username da sua conta do TikTok.
              </p>
            </div>

            {/* E-MAIL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@gmail.com"
                className="w-full rounded-xl border border-white/10 bg-[#11182d] px-4 py-4 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* SENHA */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Senha
              </label>

              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-[#11182d] px-4 py-4 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                disabled={loading}
                autoComplete="new-password"
              />

              <p className="mt-2 text-xs text-slate-500">
                Mínimo de 6 caracteres.
              </p>
            </div>

            {/* CONFIRMAR SENHA */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Confirmar senha
              </label>

              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-[#11182d] px-4 py-4 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            {/* ERRO */}
            {erro && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
                {erro}
              </div>
            )}

            {/* SUCESSO */}
            {mensagem && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-center text-sm text-green-300">
                {mensagem}
              </div>
            )}

            {/* BOTÃO */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Criando sua conta..." : "Criar minha conta"}
            </button>

          </form>

          {/* LOGIN */}
          <div className="mt-7 text-center text-sm text-slate-500">
            Já possui uma conta?{" "}

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              Fazer login
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}