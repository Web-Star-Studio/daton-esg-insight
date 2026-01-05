import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Send, Users, FileSpreadsheet, AlertCircle, CheckCircle2, Palette } from 'lucide-react';
import { mailingService, MailingList } from '@/services/mailingService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SendCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mailingList: MailingList | null;
}

export function SendCampaignModal({
  open,
  onOpenChange,
  mailingList
}: SendCampaignModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'sending' | 'done'>('form');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedFormId, setSelectedFormId] = useState('');
  const [sendResult, setSendResult] = useState<{ sent: number; total: number } | null>(null);
  const [headerColor, setHeaderColor] = useState('#10B981');
  const [buttonColor, setButtonColor] = useState('#10B981');
  const [useLogo, setUseLogo] = useState(true);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  const { data: listDetails } = useQuery({
    queryKey: ['mailing-list-details', mailingList?.id],
    queryFn: () => mailingService.getMailingList(mailingList!.id),
    enabled: open && !!mailingList?.id
  });

  const { data: forms = [] } = useQuery({
    queryKey: ['mailing-forms'],
    queryFn: () => mailingService.getForms(),
    enabled: open
  });

  // Fetch company logo
  const { data: companyData } = useQuery({
    queryKey: ['company-logo'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      if (!profile?.company_id) return null;
      const { data: company } = await supabase
        .from('companies')
        .select('logo_url')
        .eq('id', profile.company_id)
        .single();
      return company;
    },
    enabled: open
  });

  useEffect(() => {
    if (companyData?.logo_url) {
      setCompanyLogo(companyData.logo_url);
    }
  }, [companyData]);

  // Filter forms linked to this mailing list
  const linkedForms = listDetails?.forms || [];
  const availableForms = linkedForms.length > 0 
    ? forms.filter(f => linkedForms.some(lf => lf.id === f.id))
    : forms;

  useEffect(() => {
    if (open) {
      setStep('form');
      setSubject('');
      setMessage('');
      setSelectedFormId('');
      setSendResult(null);
      setHeaderColor('#10B981');
      setButtonColor('#10B981');
      setUseLogo(true);
    }
  }, [open]);

  const createAndSendMutation = useMutation({
    mutationFn: async () => {
      // Create campaign
      const campaign = await mailingService.createCampaign({
        mailingListId: mailingList!.id,
        formId: selectedFormId,
        subject,
        message,
        headerColor,
        buttonColor,
        logoUrl: useLogo && companyLogo ? companyLogo : undefined
      });

      // Send campaign
      return await mailingService.sendCampaign(campaign.id);
    },
    onSuccess: (result) => {
      setSendResult(result);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['mailing-lists'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao enviar campanha', 
        description: error.message, 
        variant: 'destructive' 
      });
      setStep('form');
    }
  });

  const handleSend = () => {
    if (!selectedFormId || !subject) {
      toast({ 
        title: 'Preencha os campos obrigatórios', 
        variant: 'destructive' 
      });
      return;
    }
    setStep('sending');
    createAndSendMutation.mutate();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const contactCount = listDetails?.contacts?.filter(c => c.status === 'active').length || mailingList?.contact_count || 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Campanha
          </DialogTitle>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            {/* List Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium">{mailingList?.name}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {contactCount} destinatários
                </span>
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="h-4 w-4" />
                  {linkedForms.length} formulários vinculados
                </span>
              </div>
            </div>

            {contactCount === 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Nenhum contato ativo</p>
                  <p className="text-sm text-muted-foreground">
                    Importe contatos antes de enviar uma campanha
                  </p>
                </div>
              </div>
            )}

            {/* Form Selection */}
            <div className="space-y-2">
              <Label>Formulário *</Label>
              <Select value={selectedFormId} onValueChange={setSelectedFormId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formulário" />
                </SelectTrigger>
                <SelectContent>
                  {availableForms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableForms.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Vincule formulários à lista ou publique um formulário
                </p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto do Email *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Pesquisa de Satisfação - Precisamos da sua opinião!"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mensagem personalizada que aparecerá no corpo do email..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                O email incluirá automaticamente um botão para acessar o formulário
              </p>
            </div>

            {/* Visual Customization */}
            <div className="space-y-4 border-t pt-4 mt-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Personalização Visual</Label>
              </div>
              
              {/* Header Color */}
              <div className="flex items-center gap-3">
                <Label className="w-32 text-sm">Cor do Header:</Label>
                <Input 
                  type="color" 
                  value={headerColor} 
                  onChange={(e) => setHeaderColor(e.target.value)}
                  className="w-12 h-8 p-1 border cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">{headerColor}</span>
              </div>
              
              {/* Button Color */}
              <div className="flex items-center gap-3">
                <Label className="w-32 text-sm">Cor do Botão:</Label>
                <Input 
                  type="color" 
                  value={buttonColor} 
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="w-12 h-8 p-1 border cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">{buttonColor}</span>
              </div>
              
              {/* Logo Option */}
              {companyLogo && (
                <div className="flex items-center gap-3">
                  <Label className="w-32 text-sm">Logo:</Label>
                  <img src={companyLogo} alt="Logo" className="h-8 object-contain rounded" />
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="useLogo"
                      checked={useLogo} 
                      onCheckedChange={(checked) => setUseLogo(checked === true)} 
                    />
                    <Label htmlFor="useLogo" className="text-sm cursor-pointer">Incluir no email</Label>
                  </div>
                </div>
              )}
              {!companyLogo && (
                <p className="text-xs text-muted-foreground">
                  Configure o logo da empresa nas configurações para incluí-lo nos emails.
                </p>
              )}
            </div>
          </div>
        )}

        {step === 'sending' && (
          <div className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <p className="mt-4 font-medium">Enviando emails...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Aguarde enquanto os emails são processados
            </p>
          </div>
        )}

        {step === 'done' && sendResult && (
          <div className="py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mt-4">Campanha Enviada!</h3>
            <p className="text-muted-foreground mt-2">
              {sendResult.sent} de {sendResult.total} emails foram enviados com sucesso
            </p>
            {sendResult.sent < sendResult.total && (
              <p className="text-sm text-amber-600 mt-2">
                {sendResult.total - sendResult.sent} emails falharam. Verifique os logs para mais detalhes.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'form' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSend}
                disabled={!selectedFormId || !subject || contactCount === 0}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar para {contactCount} contatos
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={handleClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
