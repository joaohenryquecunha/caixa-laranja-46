import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { WebGLShader } from '@/components/WebGLShader';
import { RainbowButton } from '@/components/RainbowButton';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      
      if (error) throw error;
    } catch (error: unknown) {
      const message = (error instanceof Error) ? error.message : String(error);
      toast({
        title: "Erro",
        description: message || "Erro ao fazer login com Google.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <WebGLShader />
  <Card className="w-full max-w-md bg-background/60 backdrop-blur-md border border-border relative z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl text-center font-extrabold tracking-wide">
            UZZI FINANCE
          </CardTitle>
          <CardDescription className="text-center">
            Acesse sua conta com o Google
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <RainbowButton
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/10 text-white text-sm font-semibold">G</span>
            )}
            <span className="font-medium text-white" style={{ fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>Continuar com Google</span>
          </RainbowButton>
        </CardContent>
      </Card>
    </div>
  );
}