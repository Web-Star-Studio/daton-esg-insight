import React, { useState, useRef, useCallback, useMemo } from 'react';
import { ERDomain, ERTable } from '@/utils/erDiagramData';
import { EREntityBox } from './EREntityBox';

interface ERDiagramCanvasProps {
  domains: ERDomain[];
  searchQuery: string;
  highlightedTable: string | null;
  onTableClick: (tableName: string) => void;
}

export const ERDiagramCanvas = React.memo(function ERDiagramCanvas({
  domains,
  searchQuery,
  highlightedTable,
  onTableClick,
}: ERDiagramCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.2), 3));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Filter tables by search
  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return domains;
    const q = searchQuery.toLowerCase();
    return domains
      .map(d => ({
        ...d,
        tables: d.tables.filter(t =>
          t.name.toLowerCase().includes(q) ||
          t.relationships.some(r => r.targetTable.toLowerCase().includes(q))
        ),
      }))
      .filter(d => d.tables.length > 0);
  }, [domains, searchQuery]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-background cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={() => setZoom(z => Math.min(z * 1.2, 3))}
          className="w-8 h-8 rounded-md bg-card border border-border shadow-sm flex items-center justify-center text-sm font-bold hover:bg-accent transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z * 0.8, 0.2))}
          className="w-8 h-8 rounded-md bg-card border border-border shadow-sm flex items-center justify-center text-sm font-bold hover:bg-accent transition-colors"
        >
          −
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="w-8 h-8 rounded-md bg-card border border-border shadow-sm flex items-center justify-center text-[10px] font-medium hover:bg-accent transition-colors"
        >
          1:1
        </button>
      </div>

      {/* Canvas */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
        className="p-6"
      >
        <div className="space-y-8">
          {filteredDomains.map(domain => (
            <div key={domain.id}>
              {/* Domain header */}
              <div className="flex items-center gap-2 mb-3 sticky top-0 z-10">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: domain.color }}
                />
                <h3 className="text-sm font-bold text-foreground">
                  {domain.icon} {domain.name}
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({domain.tables.length} tables)
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              {/* Table grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
                {domain.tables.map(table => (
                  <EREntityBox
                    key={table.name}
                    table={table}
                    isHighlighted={highlightedTable === table.name}
                    onTableClick={onTableClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredDomains.length === 0 && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No tables match your search or filter criteria.
          </div>
        )}
      </div>
    </div>
  );
});
