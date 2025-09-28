import { useState, useEffect } from 'react'
import { Eye, EyeOff, Type, Palette, Keyboard, MousePointer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'

interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  focusVisible: boolean
  textSize: number
}

interface AccessibilityHelperProps {
  embedded?: boolean;
}

export function AccessibilityHelper({ embedded = false }: AccessibilityHelperProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    focusVisible: false,
    textSize: 100
  })

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('accessibility-settings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    // Apply settings to document
    const root = document.documentElement

    if (settings.highContrast) {
      root.style.setProperty('--contrast-multiplier', '1.5')
      root.classList.add('high-contrast')
    } else {
      root.style.removeProperty('--contrast-multiplier')
      root.classList.remove('high-contrast')
    }

    if (settings.largeText || settings.textSize !== 100) {
      root.style.fontSize = `${settings.textSize}%`
    } else {
      root.style.removeProperty('font-size')
    }

    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms')
      root.classList.add('reduced-motion')
    } else {
      root.style.removeProperty('--animation-duration')
      root.classList.remove('reduced-motion')
    }

    if (settings.focusVisible) {
      root.classList.add('focus-visible')
    } else {
      root.classList.remove('focus-visible')
    }

    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))
  }, [settings])

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings({
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      focusVisible: false,
      textSize: 100
    })
  }

  if (embedded) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Configurações de Acessibilidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="text-sm">Alto Contraste</span>
            </div>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={(checked) => updateSetting('highContrast', checked)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span className="text-sm">Tamanho do Texto: {settings.textSize}%</span>
            </div>
            <Slider
              value={[settings.textSize]}
              onValueChange={(value) => updateSetting('textSize', value[0])}
              min={75}
              max={150}
              step={25}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              <span className="text-sm">Reduzir Animações</span>
            </div>
            <Switch
              checked={settings.reducedMotion}
              onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              <span className="text-sm">Foco Visível</span>
            </div>
            <Switch
              checked={settings.focusVisible}
              onCheckedChange={(checked) => updateSetting('focusVisible', checked)}
            />
          </div>

          <div className="pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={resetSettings}
              className="w-full"
            >
              Resetar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 shadow-lg"
        aria-label="Abrir configurações de acessibilidade"
      >
        <Eye className="h-4 w-4" />
      </Button>

      {isOpen && (
        <Card className="fixed top-16 left-4 z-50 w-80 shadow-lg animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Acessibilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="text-sm">Alto Contraste</span>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <span className="text-sm">Tamanho do Texto: {settings.textSize}%</span>
              </div>
              <Slider
                value={[settings.textSize]}
                onValueChange={(value) => updateSetting('textSize', value[0])}
                min={75}
                max={150}
                step={25}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                <span className="text-sm">Reduzir Animações</span>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                <span className="text-sm">Foco Visível</span>
              </div>
              <Switch
                checked={settings.focusVisible}
                onCheckedChange={(checked) => updateSetting('focusVisible', checked)}
              />
            </div>

            <div className="pt-3 border-t border-border flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetSettings}
                className="flex-1"
              >
                Resetar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}