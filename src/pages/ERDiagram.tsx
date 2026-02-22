import React, { useState, useMemo, useCallback, useRef } from 'react';
import { buildERDataFromTypes } from '@/utils/erDiagramData';
import { ERDomainFilter } from '@/components/er-diagram/ERDomainFilter';
import { ERDiagramCanvas } from '@/components/er-diagram/ERDiagramCanvas';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Database, ArrowLeft, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { Badge } from '@/components/ui/badge';

const erData = buildERDataFromTypes();

export default function ERDiagram() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(
    () => new Set(erData.domains.map(d => d.id))
  );
  const [highlightedTable, setHighlightedTable] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  const visibleDomains = useMemo(
    () => erData.domains.filter(d => selectedDomains.has(d.id)),
    [selectedDomains]
  );

  const visibleTableCount = useMemo(
    () => visibleDomains.reduce((sum, d) => sum + d.tables.length, 0),
    [visibleDomains]
  );

  const visibleRelCount = useMemo(
    () => visibleDomains.reduce(
      (sum, d) => sum + d.tables.reduce((s, t) => s + t.relationships.length, 0),
      0
    ),
    [visibleDomains]
  );

  const toggleDomain = useCallback((domainId: string) => {
    setSelectedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedDomains(new Set(erData.domains.map(d => d.id)));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedDomains(new Set());
  }, []);

  const handleTableClick = useCallback((tableName: string) => {
    setHighlightedTable(tableName);
    // Find domain for table and ensure it's visible
    const table = erData.tables.find(t => t.name === tableName);
    if (table) {
      setSelectedDomains(prev => {
        if (prev.has(table.domain)) return prev;
        const next = new Set(prev);
        next.add(table.domain);
        return next;
      });
    }
    // Clear highlight after 3 seconds
    setTimeout(() => setHighlightedTable(null), 3000);
  }, []);

  const handleExportPNG = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = 'er-diagram.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(v => !v)}
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </Button>
        <Database className="h-5 w-5 text-primary" />
        <h1 className="text-base font-bold">ER Diagram</h1>
        <div className="flex items-center gap-2 ml-2">
          <Badge variant="secondary" className="text-xs">
            {visibleTableCount} / {erData.totalTables} tables
          </Badge>
          <Badge variant="outline" className="text-xs">
            {visibleRelCount} relationships
          </Badge>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <Button variant="outline" size="sm" onClick={handleExportPNG} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Export PNG
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-60 border-r border-border bg-card p-3 flex-shrink-0">
            <ERDomainFilter
              domains={erData.domains}
              selectedDomains={selectedDomains}
              onToggle={toggleDomain}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
            />
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 min-w-0" ref={canvasRef}>
          <ERDiagramCanvas
            domains={visibleDomains}
            searchQuery={searchQuery}
            highlightedTable={highlightedTable}
            onTableClick={handleTableClick}
          />
        </div>
      </div>
    </div>
  );
}
