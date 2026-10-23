"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIntro(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">

      {/* EFEITOS DE FUNDO */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-[-250px] right-[-150px] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px]" />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link href="/" className="group flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30 transition duration-300 group-hover:scale-110 group-hover:rotate-3">
              <span className="text-2xl">⚡</span>
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight">
                TROVÃO AZUL
              </h1>

              <p className="text-[11px] font-medium text-blue-400">
                AGÊNCIA TIKTOK LIVE
              </p>
            </div>

          </Link>

          <nav className="hidden items-center gap-8 md:flex">

            <a
              href="#sobre"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Sobre
            </a>

            <a
              href="#beneficios"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Benefícios
            </a>

            <a
              href="#contato"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Contato
            </a>

          </nav>

          <Link
            href="/login"
            className="rounded-xl border border-blue-500/30 bg-blue-600/10 px-5 py-3 text-sm font-bold text-blue-300 transition hover:border-blue-400 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20"
          >
            Área do Criador
          </Link>

        </div>

      </header>

      {/* HERO */}
      <section className="relative">

        <div className="mx-auto grid min-h-[720px] max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2">

          {/* TEXTO */}
          <div className="animate-[fadeUp_0.8s_ease-out]">

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300">
              <span className="animate-pulse">⚡</span>
              Trovão Azul • TikTok LIVE
            </div>

            <h2 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">

              Sua LIVE.

              <span className="block bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                Seu próximo nível.
              </span>

            </h2>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
              A Trovão Azul conecta criadores, desenvolve talentos e oferece
              estrutura para quem quer transformar suas transmissões ao vivo
              em uma verdadeira oportunidade de crescimento.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">

              <a
                href="#contato"
                className="group relative overflow-hidden rounded-xl bg-blue-600 px-7 py-4 font-bold shadow-xl shadow-blue-600/20 transition duration-300 hover:-translate-y-1 hover:bg-blue-500 hover:shadow-blue-600/40"
              >
                <span className="relative z-10">
                  Quero fazer parte
                </span>

                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition duration-700 group-hover:translate-x-full" />
              </a>

              <Link
                href="/login"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-7 py-4 font-bold text-slate-200 transition duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:bg-white/[0.07]"
              >
                Comece agora →
              </Link>

            </div>

            {/* MINI STATS */}
            <div className="mt-12 flex flex-wrap gap-8 border-t border-white/10 pt-8">

              <div>
                <p className="text-2xl font-black text-white">
                  LIVE
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Foco no criador
                </p>
              </div>

              <div>
                <p className="text-2xl font-black text-white">
                  24/7
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Estrutura e suporte
                </p>
              </div>

              <div>
                <p className="text-2xl font-black text-blue-400">
                  ⚡
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Energia para crescer
                </p>
              </div>

            </div>

          </div>

          {/* CARD INTERATIVO */}
          <div className="relative animate-[fadeIn_1s_ease-out]">

            <div className="absolute -inset-10 rounded-full bg-blue-600/20 blur-[100px]" />

            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-xl transition duration-500 hover:-translate-y-2 hover:border-blue-500/30">

              {/* TOPO */}
              <div className="mb-7 flex items-center justify-between">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                    Trovão Azul
                  </p>

                  <h3 className="mt-2 text-3xl font-black">
                    Seu próximo nível
                  </h3>

                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-600/30 transition duration-500 hover:rotate-12 hover:scale-110">
                  <span className="text-3xl">⚡</span>
                </div>

              </div>

              {/* BARRA */}
              <div className="mb-7 rounded-2xl border border-white/10 bg-black/20 p-5">

                <div className="mb-3 flex justify-between text-sm">

                  <span className="text-slate-400">
                    Evolução do criador
                  </span>

                  <span className="font-bold text-blue-400">
                    Crescendo
                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/10">

                  <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.7)] animate-[progress_1.8s_ease-out]" />

                </div>

              </div>

              {/* CARDS */}
              <div className="space-y-4">

                <div className="group rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-500/20 hover:bg-blue-500/5">

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                      🎯
                    </div>

                    <div>

                      <p className="text-sm text-slate-400">
                        Estratégia
                      </p>

                      <p className="mt-1 font-bold">
                        Cresça com direção
                      </p>

                    </div>

                  </div>

                </div>

                <div className="group rounded-2xl border border-white/5 bg-white/[0.03] p-5 transition duration-300 hover:-translate-y-1 hover:border-blue-500/20 hover:bg-blue-500/5">

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                      📈
                    </div>

                    <div>

                      <p className="text-sm text-slate-400">
                        Desenvolvimento
                      </p>

                      <p className="mt-1 font-bold">
                        Evolua como criador
                      </p>

                    </div>

                  </div>

                </div>

                <div className="group rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-600/20 to-cyan-500/10 p-5 transition duration-300 hover:-translate-y-1">

                  <div className="flex items-center gap-4">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-2xl shadow-lg shadow-blue-600/30">
                      ⚡
                    </div>

                    <div>

                      <p className="text-sm text-blue-300">
                        Próximo passo
                      </p>

                      <p className="mt-1 font-black">
                        Faça parte da Trovão Azul
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* SOBRE */}
      <section
        id="sobre"
        className="border-t border-white/10 py-28"
      >

        <div className="mx-auto max-w-7xl px-6">

          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

            <div>

              <p className="font-bold tracking-widest text-blue-500">
                SOBRE NÓS
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">

                Mais que uma agência.

                <span className="block text-slate-500">
                  Uma estrutura para crescer.
                </span>

              </h2>

            </div>

            <div>

              <p className="text-lg leading-8 text-slate-400">
                A Trovão Azul nasceu para ajudar criadores a desenvolverem
                suas transmissões, alcançarem novos objetivos e construírem
                uma trajetória sólida dentro do TikTok LIVE.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* BENEFÍCIOS */}
      <section
        id="beneficios"
        className="bg-white/[0.02] py-28"
      >

        <div className="mx-auto max-w-7xl px-6">

          <div className="mx-auto max-w-2xl text-center">

            <p className="font-bold tracking-widest text-blue-500">
              POR QUE A TROVÃO AZUL?
            </p>

            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              Tudo para você evoluir.
            </h2>

            <p className="mt-5 text-slate-400">
              Estrutura, acompanhamento e comunidade para quem leva a LIVE
              a sério.
            </p>

          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">

            {[
              {
                icon: "⚡",
                title: "Suporte",
                text: "Tenha orientação e acompanhamento para melhorar suas transmissões.",
              },
              {
                icon: "📈",
                title: "Crescimento",
                text: "Acompanhe sua evolução e busque novas metas como criador.",
              },
              {
                icon: "🤝",
                title: "Comunidade",
                text: "Faça parte de uma rede de criadores que buscam crescer juntos.",
              },
            ].map((item) => (

              <div
                key={item.title}
                className="group rounded-3xl border border-white/10 bg-[#020617] p-8 transition duration-500 hover:-translate-y-3 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-950/40"
              >

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl transition duration-500 group-hover:scale-110 group-hover:bg-blue-600">
                  {item.icon}
                </div>

                <h3 className="mt-7 text-2xl font-black">
                  {item.title}
                </h3>

                <p className="mt-4 leading-7 text-slate-400">
                  {item.text}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* CTA / CONTATO */}
      <section
        id="contato"
        className="relative overflow-hidden py-32"
      >

        <div className="absolute inset-0 bg-blue-600/5" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 shadow-2xl shadow-blue-600/30 animate-pulse">
            <span className="text-4xl">⚡</span>
          </div>

          <p className="mt-8 font-bold tracking-widest text-blue-400">
            FAÇA PARTE
          </p>

          <h2 className="mt-4 text-4xl font-black sm:text-6xl">
            Pronto para dar
            <span className="block text-blue-500">
              o próximo passo?
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            Entre em contato com a Trovão Azul e descubra como podemos
            ajudar você na sua jornada como streamer.
          </p>

          <a
            href="#contato"
            className="mt-9 inline-flex rounded-xl bg-blue-600 px-8 py-4 font-black shadow-xl shadow-blue-600/20 transition duration-300 hover:-translate-y-1 hover:bg-blue-500 hover:shadow-blue-600/40"
          >
            Quero fazer parte da Trovão Azul →
          </a>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8">

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-6 text-sm text-slate-500 md:flex-row">

          <p>
            © 2026 Trovão Azul. Todos os direitos reservados.
          </p>

          <p>
            Agência TikTok LIVE ⚡
          </p>

        </div>

      </footer>

      {/* ANIMAÇÕES */}
      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 78%;
          }
        }

        @keyframes scaleX {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>

    </main>
  );
}