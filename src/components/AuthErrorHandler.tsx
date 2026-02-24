import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const errorMessages: Record<string, string> = {
  otp_expired: 'O link de recuperação expirou. Solicite um novo.',
  access_denied: 'Acesso negado. Tente novamente.',
};

const AuthErrorHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('error=')) return;

    const params = new URLSearchParams(hash.substring(1));
    const errorCode = params.get('error_code');
    const errorDescription = params.get('error_description');

    toast({
      variant: "destructive",
      title: "Link inválido ou expirado",
      description: (errorCode && errorMessages[errorCode]) || errorDescription?.replace(/\+/g, ' ') || 'Ocorreu um erro na autenticação.',
    });

    // Clean hash and redirect
    window.history.replaceState(null, '', window.location.pathname);
    navigate('/auth');
  }, [navigate, toast]);

  return null;
};

export default AuthErrorHandler;
