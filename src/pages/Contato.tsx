import { motion } from "framer-motion";
import { HeimdallNavbar } from "@/components/landing/heimdall/HeimdallNavbar";
import { PublicFooter } from "@/components/landing/heimdall/PublicFooter";
import { CommercialContactForm } from "@/components/landing/CommercialContactForm";
import { responsiveImageProps } from "@/config/responsiveImages";

export default function Contato() {
  return (
    <div className="min-h-screen bg-[#edf4ef] text-[#11261c]">
      <HeimdallNavbar />

      <section
        style={{
          position: "relative",
          minHeight: "auto",
          overflow: "hidden",
          paddingTop: "clamp(100px, 15vw, 156px)",
          paddingRight: "clamp(1rem, 4vw, 2rem)",
          paddingBottom: "24px",
          paddingLeft: "clamp(1rem, 4vw, 2rem)",
        }}
      >
        <img
          src="/hero-img-03.webp"
          {...responsiveImageProps("/hero-img-03.webp")}
          loading="eager"
          fetchPriority="high"
          decoding="async"
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

        <div className="relative z-10 flex w-full flex-col gap-8 md:min-h-[calc(100dvh-180px)] md:flex-row md:items-start md:justify-between pb-8">
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
              Vamos conectar qualidade, ESG e compliance na sua operação.
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
              Converse com a equipe Daton sobre as necessidades da sua empresa.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="commercial-contact-panel w-full rounded-2xl border p-5 backdrop-blur-md md:max-w-[39%] md:self-center md:p-6"
          >
            <CommercialContactForm />
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
