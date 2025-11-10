import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, User, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Etapa6AjustesAlinhamento() {
  const comments = [
    {
      section: 'Sumário Executivo',
      author: 'Maria Silva',
      role: 'Gerente de Sustentabilidade',
      comment: 'Sugestão: adicionar menção aos ODS prioritários da empresa',
      status: 'pending',
    },
    {
      section: 'Desempenho Ambiental',
      author: 'João Santos',
      role: 'Diretor Ambiental',
      comment: 'Aprovado, mas revisar o cálculo de emissões do Escopo 3',
      status: 'approved',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revisão Colaborativa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Compartilhe o relatório com stakeholders internos para revisão e aprovação
          </p>

          <div className="space-y-4">
            {comments.map((comment, idx) => (
              <Card key={idx} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{comment.author}</p>
                        <p className="text-xs text-muted-foreground">{comment.role}</p>
                      </div>
                    </div>
                    <Badge variant={comment.status === 'approved' ? 'default' : 'secondary'}>
                      {comment.status === 'approved' ? (
                        <>
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Aprovado
                        </>
                      ) : (
                        'Pendente'
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Seção:</span> {comment.section}
                  </p>
                  <p className="text-sm text-muted-foreground">{comment.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Adicionar Comentário
            </h4>
            <Textarea placeholder="Digite seu comentário ou sugestão..." rows={3} className="mb-2" />
            <Button size="sm">Enviar Comentário</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklist de Alinhamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              'Aprovação do setor de sustentabilidade',
              'Validação financeira',
              'Revisão jurídica',
              'Aprovação de comunicação',
              'Aprovação final da diretoria',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm">{item}</span>
                <Badge variant={idx < 2 ? 'default' : 'secondary'}>
                  {idx < 2 ? 'Concluído' : 'Pendente'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
