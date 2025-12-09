import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useLegislation, useLegislations, useLegislationThemes, useLegislationSubthemes } from "@/hooks/data/useLegislations";
import { NORM_TYPES, ISSUING_BODIES } from "@/services/legislations";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyUsers } from "@/hooks/data/useCompanyUsers";

const formSchema = z.object({
  norm_type: z.string().min(1, "Tipo de norma é obrigatório"),
  norm_number: z.string().optional(),
  title: z.string().min(1, "Título é obrigatório"),
  summary: z.string().optional(),
  issuing_body: z.string().optional(),
  publication_date: z.string().optional(),
  jurisdiction: z.enum(['federal', 'estadual', 'municipal', 'nbr', 'internacional']),
  state: z.string().optional(),
  municipality: z.string().optional(),
  theme_id: z.string().optional(),
  subtheme_id: z.string().optional(),
  overall_applicability: z.enum(['real', 'potential', 'revoked', 'na', 'pending']),
  overall_status: z.enum(['conforme', 'para_conhecimento', 'adequacao', 'plano_acao', 'pending']),
  full_text_url: z.string().url().optional().or(z.literal('')),
  review_frequency_days: z.coerce.number().min(1).default(365),
  observations: z.string().optional(),
  responsible_user_id: z.string().optional(),
  revokes_legislation_id: z.string().optional(),
  revoked_by_legislation_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const LegislationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditing = !!id;

  const { data: legislation, isLoading: isLoadingLegislation } = useLegislation(id);
  const { legislations, createLegislation, updateLegislation, isCreating, isUpdating } = useLegislations();
  const { themes } = useLegislationThemes();
  const { subthemes } = useLegislationSubthemes();
  const { data: users } = useCompanyUsers();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      norm_type: '',
      norm_number: '',
      title: '',
      summary: '',
      issuing_body: '',
      publication_date: '',
      jurisdiction: 'federal',
      state: '',
      municipality: '',
      theme_id: '',
      subtheme_id: '',
      overall_applicability: 'pending',
      overall_status: 'pending',
      full_text_url: '',
      review_frequency_days: 365,
      observations: '',
      responsible_user_id: '',
      revokes_legislation_id: '',
      revoked_by_legislation_id: '',
    },
  });

  const selectedJurisdiction = form.watch('jurisdiction');
  const selectedThemeId = form.watch('theme_id');

  // Filter subthemes by selected theme
  const filteredSubthemes = selectedThemeId 
    ? subthemes.filter(s => s.theme_id === selectedThemeId)
    : subthemes;

  // Load existing data when editing
  useEffect(() => {
    if (legislation) {
      form.reset({
        norm_type: legislation.norm_type,
        norm_number: legislation.norm_number || '',
        title: legislation.title,
        summary: legislation.summary || '',
        issuing_body: legislation.issuing_body || '',
        publication_date: legislation.publication_date || '',
        jurisdiction: legislation.jurisdiction,
        state: legislation.state || '',
        municipality: legislation.municipality || '',
        theme_id: legislation.theme_id || '',
        subtheme_id: legislation.subtheme_id || '',
        overall_applicability: legislation.overall_applicability,
        overall_status: legislation.overall_status,
        full_text_url: legislation.full_text_url || '',
        review_frequency_days: legislation.review_frequency_days,
        observations: legislation.observations || '',
        responsible_user_id: legislation.responsible_user_id || '',
        revokes_legislation_id: legislation.revokes_legislation_id || '',
        revoked_by_legislation_id: legislation.revoked_by_legislation_id || '',
      });
    }
  }, [legislation, form]);

  const onSubmit = (data: FormData) => {
    const payload = {
      ...data,
      theme_id: data.theme_id || null,
      subtheme_id: data.subtheme_id || null,
      publication_date: data.publication_date || null,
      full_text_url: data.full_text_url || null,
      state: data.jurisdiction === 'estadual' || data.jurisdiction === 'municipal' ? data.state : null,
      municipality: data.jurisdiction === 'municipal' ? data.municipality : null,
      responsible_user_id: data.responsible_user_id || null,
      revokes_legislation_id: data.revokes_legislation_id || null,
      revoked_by_legislation_id: data.revoked_by_legislation_id || null,
      created_by: user?.id,
    };

    if (isEditing) {
      updateLegislation({ id: id!, data: payload }, {
        onSuccess: () => navigate(`/licenciamento/legislacoes/${id}`),
      });
    } else {
      createLegislation(payload, {
        onSuccess: () => navigate('/licenciamento/legislacoes'),
      });
    }
  };

  const isSaving = isCreating || isUpdating;

  if (isEditing && isLoadingLegislation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{isEditing ? 'Editar Legislação' : 'Nova Legislação'} | Licenciamento</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Legislação' : 'Nova Legislação'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Atualize os dados da legislação' : 'Cadastre uma nova legislação'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
                  {/* Identificação */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Identificação da Norma</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="norm_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Norma *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {NORM_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="norm_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 12.305/2010" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Título / Ementa *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Título ou ementa da legislação..."
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="issuing_body"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Órgão Emissor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o órgão" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ISSUING_BODIES.map(body => (
                                  <SelectItem key={body} value={body}>{body}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="publication_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Publicação</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Classificação */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Classificação</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="jurisdiction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jurisdição *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="federal">Federal</SelectItem>
                                <SelectItem value="estadual">Estadual</SelectItem>
                                <SelectItem value="municipal">Municipal</SelectItem>
                                <SelectItem value="nbr">NBR</SelectItem>
                                <SelectItem value="internacional">Internacional</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {(selectedJurisdiction === 'estadual' || selectedJurisdiction === 'municipal') && (
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>UF</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: SP" maxLength={2} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {selectedJurisdiction === 'municipal' && (
                        <FormField
                          control={form.control}
                          name="municipality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Município</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome do município" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="theme_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Macrotema</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o macrotema" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {themes.map(theme => (
                                  <SelectItem key={theme.id} value={theme.id}>
                                    <div className="flex items-center gap-2">
                                      <span 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: theme.color }}
                                      />
                                      {theme.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subtheme_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subtema</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              disabled={!selectedThemeId}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o subtema" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredSubthemes.map(subtheme => (
                                  <SelectItem key={subtheme.id} value={subtheme.id}>
                                    {subtheme.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Status Geral</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="overall_applicability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aplicabilidade *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pendente de Avaliação</SelectItem>
                                <SelectItem value="real">Real (Aplicável)</SelectItem>
                                <SelectItem value="potential">Potencial</SelectItem>
                                <SelectItem value="revoked">Revogada</SelectItem>
                                <SelectItem value="na">Não Aplicável</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Define se a legislação é aplicável à sua organização
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="overall_status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status de Atendimento *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="conforme">Conforme</SelectItem>
                                <SelectItem value="para_conhecimento">Para Conhecimento</SelectItem>
                                <SelectItem value="adequacao">Em Adequação</SelectItem>
                                <SelectItem value="plano_acao">Plano de Ação</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="review_frequency_days"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequência de Revisão (dias)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormDescription>
                              Intervalo para próxima revisão obrigatória
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="full_text_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link para Texto Completo</FormLabel>
                            <FormControl>
                              <Input type="url" placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="observations"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Observações adicionais..."
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="responsible_user_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsável</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o responsável" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {users?.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Pessoa responsável por acompanhar esta legislação
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Revogações */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Vinculações e Revogações</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="revokes_legislation_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Esta legislação revoga</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma legislação" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {legislations
                                  .filter(l => l.id !== id)
                                  .map((leg) => (
                                    <SelectItem key={leg.id} value={leg.id}>
                                      {leg.norm_type} {leg.norm_number ? `nº ${leg.norm_number}` : ''} - {leg.title.substring(0, 50)}...
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Se esta legislação revoga outra, selecione-a aqui
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="revoked_by_legislation_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Revogada por</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma legislação" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {legislations
                                  .filter(l => l.id !== id)
                                  .map((leg) => (
                                    <SelectItem key={leg.id} value={leg.id}>
                                      {leg.norm_type} {leg.norm_number ? `nº ${leg.norm_number}` : ''} - {leg.title.substring(0, 50)}...
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Se esta legislação foi revogada por outra, selecione-a aqui
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate(-1)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {isEditing ? 'Salvar Alterações' : 'Cadastrar Legislação'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
  );
};

export default LegislationForm;
