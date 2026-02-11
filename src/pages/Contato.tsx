import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight } from "lucide-react";
import { HeimdallNavbar } from "@/components/landing/heimdall/HeimdallNavbar";
import { PublicFooter } from "@/components/landing/heimdall/PublicFooter";

export default function Contato() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cargo: "",
    empresa: "",
    telefone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrar envio para backend/CRM.
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#edf4ef] text-[#11261c]">
      <HeimdallNavbar />

      <section
        style={{
          position: "relative",
          minHeight: "100dvh",
          overflow: "hidden",
          paddingTop: "156px",
          paddingRight: "max(4vw, 2rem)",
          paddingBottom: "24px",
          paddingLeft: "max(4vw, 2rem)",
        }}
      >
        <img
          src="/hero-img-03.png"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />

        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.46) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.58) 100%)",
          }}
        />

        <div className="relative z-10 flex w-full flex-col gap-8 md:min-h-[calc(100dvh-180px)] md:flex-row md:items-start md:justify-between">
          <div
            style={{
              color: "#ffffff",
              textShadow: "0 4px 20px rgba(0,0,0,0.35)",
            }}
            className="w-full md:max-w-[58%] md:self-end"
          >
            <span
              style={{
                display: "inline-flex",
                marginBottom: "0.9rem",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.08)",
                padding: "0.3rem 0.75rem",
                fontSize: "0.74rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Contato Daton
            </span>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              style={{
                margin: 0,
                fontSize: "clamp(2rem, 5vw, 4.2rem)",
                lineHeight: 1.06,
                letterSpacing: "-0.02em",
                fontWeight: 650,
              }}
            >
              Vamos construir sua operação ESG com clareza e execução.
            </motion.h1>

            <p
              style={{
                marginTop: "1rem",
                marginBottom: 0,
                maxWidth: "680px",
                fontSize: "clamp(1rem, 1.35vw, 1.25rem)",
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              Agende uma demonstração personalizada e veja como transformar
              Ambiental, Social e Governança em decisões práticas no dia a dia da
              sua empresa.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full rounded-2xl border border-white/40 bg-black/35 p-5 text-white backdrop-blur-md md:max-w-[39%] md:self-center md:p-6"
          >
            <h2 className="text-xl font-semibold">Solicite sua demonstração</h2>
            <p className="mt-1 text-sm text-white/85">
              Preencha os dados e retornamos em até 24h úteis.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-white">
                  Nome completo *
                </Label>
                <Input
                  id="nome"
                  placeholder="Seu nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  required
                  className="border-white/45 bg-white/10 text-white placeholder:text-white/65"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email corporativo *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@empresa.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className="border-white/45 bg-white/10 text-white placeholder:text-white/65"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo" className="text-white">
                  Cargo *
                </Label>
                <Input
                  id="cargo"
                  placeholder="Seu cargo"
                  value={formData.cargo}
                  onChange={(e) => handleInputChange("cargo", e.target.value)}
                  required
                  className="border-white/45 bg-white/10 text-white placeholder:text-white/65"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa" className="text-white">
                  Empresa *
                </Label>
                <Input
                  id="empresa"
                  placeholder="Nome da empresa"
                  value={formData.empresa}
                  onChange={(e) => handleInputChange("empresa", e.target.value)}
                  required
                  className="border-white/45 bg-white/10 text-white placeholder:text-white/65"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="telefone" className="text-white">
                  Telefone para contato (opcional)
                </Label>
                <Input
                  id="telefone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  className="border-white/45 bg-white/10 text-white placeholder:text-white/65"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl bg-[#c4fca1] text-black hover:bg-[#b3ef8d] sm:col-span-2"
              >
                Agendar demonstração
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
