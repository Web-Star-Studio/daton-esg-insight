import React, { useState } from 'react';
import { ERTable, DOMAIN_DEFS } from '@/utils/erDiagramData';
import { ChevronDown, ChevronRight, Key, Link2 } from 'lucide-react';

interface EREntityBoxProps {
  table: ERTable;
  isHighlighted?: boolean;
  onTableClick?: (tableName: string) => void;
}

export const EREntityBox = React.memo(function EREntityBox({
  table,
  isHighlighted,
  onTableClick,
}: EREntityBoxProps) {
  const [expanded, setExpanded] = useState(false);
  const domainDef = DOMAIN_DEFS[table.domain] || DOMAIN_DEFS.core;
  const fkCount = table.relationships.length;

  return (
    <div
      className={`rounded-lg border shadow-sm transition-all cursor-pointer select-none ${
        isHighlighted
          ? 'ring-2 ring-primary shadow-md scale-[1.02]'
          : 'hover:shadow-md hover:scale-[1.01]'
      }`}
      style={{
        borderColor: domainDef.color + '40',
        backgroundColor: `${domainDef.color}08`,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-lg"
        style={{ backgroundColor: domainDef.color + '18' }}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
        )}
        <span className="font-mono text-xs font-semibold truncate flex-1">
          {table.name}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {fkCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Link2 className="h-2.5 w-2.5" />
              {fkCount}
            </span>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 py-2 space-y-1.5 text-[11px] max-h-60 overflow-y-auto">
          {/* Columns */}
          <div className="flex items-center gap-1 text-muted-foreground font-medium border-b border-border/40 pb-1 mb-1">
            <Key className="h-2.5 w-2.5" /> Columns
          </div>
          <div className="font-mono space-y-0.5">
            <div className="flex items-center gap-1.5 text-primary font-semibold">
              <Key className="h-2.5 w-2.5 text-amber-500" />
              <span>id</span>
              <span className="text-muted-foreground ml-auto">UUID</span>
            </div>
            {/* Show company_id if it has a FK to companies */}
            {table.relationships.some(r => r.targetTable === 'companies') && (
              <div className="flex items-center gap-1.5">
                <Link2 className="h-2.5 w-2.5 text-blue-500" />
                <span>company_id</span>
                <span className="text-muted-foreground ml-auto">UUID</span>
              </div>
            )}
          </div>

          {/* Relationships */}
          {fkCount > 0 && (
            <>
              <div className="flex items-center gap-1 text-muted-foreground font-medium border-b border-border/40 pb-1 mt-2 mb-1">
                <Link2 className="h-2.5 w-2.5" /> Relationships
              </div>
              <div className="space-y-0.5">
                {table.relationships.map((rel, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTableClick?.(rel.targetTable);
                    }}
                    className="flex items-center gap-1.5 w-full text-left hover:bg-accent/50 rounded px-1 py-0.5 transition-colors"
                  >
                    <span className="text-muted-foreground">{rel.sourceColumns.join(', ')}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-primary font-medium">{rel.targetTable}</span>
                    {rel.isOneToOne && (
                      <span className="text-[9px] bg-accent rounded px-1 ml-auto">1:1</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});
