import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, FileText, HelpCircle, AlignLeft, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useStandardItems, useDeleteStandardItem } from "@/hooks/audit/useStandards";
import { StandardItem, AuditStandard } from "@/services/audit/standards";
import { ItemFormDialog } from "./ItemFormDialog";

interface StandardItemsTreeProps {
  standard: AuditStandard;
}

interface TreeNodeProps {
  item: StandardItem;
  standard: AuditStandard;
  onEdit: (item: StandardItem) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}

const fieldTypeConfig = {
  question: { icon: HelpCircle, label: "Pergunta", color: "text-blue-500" },
  guidance: { icon: FileText, label: "Orientação", color: "text-amber-500" },
  text: { icon: AlignLeft, label: "Texto", color: "text-green-500" },
};

function TreeNode({ item, standard, onEdit, onAddChild, onDelete, depth = 0 }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const config = fieldTypeConfig[item.field_type];
  const Icon = config.icon;

  return (
    <div className="select-none">
      <div
        className={cn(
          "group flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors",
          depth > 0 && "ml-6"
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
        
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:bg-muted rounded"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        <Icon className={cn("h-4 w-4 flex-shrink-0", config.color)} />

        <span className="font-mono text-sm text-muted-foreground min-w-[60px]">
          {item.item_number}
        </span>

        <span className="flex-1 text-sm truncate">{item.title}</span>

        {item.field_type === 'question' && (
          <Badge variant="outline" className="text-xs">
            Peso: {item.weight}
          </Badge>
        )}

        {item.requires_justification && (
          <Badge variant="secondary" className="text-xs">
            Justif.
          </Badge>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddChild(item.id)}
            title="Adicionar sub-item"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(item)}
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => onDelete(item.id)}
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="border-l ml-4">
          {item.children!.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              standard={standard}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function StandardItemsTree({ standard }: StandardItemsTreeProps) {
  const { data: items, isLoading } = useStandardItems(standard.id);
  const deleteItem = useDeleteStandardItem();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StandardItem | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAddItem = (parentId?: string) => {
    setEditingItem(null);
    setParentIdForNew(parentId);
    setFormOpen(true);
  };

  const handleEditItem = (item: StandardItem) => {
    setEditingItem(item);
    setParentIdForNew(undefined);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteItem.mutateAsync({ id: deleteId, standardId: standard.id });
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <HelpCircle className="h-4 w-4 text-blue-500" />
            Pergunta
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-amber-500" />
            Orientação
          </span>
          <span className="flex items-center gap-1">
            <AlignLeft className="h-4 w-4 text-green-500" />
            Texto
          </span>
        </div>
        <Button onClick={() => handleAddItem()}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Item
        </Button>
      </div>

      {items?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Nenhum item cadastrado nesta norma</p>
          <Button onClick={() => handleAddItem()}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Primeiro Item
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg p-2">
          {items?.map((item) => (
            <TreeNode
              key={item.id}
              item={item}
              standard={standard}
              onEdit={handleEditItem}
              onAddChild={handleAddItem}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        standard={standard}
        item={editingItem}
        parentId={parentIdForNew}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Todos os sub-itens também serão excluídos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
