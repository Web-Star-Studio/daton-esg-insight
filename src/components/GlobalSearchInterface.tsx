import { useState } from 'react'
import { Search, X, Filter, TrendingUp, FileText, Target, Shield, Leaf } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { useAllDatabaseData } from '@/hooks/useAllDatabaseData'

interface GlobalSearchInterfaceProps {
  onNavigate?: (path: string) => void
  className?: string
}

export function GlobalSearchInterface({ onNavigate, className }: GlobalSearchInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { sections, isLoading } = useAllDatabaseData()
  const {
    searchTerm,
    setSearchTerm,
    activeFilters,
    addFilter,
    removeFilter,
    clearAll,
    results,
    stats
  } = useGlobalSearch(sections)

  const getIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'emissions':
        return <Leaf className="h-4 w-4 text-green-600" />
      case 'licenses':
        return <Shield className="h-4 w-4 text-blue-600" />
      case 'goals':
        return <Target className="h-4 w-4 text-purple-600" />
      case 'documents':
        return <FileText className="h-4 w-4 text-orange-600" />
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />
    }
  }

  const availableFilters = [
    'emissions', 'licenses', 'goals', 'documents', 'assets', 
    'active', 'pending', 'completed'
  ]

  const handleItemClick = (item: any, category: string) => {
    if (onNavigate) {
      // Determine navigation path based on category and item
      const navigationPaths: { [key: string]: string } = {
        'licenses': '/licenciamento',
        'goals': '/metas',
        'documents': '/documentos',
        'assets': '/ativos',
        'emissions': '/inventario-gee'
      }
      
      const basePath = navigationPaths[category.toLowerCase()] || '/'
      const fullPath = item.id ? `${basePath}/${item.id}` : basePath
      
      onNavigate(fullPath)
      setIsOpen(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className={`gap-2 ${className}`}
      >
        <Search className="h-4 w-4" />
        Busca Global
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Busca Global</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar em licenças, metas, documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {availableFilters.map((filter) => (
            <Badge
              key={filter}
              variant={activeFilters.includes(filter) ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => 
                activeFilters.includes(filter) 
                  ? removeFilter(filter)
                  : addFilter(filter)
              }
            >
              {filter}
            </Badge>
          ))}
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-6 text-xs"
            >
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Search Stats */}
        <div className="text-sm text-muted-foreground">
          {searchTerm && (
            <>
              {stats.totalResults} resultado(s) encontrado(s) em {stats.sectionsWithResults} categoria(s)
            </>
          )}
        </div>

        {/* Results */}
        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando dados...
              </div>
            ) : results.length === 0 && searchTerm ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum resultado encontrado para "{searchTerm}"
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Digite algo para pesquisar
              </div>
            ) : (
              results.map((section) => (
                section.count > 0 && (
                  <div key={section.category}>
                    <div className="flex items-center gap-2 mb-2">
                      {getIcon(section.category)}
                      <h3 className="font-medium capitalize">{section.category}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {section.count}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 ml-6">
                      {section.data.slice(0, 5).map((item: any, index: number) => (
                        <Card 
                          key={index}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleItemClick(item, section.category)}
                        >
                          <CardContent className="p-3">
                            <div className="font-medium text-sm">
                              {item.name || item.title || item.file_name || 'Item'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.description || item.type || item.category || ''}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {section.data.length > 5 && (
                        <div className="text-xs text-muted-foreground text-center py-2">
                          +{section.data.length - 5} mais resultado(s)
                        </div>
                      )}
                    </div>
                    
                    <Separator className="my-4" />
                  </div>
                )
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-center">
          Use as setas ↑↓ para navegar • Enter para selecionar • Esc para fechar
        </div>
      </div>
    </div>
  )
}