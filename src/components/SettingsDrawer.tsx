import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings, Grid3x3, List, Download } from "lucide-react";
import { toast } from "sonner";

interface DatabaseSettings {
  viewMode: 'grid' | 'table';
  exportFormat: 'xlsx' | 'csv' | 'json';
  visibleSections: string[];
  flattenObjects: boolean;
  includeMetadata: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

interface SettingsDrawerProps {
  sections: Array<{ id: string; title: string; category: string }>;
  settings: DatabaseSettings;
  onSettingsChange: (settings: DatabaseSettings) => void;
}

const DEFAULT_SETTINGS: DatabaseSettings = {
  viewMode: 'grid',
  exportFormat: 'xlsx',
  visibleSections: [],
  flattenObjects: true,
  includeMetadata: true,
  autoRefresh: false,
  refreshInterval: 30
};

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  sections,
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState<DatabaseSettings>(settings);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const updateSetting = <K extends keyof DatabaseSettings>(
    key: K,
    value: DatabaseSettings[K]
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const toggleSectionVisibility = (sectionId: string) => {
    const visibleSections = localSettings.visibleSections.includes(sectionId)
      ? localSettings.visibleSections.filter(id => id !== sectionId)
      : [...localSettings.visibleSections, sectionId];
    
    updateSetting('visibleSections', visibleSections);
  };

  const resetToDefaults = () => {
    const defaultWithAllSections = {
      ...DEFAULT_SETTINGS,
      visibleSections: sections.map(s => s.id)
    };
    setLocalSettings(defaultWithAllSections);
    onSettingsChange(defaultWithAllSections);
    toast.success('Configurações restauradas para o padrão');
  };

  const categorizedSections = sections.reduce((acc, section) => {
    if (!acc[section.category]) {
      acc[section.category] = [];
    }
    acc[section.category].push(section);
    return acc;
  }, {} as Record<string, typeof sections>);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Configurar
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configurações do Banco de Dados</SheetTitle>
          <SheetDescription>
            Personalize a visualização e comportamento do módulo
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* View Mode */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Modo de Visualização</Label>
            <RadioGroup 
              value={localSettings.viewMode} 
              onValueChange={(value) => updateSetting('viewMode', value as 'grid' | 'table')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="grid" id="grid" />
                <Label htmlFor="grid" className="flex items-center">
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Cards
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="table" id="table" />
                <Label htmlFor="table" className="flex items-center">
                  <List className="w-4 h-4 mr-2" />
                  Tabela
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Export Settings */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Configurações de Exportação
            </Label>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="export-format">Formato Padrão</Label>
                <Select 
                  value={localSettings.exportFormat} 
                  onValueChange={(value) => updateSetting('exportFormat', value as 'xlsx' | 'csv' | 'json')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                    <SelectItem value="json">JSON (.json)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="flatten-objects">Achatar objetos aninhados</Label>
                <Switch
                  id="flatten-objects"
                  checked={localSettings.flattenObjects}
                  onCheckedChange={(checked) => updateSetting('flattenObjects', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="include-metadata">Incluir metadados</Label>
                <Switch
                  id="include-metadata"
                  checked={localSettings.includeMetadata}
                  onCheckedChange={(checked) => updateSetting('includeMetadata', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Auto Refresh */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Atualização Automática</Label>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-refresh">Ativar atualização automática</Label>
              <Switch
                id="auto-refresh"
                checked={localSettings.autoRefresh}
                onCheckedChange={(checked) => updateSetting('autoRefresh', checked)}
              />
            </div>

            {localSettings.autoRefresh && (
              <div>
                <Label htmlFor="refresh-interval">Intervalo (segundos)</Label>
                <Select 
                  value={localSettings.refreshInterval.toString()} 
                  onValueChange={(value) => updateSetting('refreshInterval', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 segundos</SelectItem>
                    <SelectItem value="30">30 segundos</SelectItem>
                    <SelectItem value="60">1 minuto</SelectItem>
                    <SelectItem value="300">5 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Section Visibility */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Seções Visíveis</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => updateSetting('visibleSections', sections.map(s => s.id))}
              >
                Mostrar Todas
              </Button>
            </div>

            <div className="space-y-4">
              {Object.entries(categorizedSections).map(([category, sectionsInCategory]) => (
                <div key={category} className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {category}
                  </Label>
                  <div className="space-y-1 ml-2">
                    {sectionsInCategory.map((section) => (
                      <div key={section.id} className="flex items-center justify-between">
                        <Label 
                          htmlFor={`section-${section.id}`} 
                          className="text-sm font-normal"
                        >
                          {section.title}
                        </Label>
                        <Switch
                          id={`section-${section.id}`}
                          checked={localSettings.visibleSections.includes(section.id)}
                          onCheckedChange={() => toggleSectionVisibility(section.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Reset Button */}
          <Button 
            variant="outline" 
            onClick={resetToDefaults}
            className="w-full"
          >
            Restaurar Configurações Padrão
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};