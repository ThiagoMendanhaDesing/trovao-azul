"use client";

import { motion } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/75 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        
        {/* LOGO */}
        <a href="#" className="group flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30 transition duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Zap className="h-6 w-6 fill-white text-white" />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Trovão Azul
            </h1>

            <p className="text-xs font-medium text-blue-400">
              Agência TikTok LIVE
            </p>
          </div>
        </a>

        {/* MENU DESKTOP */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#inicio"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Início
          </a>

          <a
            href="#sobre"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Sobre
          </a>

          <a
            href="#beneficios"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Benefícios
          </a>

          <a
            href="#contato"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Contato
          </a>
        </nav>

        {/* AÇÕES */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5 hover:text-white"
          >
            Entrar
          </a>

          <a
            href="/cadastro"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/30"
          >
            Quero fazer parte
          </a>
        </div>

        {/* BOTÃO MOBILE */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-xl border border-white/10 p-2 text-white transition hover:bg-white/5 md:hidden"
          aria-label="Abrir menu"
        >
          {menuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* MENU MOBILE */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-white/10 bg-slate-950 md:hidden"
        >
          <nav className="flex flex-col gap-2 px-6 py-5">
            <a
              href="#inicio"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Início
            </a>

            <a
              href="#sobre"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Sobre
            </a>

            <a
              href="#beneficios"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Benefícios
            </a>

            <a
              href="#contato"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              Contato
            </a>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <a
                href="/login"
                className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Entrar
              </a>

              <a
                href="/cadastro"
                className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white"
              >
                Cadastrar
              </a>
            </div>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}