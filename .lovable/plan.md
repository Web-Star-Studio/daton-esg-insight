
# Tratar erros de OTP expirado no fluxo de recuperacao de senha

## Problema

Quando o token de recuperacao expira ou ja foi usado, o Supabase redireciona para a raiz (`/`) com `#error=access_denied&error_code=otp_expired`. A aplicacao nao detecta esse erro, e o usuario ve a tela normal sem nenhum feedback.

## Solucao

Interceptar o hash de erro na URL e redirecionar o usuario para uma tela informativa com opcao de solicitar novo link.

### 1. Criar componente `src/components/AuthErrorHandler.tsx`

Um componente que roda no nivel do App e monitora o hash da URL:

- Detecta `#error=access_denied` no hash
- Extrai `error_code` e `error_description`
- Mostra um toast com mensagem amigavel ("Link expirado ou invalido")
- Redireciona automaticamente para `/auth` apos 3 segundos
- Limpa o hash da URL para evitar reprocessamento

Logica principal:
```text
useEffect:
  1. Ler window.location.hash
  2. Se contem "error=access_denied":
     - Extrair error_code (otp_expired, etc)
     - Mostrar toast descritivo
     - Limpar hash (history.replaceState)
     - navigate('/auth')
```

### 2. Modificar `src/App.tsx`

- Importar e renderizar `AuthErrorHandler` dentro do Router (precisa de acesso ao `useNavigate`)
- Posicionar antes das rotas, sem impacto visual

### 3. Melhorar `src/pages/ResetPassword.tsx`

- Adicionar tratamento do caso onde o hash contem `error=` em vez de `access_token`
- Se detectar erro no hash, mostrar mensagem amigavel com botao para solicitar novo link em vez de apenas redirecionar silenciosamente

## Resultado esperado

- Token expirado: usuario ve toast "Link expirado, solicite um novo" e e redirecionado para /auth
- Token ja usado (segunda tentativa): mesmo tratamento
- Fluxo normal (token valido): sem mudanca, continua funcionando como antes

## Secao tecnica

### AuthErrorHandler.tsx

```typescript
// Componente sem UI, apenas logica
const AuthErrorHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorCode = params.get('error_code');
      
      // Mensagens por tipo de erro
      const messages = {
        otp_expired: 'O link expirou. Solicite um novo.',
        access_denied: 'Acesso negado. Tente novamente.',
      };
      
      toast({
        variant: "destructive",
        title: "Link invalido ou expirado",
        description: messages[errorCode] || params.get('error_description'),
      });
      
      // Limpar hash e redirecionar
      window.history.replaceState(null, '', window.location.pathname);
      navigate('/auth');
    }
  }, []);
  
  return null;
};
```

### Arquivos modificados
- `src/components/AuthErrorHandler.tsx` (novo)
- `src/App.tsx` (adicionar AuthErrorHandler)
- `src/pages/ResetPassword.tsx` (tratar hash de erro)
