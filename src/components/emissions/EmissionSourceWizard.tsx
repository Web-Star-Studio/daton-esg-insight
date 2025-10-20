import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, ChevronLeft, ChevronRight, Check, Building2 } from "lucide-react";
import { toast } from "sonner";
import { searchGlossary, getSuggestedTerm, getCategoriesByScope, addCustomGlossaryTerm } from "@/services/emissionSourceGlossary";
import { createEmissionSource } from "@/services/emissions";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const wizardSchema = z.object({
  sourceName: z.string().min(1, "Nome da fonte é obrigatório"),
  ownershipType: z.enum(["own", "third-party"]),
  thirdPartyType: z.enum(["supplier", "customer", "energy", "transport"]).optional(),
  supplierCNPJ: z.string().optional(),
  supplierName: z.string().optional(),
  description: z.string().optional(),
});

type WizardFormData = z.infer<typeof wizardSchema>;

interface EmissionSourceWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmissionSourceWizard({ open, onOpenChange, onSuccess }: EmissionSourceWizardProps) {
  const [step, setStep] = useState(1);
  const [suggestedTerm, setSuggestedTerm] = useState<string | null>(null);
  const [detectedScope, setDetectedScope] = useState<number | null>(null);
  const [detectedCategory, setDetectedCategory] = useState<string | null>(null);
  const [glossaryResults, setGlossaryResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      ownershipType: "own",
    }
  });

  const watchSourceName = watch("sourceName");
  const watchOwnership = watch("ownershipType");
  const watchThirdParty = watch("thirdPartyType");

  // Buscar no glossário enquanto digita
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (watchSourceName && watchSourceName.length > 2) {
        const results = await searchGlossary(watchSourceName);
        setGlossaryResults(results);

        // Verificar se é sinônimo de algum termo
        const suggestion = await getSuggestedTerm(watchSourceName);
        if (suggestion) {
          setSuggestedTerm(suggestion.main_term);
          setDetectedScope(suggestion.suggested_scope || null);
          setDetectedCategory(suggestion.suggested_category || null);
        }
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [watchSourceName]);

  // Detectar escopo baseado nas escolhas
  useEffect(() => {
    if (watchOwnership === "own") {
      setDetectedScope(1);
      setDetectedCategory("Combustão Móvel");
    } else if (watchThirdParty) {
      if (watchThirdParty === "energy") {
        setDetectedScope(2);
        setDetectedCategory("Eletricidade Adquirida");
      } else {
        setDetectedScope(3);
        setDetectedCategory(
          watchThirdParty === "supplier" ? "Bens e Serviços Adquiridos" :
          watchThirdParty === "customer" ? "Uso de Produtos Vendidos" :
          "Transporte e Distribuição (Upstream)"
        );
      }
    }
  }, [watchOwnership, watchThirdParty]);

  const nextStep = () => {
    if (step === 1 && !watchSourceName) {
      toast.error("Digite o nome da fonte de emissão");
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (data: WizardFormData) => {
    setIsLoading(true);
    try {
      // Usar termo sugerido se disponível
      const finalName = suggestedTerm || data.sourceName;

      // Criar fonte de emissão
      await createEmissionSource({
        name: finalName,
        scope: detectedScope!,
        category: detectedCategory!,
        description: data.description || `Fonte de emissão: ${detectedCategory}`,
      });

      // Se não existir no glossário, adicionar
      if (!suggestedTerm) {
        await addCustomGlossaryTerm(
          finalName,
          [],
          detectedScope!,
          detectedCategory!
        );
      }

      toast.success("Fonte de emissão criada com sucesso!");
      reset();
      setStep(1);
      setSuggestedTerm(null);
      onOpenChange(false);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating emission source:', error);
      toast.error("Erro ao criar fonte de emissão");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assistente de Fonte de Emissão</DialogTitle>
          <DialogDescription>
            Vamos te ajudar a identificar e classificar corretamente sua fonte de emissão
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  s === step ? 'border-primary bg-primary text-primary-foreground' :
                  s < step ? 'border-success bg-success text-success-foreground' :
                  'border-muted bg-background text-muted-foreground'
                }`}>
                  {s < step ? <Check className="h-4 w-4" /> : s}
                </div>
                {s < 3 && <div className={`w-20 h-0.5 ${s < step ? 'bg-success' : 'bg-muted'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Nome da Fonte */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sourceName">Qual o nome da fonte de emissão?</Label>
                <Input
                  id="sourceName"
                  placeholder="Ex: Transporte, Caldeira, Energia Elétrica"
                  {...register("sourceName")}
                  className="mt-2"
                />
                {errors.sourceName && (
                  <p className="text-sm text-destructive mt-1">{errors.sourceName.message}</p>
                )}
              </div>

              {/* Sugestão de termo padrão */}
              {suggestedTerm && suggestedTerm !== watchSourceName && (
                <div className="p-4 bg-accent/10 border border-accent rounded-lg flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-accent mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Você quis dizer:</p>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-accent hover:text-accent/80"
                      onClick={() => setValue("sourceName", suggestedTerm)}
                    >
                      {suggestedTerm}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este é o termo padrão usado pela sua empresa
                    </p>
                  </div>
                </div>
              )}

              {/* Resultados do glossário */}
              {glossaryResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Termos similares:</p>
                  <div className="flex flex-wrap gap-2">
                    {glossaryResults.slice(0, 5).map((result) => (
                      <Badge
                        key={result.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => setValue("sourceName", result.main_term)}
                      >
                        {result.main_term}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Origem da Emissão */}
          {step === 2 && (
            <div className="space-y-4">
              <Label>Esta emissão é gerada diretamente pela sua empresa ou por terceiros?</Label>
              <RadioGroup
                value={watchOwnership}
                onValueChange={(value: any) => setValue("ownershipType", value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:border-primary cursor-pointer">
                  <RadioGroupItem value="own" id="own" />
                  <Label htmlFor="own" className="flex-1 cursor-pointer">
                    <div className="font-medium">Própria empresa</div>
                    <div className="text-sm text-muted-foreground">
                      Emissões de equipamentos, veículos ou processos controlados pela empresa
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:border-primary cursor-pointer">
                  <RadioGroupItem value="third-party" id="third-party" />
                  <Label htmlFor="third-party" className="flex-1 cursor-pointer">
                    <div className="font-medium">Terceiros</div>
                    <div className="text-sm text-muted-foreground">
                      Emissões de fornecedores, energia adquirida, transporte terceirizado, etc.
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* Se terceiros, perguntar tipo */}
              {watchOwnership === "third-party" && (
                <div className="space-y-3 mt-4">
                  <Separator />
                  <Label>Qual o tipo de terceiro?</Label>
                  <RadioGroup
                    value={watchThirdParty}
                    onValueChange={(value: any) => setValue("thirdPartyType", value)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="supplier" id="supplier" />
                      <Label htmlFor="supplier" className="cursor-pointer">Fornecedor (bens/serviços)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="energy" id="energy" />
                      <Label htmlFor="energy" className="cursor-pointer">Energia Adquirida</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="transport" id="transport" />
                      <Label htmlFor="transport" className="cursor-pointer">Transporte Contratado</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer" className="cursor-pointer">Cliente (uso de produtos)</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirmação e Detalhes */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-success/10 border border-success rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-success" />
                  <span className="font-semibold text-success">Escopo e Categoria Identificados!</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Escopo:</span>
                    <Badge>Escopo {detectedScope}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria:</span>
                    <Badge variant="outline">{detectedCategory}</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <textarea
                  id="description"
                  {...register("description")}
                  className="w-full mt-2 p-2 border rounded-md"
                  rows={3}
                  placeholder="Adicione detalhes sobre esta fonte de emissão..."
                />
              </div>

              {/* Se terceiro, campos de CNPJ */}
              {watchOwnership === "third-party" && watchThirdParty && watchThirdParty !== "energy" && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Dados do Fornecedor (Opcional)</span>
                    </div>
                    <div>
                      <Label htmlFor="supplierCNPJ">CNPJ do Fornecedor</Label>
                      <Input
                        id="supplierCNPJ"
                        placeholder="00.123.456/0001-89"
                        {...register("supplierCNPJ")}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Opcional: permite rastreamento de emissões por fornecedor
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            <div className="ml-auto flex gap-2">
              {step < 3 ? (
                <Button type="button" onClick={nextStep}>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Criando..." : "Criar Fonte de Emissão"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
