import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentPermissionsService } from '@/services/gedDocuments';
import { Shield, Plus, User, Users, Calendar, Trash2, Eye, Edit, CheckCircle2, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface DocumentPermissionsModalProps {
  documentId?: string;
  folderId?: string;
  documentName?: string;
  folderName?: string;
}

export const DocumentPermissionsModal: React.FC<DocumentPermissionsModalProps> = ({
  documentId,
  folderId,
  documentName,
  folderName
}) => {
  const [isGrantingPermission, setIsGrantingPermission] = useState(false);
  const [newPermission, setNewPermission] = useState({
    user_id: '',
    role: '',
    permission_level: '' as 'leitura' | 'escrita' | 'aprovacao' | 'admin',
    expires_at: ''
  });
  const queryClient = useQueryClient();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['document-permissions', documentId, folderId],
    queryFn: () => documentPermissionsService.getPermissions(documentId, folderId),
    enabled: !!(documentId || folderId),
  });

  const grantPermissionMutation = useMutation({
    mutationFn: (data: any) => documentPermissionsService.grantPermission(data),
    onSuccess: () => {
      toast.success('Permissão concedida com sucesso');
      queryClient.invalidateQueries({ queryKey: ['document-permissions'] });
      setIsGrantingPermission(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erro ao conceder permissão');
    }
  });

  const revokePermissionMutation = useMutation({
    mutationFn: (id: string) => documentPermissionsService.revokePermission(id),
    onSuccess: () => {
      toast.success('Permissão revogada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['document-permissions'] });
    },
    onError: () => {
      toast.error('Erro ao revogar permissão');
    }
  });

  const resetForm = () => {
    setNewPermission({
      user_id: '',
      role: '',
      permission_level: 'leitura',
      expires_at: ''
    });
  };

  const handleGrantPermission = () => {
    if (!newPermission.permission_level) {
      toast.error('Selecione um nível de permissão');
      return;
    }

    if (!newPermission.user_id && !newPermission.role) {
      toast.error('Selecione um usuário ou função');
      return;
    }

    const permissionData = {
      ...(documentId && { document_id: documentId }),
      ...(folderId && { folder_id: folderId }),
      permission_level: newPermission.permission_level,
      granted_by_user_id: 'current-user', // TODO: Get current user ID
      ...(newPermission.user_id && { user_id: newPermission.user_id }),
      ...(newPermission.role && { role: newPermission.role }),
      ...(newPermission.expires_at && { expires_at: newPermission.expires_at }),
      is_active: true
    };

    grantPermissionMutation.mutate(permissionData);
  };

  const getPermissionLevelBadge = (level: string) => {
    switch (level) {
      case 'leitura':
        return <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" />Leitura</Badge>;
      case 'escrita':
        return <Badge variant="secondary" className="gap-1"><Edit className="h-3 w-3" />Escrita</Badge>;
      case 'aprovacao':
        return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Aprovação</Badge>;
      case 'admin':
        return <Badge variant="destructive" className="gap-1"><Settings className="h-3 w-3" />Admin</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getPermissionIcon = (permission: any) => {
    return permission.user_id ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />;
  };

  const getPermissionTarget = (permission: any) => {
    if (permission.user_id) {
      return `Usuário: ${permission.user_id}`;
    }
    if (permission.role) {
      return `Função: ${permission.role}`;
    }
    return 'Desconhecido';
  };

  const isExpired = (permission: any) => {
    if (!permission.expires_at) return false;
    return new Date(permission.expires_at) < new Date();
  };

  const isExpiringSoon = (permission: any) => {
    if (!permission.expires_at) return false;
    const expiryDate = new Date(permission.expires_at);
    const today = new Date();
    const daysDiff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 7 && daysDiff > 0;
  };

  const activePermissions = permissions?.filter(p => p.is_active && !isExpired(p));
  const expiredPermissions = permissions?.filter(p => !p.is_active || isExpired(p));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          Permissões
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissões - {documentName || folderName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Grant Permission Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Controle de Acesso
                  <Button
                    variant="outline"
                    onClick={() => setIsGrantingPermission(!isGrantingPermission)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Conceder Permissão
                  </Button>
                </CardTitle>
                <CardDescription>
                  Gerencie quem pode acessar e modificar este {documentId ? 'documento' : 'pasta'}
                </CardDescription>
              </CardHeader>

              {isGrantingPermission && (
                <CardContent className="space-y-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="user_id">ID do Usuário</Label>
                      <Input
                        id="user_id"
                        value={newPermission.user_id}
                        onChange={(e) => setNewPermission(prev => ({ 
                          ...prev, 
                          user_id: e.target.value,
                          role: '' // Clear role when user is selected
                        }))}
                        placeholder="ID do usuário (opcional se função for selecionada)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Função/Papel</Label>
                      <Input
                        id="role"
                        value={newPermission.role}
                        onChange={(e) => setNewPermission(prev => ({ 
                          ...prev, 
                          role: e.target.value,
                          user_id: '' // Clear user when role is selected
                        }))}
                        placeholder="Nome da função (opcional se usuário for selecionado)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="permission_level">Nível de Permissão*</Label>
                      <Select
                        value={newPermission.permission_level}
                        onValueChange={(value: any) => setNewPermission(prev => ({ ...prev, permission_level: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível de permissão" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leitura">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Leitura - Apenas visualizar
                            </div>
                          </SelectItem>
                          <SelectItem value="escrita">
                            <div className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Escrita - Visualizar e editar
                            </div>
                          </SelectItem>
                          <SelectItem value="aprovacao">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Aprovação - Visualizar, editar e aprovar
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Admin - Controle total
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="expires_at">Data de Expiração (Opcional)</Label>
                      <Input
                        id="expires_at"
                        type="datetime-local"
                        value={newPermission.expires_at}
                        onChange={(e) => setNewPermission(prev => ({ ...prev, expires_at: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleGrantPermission}
                      disabled={grantPermissionMutation.isPending}
                      className="gap-2"
                    >
                      <Shield className="h-4 w-4" />
                      Conceder Permissão
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsGrantingPermission(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Active Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Permissões Ativas</span>
                  <Badge variant="outline">{activePermissions?.length || 0} permissões</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Carregando permissões...</div>
                  </div>
                ) : !activePermissions?.length ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma permissão ativa encontrada</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use o botão "Conceder Permissão" para adicionar acesso
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activePermissions.map((permission) => (
                      <Card key={permission.id} className={`transition-all hover:shadow-sm ${isExpiringSoon(permission) ? 'border-yellow-200 bg-yellow-50' : ''}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getPermissionIcon(permission)}
                              <div>
                                <p className="font-medium text-sm">
                                  {getPermissionTarget(permission)}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {getPermissionLevelBadge(permission.permission_level)}
                                  {isExpiringSoon(permission) && (
                                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                                      Expira em breve
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => revokePermissionMutation.mutate(permission.id)}
                                  disabled={revokePermissionMutation.isPending}
                                  className="gap-1 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Revogar
                                </Button>
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Concedida {formatDistanceToNow(new Date(permission.granted_at), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </div>
                                {permission.expires_at && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    Expira em {new Date(permission.expires_at).toLocaleDateString('pt-BR')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expired/Revoked Permissions */}
            {expiredPermissions && expiredPermissions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Permissões Expiradas/Revogadas</span>
                    <Badge variant="secondary">{expiredPermissions.length} permissões</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expiredPermissions.map((permission) => (
                      <Card key={permission.id} className="opacity-60 transition-all hover:shadow-sm">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getPermissionIcon(permission)}
                              <div>
                                <p className="font-medium text-sm text-muted-foreground">
                                  {getPermissionTarget(permission)}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {getPermissionLevelBadge(permission.permission_level)}
                                  <Badge variant="secondary">
                                    {!permission.is_active ? 'Revogada' : 'Expirada'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="text-right text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Concedida {formatDistanceToNow(new Date(permission.granted_at), {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </div>
                              {permission.expires_at && isExpired(permission) && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  Expirou em {new Date(permission.expires_at).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};