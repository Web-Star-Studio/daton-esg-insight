import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, Loader2, Users, Building2, FileWarning } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { supabase } from '@/integrations/supabase/client';

export function DeleteAccountSection() {
  const { user } = useAuth();
  const deleteAccountMutation = useDeleteAccount();
  
  const [isOwner, setIsOwner] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [confirmText, setConfirmText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOwnership = async () => {
      const companyId = user?.company?.id;
      if (!user?.id || !companyId) {
        setIsLoading(false);
        return;
      }

      try {
        // Check user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .maybeSingle();

        const isSuperAdmin = roleData?.role === 'super_admin';
        setIsOwner(isSuperAdmin);

        // Get company name
        const { data: companyData } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();

        setCompanyName(companyData?.name || 'Sua Organização');

        // Get user count
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId);

        setUserCount(count || 1);
      } catch (error) {
        console.error('Error checking ownership:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOwnership();
  }, [user?.id, user?.company?.id]);

  const handleDelete = async () => {
    if (isOwner && confirmText !== 'EXCLUIR TUDO') {
      return;
    }

    deleteAccountMutation.mutate({ confirmText });
  };

  const isConfirmValid = isOwner 
    ? confirmText === 'EXCLUIR TUDO' 
    : confirmText === user?.email;

  if (isLoading) {
    return (
      <Card className="border-destructive/50 mt-6">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/50 mt-6">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Zona de Perigo
        </CardTitle>
        <CardDescription>
          Ações irreversíveis para sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOwner && (
          <Alert variant="destructive">
            <Building2 className="h-4 w-4" />
            <AlertTitle>Você é o dono desta organização</AlertTitle>
            <AlertDescription>
              Excluir sua conta irá excluir <strong>permanentemente</strong> a organização 
              "{companyName}" e todos os dados de <strong>{userCount} usuário(s)</strong>.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <FileWarning className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              {isOwner ? (
                <span>
                  Todos os documentos, relatórios, metas, treinamentos, não conformidades, 
                  licenças e outros dados da empresa serão excluídos permanentemente.
                </span>
              ) : (
                <span>
                  Seus dados pessoais e preferências serão removidos. 
                  Os dados da empresa continuarão disponíveis para outros usuários.
                </span>
              )}
            </div>
          </div>

          {isOwner && userCount > 1 && (
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                As contas de todos os {userCount - 1} outros usuários também serão excluídas.
              </span>
            </div>
          )}
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-4">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Minha Conta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {isOwner ? 'Excluir Organização' : 'Excluir Conta'}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  {isOwner ? (
                    <>
                      <Alert variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>ATENÇÃO</AlertTitle>
                        <AlertDescription>
                          Você está prestes a excluir a organização "{companyName}" 
                          e <strong>TODOS os dados</strong> de forma permanente.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="text-sm space-y-2">
                        <p className="font-medium">Esta ação irá excluir:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Sua conta e todos os seus dados</li>
                          <li>A organização "{companyName}"</li>
                          <li>Todas as {userCount} contas de usuários</li>
                          <li>Todos os documentos e relatórios</li>
                          <li>Todas as metas, treinamentos e licenças</li>
                          <li>Todos os dados históricos</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-delete">
                          Digite <strong className="text-destructive">EXCLUIR TUDO</strong> para confirmar:
                        </Label>
                        <Input
                          id="confirm-delete"
                          placeholder="EXCLUIR TUDO"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          className="font-mono"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        Você está prestes a excluir sua conta permanentemente. 
                        Todos os seus dados pessoais serão removidos.
                      </p>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-delete">
                          Digite seu email <strong className="text-destructive">{user?.email}</strong> para confirmar:
                        </Label>
                        <Input
                          id="confirm-delete"
                          placeholder={user?.email || ''}
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Esta ação <strong>NÃO</strong> pode ser desfeita.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText('')}>
                Cancelar
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!isConfirmValid || deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isOwner ? 'Excluir Organização' : 'Excluir Conta'}
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
