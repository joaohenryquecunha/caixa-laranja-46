import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Shield, ShieldOff } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_login: string | null;
  account_created: string;
  subscription_status: string | null;
  subscription_end_date: string | null;
  manual_access: boolean;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error || !data) {
        toast({
          title: 'Acesso negado',
          description: 'Você não tem permissão para acessar esta página.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      loadUsers();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, created_at');

      if (!profiles) return;

      // Get user activity data
      const { data: activities } = await supabase
        .from('user_activity')
        .select('*');

      // Combine data
      const userData: UserData[] = profiles.map(profile => {
        const activity = activities?.find(a => a.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: profile.email || 'N/A',
          created_at: profile.created_at,
          last_login: activity?.last_login || null,
          account_created: activity?.account_created || profile.created_at,
          subscription_status: activity?.subscription_status || null,
          subscription_end_date: activity?.subscription_end_date || null,
          manual_access: activity?.manual_access || false,
        };
      });

      setUsers(userData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      });
    }
  };

  const toggleManualAccess = async (userId: string, currentAccess: boolean) => {
    try {
      const { error } = await supabase
        .from('user_activity')
        .upsert({
          user_id: userId,
          manual_access: !currentAccess,
        });

      if (error) throw error;

      toast({
        title: 'Acesso atualizado',
        description: `Acesso manual ${!currentAccess ? 'ativado' : 'desativado'} com sucesso.`,
      });

      loadUsers();
    } catch (error) {
      console.error('Error toggling manual access:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o acesso.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerenciamento de usuários e assinaturas</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              Total de {users.length} usuários cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Status Assinatura</TableHead>
                  <TableHead>Fim da Assinatura</TableHead>
                  <TableHead>Acesso Manual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(user.account_created), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      {user.last_login
                        ? formatDistanceToNow(new Date(user.last_login), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : 'Nunca'}
                    </TableCell>
                    <TableCell>
                      {user.subscription_status ? (
                        <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {user.subscription_status === 'active' ? 'Ativa' : user.subscription_status}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sem assinatura</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.subscription_end_date
                        ? new Date(user.subscription_end_date).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.manual_access}
                          onCheckedChange={() => toggleManualAccess(user.id, user.manual_access)}
                        />
                        {user.manual_access ? (
                          <Shield className="h-4 w-4 text-green-500" />
                        ) : (
                          <ShieldOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
