import { Link } from "react-router-dom";
import datonLogo from "@/assets/daton-logo-header.png";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#233a30] bg-[#0f1f18] px-4 py-10 text-white md:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <img
            src={datonLogo}
            alt="Daton"
            className="h-8"
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <p className="mt-4 max-w-xl text-sm text-white/75">
            Plataforma ESG para transformar dados em decisões estratégicas nas
            frentes Ambiental, Social e Governança.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.1em] text-white/90">
            Navegação
          </h4>
          <div className="mt-3 space-y-2 text-sm text-white/75">
            <Link to="/funcionalidades" className="block hover:text-white">
              Soluções
            </Link>
            <Link to="/tecnologia" className="block hover:text-white">
              Tecnologia
            </Link>
            <Link to="/documentacao" className="block hover:text-white">
              Documentação
            </Link>
            <Link to="/sobre-nos" className="block hover:text-white">
              Sobre Nós
            </Link>
            <Link to="/contato" className="block hover:text-white">
              Contato
            </Link>
            <Link to="/privacidade" className="block hover:text-white">
              Privacidade
            </Link>
            <Link to="/termos" className="block hover:text-white">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-7xl border-t border-[#284438] pt-6 text-xs text-white/55">
        © {new Date().getFullYear()} Daton. Todos os direitos reservados.
      </div>
    </footer>
  );
}

export default PublicFooter;
