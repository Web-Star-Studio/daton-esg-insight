import { useState } from "react";
import { Plus, X, Wrench, Package, Ruler, Cog, Users, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IshikawaData {
  metodo: string[];
  material: string[];
  medida: string[];
  maquina: string[];
  mao_obra: string[];
  meio_ambiente: string[];
}

interface IshikawaDiagramProps {
  data: IshikawaData;
  onChange: (data: IshikawaData) => void;
  rootCause: string;
  onRootCauseChange: (value: string) => void;
}

const categories = [
  { key: "metodo", label: "Método", icon: Wrench, color: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "material", label: "Material", icon: Package, color: "bg-green-100 text-green-800 border-green-200" },
  { key: "medida", label: "Medida", icon: Ruler, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { key: "maquina", label: "Máquina", icon: Cog, color: "bg-orange-100 text-orange-800 border-orange-200" },
  { key: "mao_obra", label: "Mão de Obra", icon: Users, color: "bg-purple-100 text-purple-800 border-purple-200" },
  { key: "meio_ambiente", label: "Meio Ambiente", icon: Leaf, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
] as const;

export function IshikawaDiagram({ data, onChange, rootCause, onRootCauseChange }: IshikawaDiagramProps) {
  const [newItems, setNewItems] = useState<Record<string, string>>({
    metodo: "",
    material: "",
    medida: "",
    maquina: "",
    mao_obra: "",
    meio_ambiente: "",
  });

  const addItem = (category: keyof IshikawaData) => {
    const value = newItems[category].trim();
    if (!value) return;

    onChange({
      ...data,
      [category]: [...data[category], value],
    });
    setNewItems({ ...newItems, [category]: "" });
  };

  const removeItem = (category: keyof IshikawaData, index: number) => {
    onChange({
      ...data,
      [category]: data[category].filter((_, i) => i !== index),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, category: keyof IshikawaData) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(category);
    }
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-muted/30">
      <div className="text-center mb-4">
        <h4 className="font-medium text-lg">Diagrama de Ishikawa (6M)</h4>
        <p className="text-sm text-muted-foreground">
          Adicione possíveis causas em cada categoria para identificar a causa raiz
        </p>
      </div>

      {/* Visual Diagram Representation */}
      <div className="relative bg-background rounded-lg p-6 border">
        {/* Main spine */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex-1 h-1 bg-primary/20" />
          <div className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-center min-w-[200px]">
            {rootCause || "Efeito / Problema"}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(({ key, label, icon: Icon, color }) => (
            <Card key={key} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <Label className="font-medium">{label}</Label>
              </div>

              {/* Items list */}
              <div className="space-y-2 mb-3 min-h-[60px]">
                {data[key as keyof IshikawaData].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted/50 px-2 py-1 rounded text-sm group"
                  >
                    <span className="truncate">{item}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => removeItem(key as keyof IshikawaData, index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {data[key as keyof IshikawaData].length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Nenhuma causa adicionada</p>
                )}
              </div>

              {/* Add new item */}
              <div className="flex gap-1">
                <Input
                  placeholder="Nova causa..."
                  value={newItems[key]}
                  onChange={(e) => setNewItems({ ...newItems, [key]: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, key as keyof IshikawaData)}
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0"
                  onClick={() => addItem(key as keyof IshikawaData)}
                  disabled={!newItems[key].trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">Causas identificadas:</span>
        {categories.map(({ key, label, color }) => (
          <Badge key={key} variant="outline" className={data[key as keyof IshikawaData].length > 0 ? color : ""}>
            {label}: {data[key as keyof IshikawaData].length}
          </Badge>
        ))}
      </div>
    </div>
  );
}
