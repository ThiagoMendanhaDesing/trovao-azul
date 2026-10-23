"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Zap, Users, TrendingUp } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-screen items-center overflow-hidden bg-slate-950 pt-20"
    >
      {/* FUNDO */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[140px]" />

        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-40 top-20 h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-[120px]"
        />

        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-blue-700/20 blur-[140px]"
        />

        {/* GRID */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-2">
        
        {/* TEXTO */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 backdrop-blur"
          >
            <Zap className="h-4 w-4 fill-blue-400 text-blue-400" />

            Agência oficial para criadores LIVE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Sua LIVE.
            <br />

            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Seu potencial.
            </span>

            <br />

            <span className="text-white">
              Nosso suporte.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-7 max-w-xl text-lg leading-8 text-slate-400"
          >
            A Trovão Azul ajuda criadores a transformarem suas transmissões
            em uma jornada de crescimento, com suporte, acompanhamento e
            estratégia para evoluir no TikTok LIVE.
          </motion.p>

          {/* BOTÕES */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-9 flex flex-wrap gap-4"
          >
            <a
              href="/cadastro"
              className="group inline-flex items-center gap-3 rounded-xl bg-blue-600 px-7 py-4 font-bold text-white shadow-xl shadow-blue-600/25 transition duration-300 hover:-translate-y-1 hover:bg-blue-500 hover:shadow-blue-500/40"
            >
              Quero fazer parte

              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>

            <a
              href="#sobre"
              className="group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-7 py-4 font-bold text-slate-200 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.07]"
            >
              <Play className="h-4 w-4 fill-white" />

              Conhecer a agência
            </a>
          </motion.div>

          {/* MINI ESTATÍSTICAS */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-12 flex flex-wrap gap-8 border-t border-white/10 pt-7"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Users className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <p className="text-lg font-bold text-white">+100</p>
                <p className="text-xs text-slate-500">
                  Criadores
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <p className="text-lg font-bold text-white">+50K</p>
                <p className="text-xs text-slate-500">
                  Lives realizadas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Zap className="h-5 w-5 text-blue-400" />
              </div>

              <div>
                <p className="text-lg font-bold text-white">24/7</p>
                <p className="text-xs text-slate-500">
                  Suporte
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CARD INTERATIVO */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.25 }}
          className="relative mx-auto w-full max-w-xl"
        >
          {/* BRILHO */}
          <div className="absolute -inset-5 rounded-[40px] bg-blue-600/20 blur-3xl" />

          <motion.div
            animate={{
              y: [0, -12, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.05] p-7 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl"
          >
            {/* TOPO */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Trovão Azul
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Painel do criador
                </h2>
              </div>

              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30"
              >
                <Zap className="h-7 w-7 fill-white text-white" />
              </motion.div>
            </div>

            {/* STATUS */}
            <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/70 p-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>

                <span className="text-sm font-medium text-slate-300">
                  Sistema online
                </span>
              </div>

              <span className="text-xs text-slate-500">
                AO VIVO
              </span>
            </div>

            {/* MÉTRICAS */}
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5">
                <p className="text-xs text-slate-500">
                  Desempenho
                </p>

                <p className="mt-2 text-3xl font-black">
                  +38%
                </p>

                <p className="mt-1 text-xs text-emerald-400">
                  ↗ este mês
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5">
                <p className="text-xs text-slate-500">
                  Crescimento
                </p>

                <p className="mt-2 text-3xl font-black">
                  86.4K
                </p>

                <p className="mt-1 text-xs text-blue-400">
                  diamantes
                </p>
              </div>
            </div>

            {/* PROGRESSO */}
            <div className="mt-5 rounded-2xl border border-white/5 bg-slate-900/60 p-5">
              <div className="flex justify-between">
                <p className="text-sm font-medium">
                  Meta mensal
                </p>

                <p className="text-sm font-bold text-blue-400">
                  86%
                </p>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "86%" }}
                  transition={{
                    duration: 1.5,
                    delay: 1,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Você está próximo de alcançar sua próxima meta.
              </p>
            </div>

            {/* RODAPÉ DO CARD */}
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
              <p className="text-sm text-slate-400">
                Próximo nível
              </p>

              <a
                href="/cadastro"
                className="group flex items-center gap-2 text-sm font-bold text-blue-400 transition hover:text-blue-300"
              >
                Começar agora

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* INDICADOR */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 md:block"
      >
        <div className="h-10 w-6 rounded-full border border-white/20 p-1">
          <div className="mx-auto h-2 w-1 rounded-full bg-blue-400" />
        </div>
      </motion.div>
    </section>
  );
}