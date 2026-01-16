import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { PublicFormRenderer } from "@/components/PublicFormRenderer";

export default function PublicForm() {
  const { formId } = useParams<{ formId: string }>();
  const [searchParams] = useSearchParams();
  const trackingId = searchParams.get('t');

  // SEO
  useEffect(() => {
    document.title = 'Formulário | Complete os Dados';
    const desc = 'Complete este formulário com suas informações. Processo simples e seguro.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) meta.setAttribute('content', desc);
    else {
      meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = desc;
      document.head.appendChild(meta);
    }
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const href = `${window.location.origin}/form/${formId}`;
    if (canonical) canonical.setAttribute('href', href);
    else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = href;
      document.head.appendChild(canonical);
    }
  }, [formId]);

  if (!formId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Formulário não encontrado</h1>
          <p className="text-muted-foreground">
            O link para este formulário é inválido.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto py-8">
        <PublicFormRenderer 
          formId={formId}
          trackingId={trackingId}
          onSubmitSuccess={() => {
            // Could redirect to a thank you page or show a success message
          }}
        />
      </div>
    </div>
  );
}
