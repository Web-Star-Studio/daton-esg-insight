import { useState, useMemo } from "react";
import { Search, ChevronRight, ChevronDown, Check, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useStandards, useStandardItems } from "@/hooks/audit/useStandards";
import { StandardItem } from "@/services/audit/standards";

interface ItemSelectorProps {
  standardIds: string[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
}

export function ItemSelector({ standardIds, selectedItems, onSelectionChange }: ItemSelectorProps) {
  const { data: allStandards } = useStandards();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStandards, setExpandedStandards] = useState<Set<string>>(new Set(standardIds));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const standards = useMemo(() => {
    return allStandards?.filter((s) => standardIds.includes(s.id)) || [];
  }, [allStandards, standardIds]);

  const toggleStandard = (standardId: string) => {
    const newExpanded = new Set(expandedStandards);
    if (newExpanded.has(standardId)) {
      newExpanded.delete(standardId);
    } else {
      newExpanded.add(standardId);
    }
    setExpandedStandards(newExpanded);
  };

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleSelection = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter((id) => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const selectAllFromStandard = (items: StandardItem[]) => {
    const questionItems = items
      .filter((item) => item.field_type === "question")
      .map((item) => item.id);
    const allItemIds = getAllItemIds(items);
    const allSelected = allItemIds.every((id) => selectedItems.includes(id));
    
    if (allSelected) {
      onSelectionChange(selectedItems.filter((id) => !allItemIds.includes(id)));
    } else {
      const newSelection = new Set([...selectedItems, ...allItemIds]);
      onSelectionChange(Array.from(newSelection));
    }
  };

  const getAllItemIds = (items: StandardItem[]): string[] => {
    const ids: string[] = [];
    const collectIds = (itemList: StandardItem[]) => {
      itemList.forEach((item) => {
        if (item.field_type === "question") {
          ids.push(item.id);
        }
        if (item.children) {
          collectIds(item.children);
        }
      });
    };
    collectIds(items);
    return ids;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar itens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Badge variant="outline">
          {selectedItems.length} selecionados
        </Badge>
      </div>

      <ScrollArea className="flex-1 border rounded-md">
        <div className="p-2">
          {standards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center text-sm">
                Selecione normas no passo anterior para ver os itens
              </p>
            </div>
          ) : (
            standards.map((standard) => (
              <StandardItemsSection
                key={standard.id}
                standardId={standard.id}
                standardName={standard.name}
                standardCode={standard.code}
                isExpanded={expandedStandards.has(standard.id)}
                onToggle={() => toggleStandard(standard.id)}
                selectedItems={selectedItems}
                onToggleSelection={toggleSelection}
                onSelectAll={selectAllFromStandard}
                searchTerm={searchTerm}
                expandedItems={expandedItems}
                onToggleItem={toggleItem}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface StandardItemsSectionProps {
  standardId: string;
  standardName: string;
  standardCode: string;
  isExpanded: boolean;
  onToggle: () => void;
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  onSelectAll: (items: StandardItem[]) => void;
  searchTerm: string;
  expandedItems: Set<string>;
  onToggleItem: (id: string) => void;
}

function StandardItemsSection({
  standardId,
  standardName,
  standardCode,
  isExpanded,
  onToggle,
  selectedItems,
  onToggleSelection,
  onSelectAll,
  searchTerm,
  expandedItems,
  onToggleItem,
}: StandardItemsSectionProps) {
  const { data: items } = useStandardItems(standardId);

  const filteredItems = useMemo(() => {
    if (!searchTerm || !items) return items;
    
    const filterItems = (itemList: StandardItem[]): StandardItem[] => {
      return itemList
        .map((item) => {
          const matchesSearch =
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.item_number.toLowerCase().includes(searchTerm.toLowerCase());

          const filteredChildren = item.children
            ? filterItems(item.children)
            : [];

          if (matchesSearch || filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
          return null;
        })
        .filter(Boolean) as StandardItem[];
    };

    return filterItems(items);
  }, [items, searchTerm]);

  const questionCount = useMemo(() => {
    if (!items) return 0;
    const countQuestions = (itemList: StandardItem[]): number => {
      return itemList.reduce((count, item) => {
        const childCount = item.children ? countQuestions(item.children) : 0;
        return count + (item.field_type === "question" ? 1 : 0) + childCount;
      }, 0);
    };
    return countQuestions(items);
  }, [items]);

  const selectedCount = useMemo(() => {
    if (!items) return 0;
    const getAllIds = (itemList: StandardItem[]): string[] => {
      const ids: string[] = [];
      itemList.forEach((item) => {
        if (item.field_type === "question") ids.push(item.id);
        if (item.children) ids.push(...getAllIds(item.children));
      });
      return ids;
    };
    const allIds = getAllIds(items);
    return allIds.filter((id) => selectedItems.includes(id)).length;
  }, [items, selectedItems]);

  return (
    <div className="mb-2">
      <div
        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
        onClick={onToggle}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="font-medium text-sm flex-1">{standardCode}</span>
        <Badge variant="outline" className="text-xs">
          {selectedCount}/{questionCount}
        </Badge>
        {items && items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onSelectAll(items);
            }}
          >
            {selectedCount === questionCount ? "Desmarcar" : "Selecionar"} Todos
          </Button>
        )}
      </div>

      {isExpanded && filteredItems && (
        <div className="ml-4 border-l pl-2">
          {filteredItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              selectedItems={selectedItems}
              onToggleSelection={onToggleSelection}
              expandedItems={expandedItems}
              onToggleItem={onToggleItem}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ItemRowProps {
  item: StandardItem;
  selectedItems: string[];
  onToggleSelection: (id: string) => void;
  expandedItems: Set<string>;
  onToggleItem: (id: string) => void;
  depth: number;
}

function ItemRow({
  item,
  selectedItems,
  onToggleSelection,
  expandedItems,
  onToggleItem,
  depth,
}: ItemRowProps) {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.has(item.id);
  const isSelected = selectedItems.includes(item.id);
  const isQuestion = item.field_type === "question";

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 text-sm",
          depth > 0 && "ml-4"
        )}
      >
        {hasChildren ? (
          <button onClick={() => onToggleItem(item.id)} className="p-0.5">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {isQuestion ? (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(item.id)}
          />
        ) : (
          <div className="w-4" />
        )}

        <span className="font-mono text-xs text-muted-foreground min-w-[50px]">
          {item.item_number}
        </span>
        <span className="flex-1 truncate">{item.title}</span>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {item.children!.map((child) => (
            <ItemRow
              key={child.id}
              item={child}
              selectedItems={selectedItems}
              onToggleSelection={onToggleSelection}
              expandedItems={expandedItems}
              onToggleItem={onToggleItem}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
