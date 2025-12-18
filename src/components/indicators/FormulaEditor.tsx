import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FormulaEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const AVAILABLE_FUNCTIONS = [
  { name: "SOMA", syntax: "SOMA(valor1, valor2, ...)", description: "Soma valores" },
  { name: "MEDIA", syntax: "MEDIA(valor1, valor2, ...)", description: "Calcula média" },
  { name: "MAXIMO", syntax: "MAXIMO(valor1, valor2, ...)", description: "Retorna o maior valor" },
  { name: "MINIMO", syntax: "MINIMO(valor1, valor2, ...)", description: "Retorna o menor valor" },
  { name: "SE", syntax: "SE(condição, valor_se_verdadeiro, valor_se_falso)", description: "Condição" },
  { name: "ARRED", syntax: "ARRED(número, casas_decimais)", description: "Arredonda valor" },
];

const AVAILABLE_VARIABLES = [
  { name: "[COLETA]", description: "Valor coletado do período" },
  { name: "[META]", description: "Meta definida" },
  { name: "[ANTERIOR]", description: "Valor do período anterior" },
  { name: "[ACUMULADO]", description: "Valor acumulado do ano" },
];

export function FormulaEditor({ value, onChange }: FormulaEditorProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFormula = (formula: string) => {
    if (!formula.trim()) {
      setIsValid(null);
      setError(null);
      return;
    }

    // Basic validation
    try {
      // Check balanced parentheses
      let balance = 0;
      for (const char of formula) {
        if (char === "(") balance++;
        if (char === ")") balance--;
        if (balance < 0) throw new Error("Parênteses desbalanceados");
      }
      if (balance !== 0) throw new Error("Parênteses desbalanceados");

      // Check for valid functions
      const functionPattern = /([A-Z]+)\(/g;
      let match;
      while ((match = functionPattern.exec(formula)) !== null) {
        const funcName = match[1];
        if (!AVAILABLE_FUNCTIONS.some(f => f.name === funcName)) {
          throw new Error(`Função desconhecida: ${funcName}`);
        }
      }

      setIsValid(true);
      setError(null);
    } catch (err: any) {
      setIsValid(false);
      setError(err.message);
    }
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    validateFormula(newValue);
  };

  const insertText = (text: string) => {
    onChange(value + text);
    validateFormula(value + text);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder="Ex: (SOMA([COLETA]) / [META]) * 100"
          className="font-mono text-sm min-h-[100px]"
        />
        {isValid !== null && (
          <div className="absolute right-2 top-2">
            {isValid ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive" />
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-3 w-3 mr-1" />
              Funções
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Funções Disponíveis</h4>
              <div className="space-y-1">
                {AVAILABLE_FUNCTIONS.map(func => (
                  <button
                    key={func.name}
                    className="w-full text-left p-2 rounded hover:bg-muted text-sm"
                    onClick={() => insertText(func.name + "()")}
                  >
                    <div className="font-mono text-primary">{func.syntax}</div>
                    <div className="text-muted-foreground text-xs">{func.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-3 w-3 mr-1" />
              Variáveis
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Variáveis Disponíveis</h4>
              <div className="space-y-1">
                {AVAILABLE_VARIABLES.map(variable => (
                  <button
                    key={variable.name}
                    className="w-full text-left p-2 rounded hover:bg-muted text-sm"
                    onClick={() => insertText(variable.name)}
                  >
                    <div className="font-mono text-primary">{variable.name}</div>
                    <div className="text-muted-foreground text-xs">{variable.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap gap-1">
        {["+", "-", "*", "/", "(", ")", ","].map(op => (
          <Badge
            key={op}
            variant="outline"
            className="cursor-pointer hover:bg-muted"
            onClick={() => insertText(` ${op} `)}
          >
            {op}
          </Badge>
        ))}
      </div>
    </div>
  );
}
