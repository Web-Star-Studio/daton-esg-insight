import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getLicenseById, updateLicense } from "@/services/licenses";
import { useEffect } from "react";
import { toast } from "sonner";

interface EditFormValues {
  name: string;
  type: string;
  issuing_body: string;
  process_number?: string;
  issue_date?: string;
  expiration_date: string;
  status: string;
  conditions?: string;
}

const EditarLicenca = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit, reset } = useForm<EditFormValues>();

  const { data: license, isLoading, error } = useQuery({
    queryKey: ["license-details", id],
    queryFn: () => getLicenseById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (license) {
      reset({
        name: license.name,
        type: license.type,
        issuing_body: license.issuing_body,
        process_number: license.process_number || "",
        issue_date: license.issue_date || "",
        expiration_date: license.expiration_date,
        status: license.status,
        conditions: license.conditions || "",
      });
    }
  }, [license, reset]);

  const mutation = useMutation({
    mutationFn: (values: EditFormValues) =>
      updateLicense(id!, {
        name: values.name,
        type: values.type,
        issuing_body: values.issuing_body,
        process_number: values.process_number || undefined,
        issue_date: values.issue_date ? new Date(values.issue_date) : undefined,
        expiration_date: values.expiration_date
          ? new Date(values.expiration_date)
          : undefined,
        status: values.status,
        conditions: values.conditions,
      }),
    onSuccess: () => {
      toast.success("Licença atualizada com sucesso!");
      navigate(`/licenciamento/${id}`);
    },
    onError: () => {
      toast.error("Erro ao atualizar licença");
    },
  });

  const onSubmit = (values: EditFormValues) => {
    mutation.mutate(values);
  };

  if (error) {
    return (
      <MainLayout>
        <div className="p-6">Erro ao carregar licença.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Editar Licença</h1>
          <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Licença</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" placeholder="Nome da licença" {...register("name")} />
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Input id="type" placeholder="LO, LI, LP..." {...register("type")} />
                </div>
                <div>
                  <Label htmlFor="issuing_body">Órgão Emissor</Label>
                  <Input id="issuing_body" placeholder="Ex.: FEPAM, IBAMA" {...register("issuing_body")} />
                </div>
                <div>
                  <Label htmlFor="process_number">Nº do Processo</Label>
                  <Input id="process_number" placeholder="000000/0000" {...register("process_number")} />
                </div>
                <div>
                  <Label htmlFor="issue_date">Data de Emissão</Label>
                  <Input id="issue_date" type="date" {...register("issue_date")} />
                </div>
                <div>
                  <Label htmlFor="expiration_date">Data de Vencimento</Label>
                  <Input id="expiration_date" type="date" {...register("expiration_date", { required: true })} />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Input id="status" placeholder="Ativa, Vencida..." {...register("status")} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="conditions">Condicionantes</Label>
                  <Textarea id="conditions" rows={4} placeholder="Texto das condicionantes" {...register("conditions")} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || mutation.isPending}>
                  Salvar alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default EditarLicenca;
