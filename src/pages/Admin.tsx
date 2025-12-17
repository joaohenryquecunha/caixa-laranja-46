import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { differenceInDays, format, formatDistanceToNow, intervalToDuration } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Shield, ShieldOff, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  last_login: string | null;
  account_created: string;
  subscription_status: string | null;
  subscription_end_date: string | null;
  last_payment_date: string | null;
  manual_access: boolean;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const checkedRef = useRef(false);
  const loadingUsersRef = useRef(false);

  useEffect(() => {
    if (!user || checkedRef.current) {
      if (!user) {
        setIsAdmin(false);
      }
      return;
    }

    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    checkedRef.current = true;
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
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        toast({
          title: 'Acesso negado',
          description: 'Você não tem permissão para acessar esta página.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(!!data);

      if (!loadingUsersRef.current) {
        loadingUsersRef.current = true;
        if (data) {
          await loadUsers();
        }
        loadingUsersRef.current = false;
      }
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
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, created_at, display_name, phone');

      if (profilesError) {
        throw profilesError;
      }

      if (!profiles) return;

      // Get user activity data
      const { data: activities, error: activitiesError } = await supabase
        .from('user_activity')
        .select('*');

      if (activitiesError) {
        throw activitiesError;
      }

      const activityMap = new Map(
        (activities || []).map(activity => [activity.user_id, activity])
      );

      // Combine data
      const userData: UserData[] = profiles.map(profile => {
        const activity = activityMap.get(profile.user_id);
        return {
          id: profile.user_id,
          name: profile.display_name || 'Sem nome',
          email: profile.email || 'N/A',
          phone: profile.phone || null,
          created_at: profile.created_at,
          last_login: activity?.last_login ?? null,
          account_created: activity?.account_created ?? profile.created_at,
          subscription_status: activity?.subscription_status ?? null,
          subscription_end_date: activity?.subscription_end_date ?? null,
          last_payment_date: activity?.last_payment_date ?? null,
          manual_access: activity?.manual_access ?? false,
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
      const { error } = await supabase.rpc('set_user_manual_access', {
        _target_user_id: userId,
        _manual: !currentAccess,
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

  const formatAccessDuration = (startDate: string) => {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) {
      return '-';
    }

    const now = new Date();
    const totalDays = Math.max(0, differenceInDays(now, start));

    if (totalDays < 30) {
      if (totalDays === 0) {
        return 'Hoje';
      }
      return `${totalDays} ${totalDays === 1 ? 'dia' : 'dias'}`;
    }

    const duration = intervalToDuration({ start, end: now });
    const parts: string[] = [];

    if (duration.years) {
      parts.push(`${duration.years} ${duration.years === 1 ? 'ano' : 'anos'}`);
    }
    if (duration.months) {
      parts.push(`${duration.months} ${duration.months === 1 ? 'mês' : 'meses'}`);
    }
    if (duration.days && parts.length < 2) {
      parts.push(`${duration.days} ${duration.days === 1 ? 'dia' : 'dias'}`);
    }

    if (parts.length === 0) {
      return `${totalDays} dias`;
    }

    return parts.join(' e ');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const getAccessStatus = (user: UserData) => {
    const now = new Date();
    if (user.manual_access) {
      return { label: 'Liberado manualmente', variant: 'default' as const };
    }

    if (
      user.subscription_status === 'active' &&
      user.subscription_end_date &&
      new Date(user.subscription_end_date) > now
    ) {
      return { label: 'Assinatura ativa', variant: 'default' as const };
    }

    if (user.subscription_status === 'active' && user.subscription_end_date) {
      return { label: 'Assinatura vencida', variant: 'secondary' as const };
    }

    if (user.subscription_status) {
      return { label: user.subscription_status, variant: 'secondary' as const };
    }

    return { label: 'Pendente', variant: 'outline' as const };
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;
    
    // Filtrar por nome se houver termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = users.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }
    
    // Ordenar por nome
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [users, searchTerm]);

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
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerenciamento de usuários e assinaturas</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              Total de {users.length} usuários cadastrados
              {searchTerm && ` • ${filteredAndSortedUsers.length} resultado(s) encontrado(s)`}
            </CardDescription>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-input border-border"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tempo de acesso</TableHead>
                    <TableHead>Último pagamento</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead>Status Assinatura</TableHead>
                    <TableHead>Fim da Assinatura</TableHead>
                    <TableHead>Acesso</TableHead>
                    <TableHead>Acesso Manual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedUsers.map(user => {
                    const accessStatus = getAccessStatus(user);
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>{formatAccessDuration(user.account_created)}</TableCell>
                        <TableCell>{formatDate(user.last_payment_date)}</TableCell>
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
                          <Badge variant={accessStatus.variant}>{accessStatus.label}</Badge>
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 p-4 lg:hidden">
              {filteredAndSortedUsers.map(user => {
                const accessStatus = getAccessStatus(user);
                return (
                  <Card key={user.id} className="bg-card border-border">
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-base font-semibold text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                          <p className="text-sm text-muted-foreground break-all">
                            {user.phone || 'sem numero'}
                          </p>
                        </div>
                        <Badge variant={accessStatus.variant}>{accessStatus.label}</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Tempo de acesso: {formatAccessDuration(user.account_created)}</p>
                        <p>Último pagamento: {formatDate(user.last_payment_date)}</p>
                        <p>
                          Último login:{' '}
                          {user.last_login
                            ? formatDistanceToNow(new Date(user.last_login), {
                                addSuffix: true,
                                locale: ptBR,
                              })
                            : 'Nunca'}
                        </p>
                        <p>
                          Status assinatura:{' '}
                          {user.subscription_status ? (
                            user.subscription_status === 'active' ? 'Ativa' : user.subscription_status
                          ) : (
                            'Sem assinatura'
                          )}
                        </p>
                        <p>
                          Fim da assinatura:{' '}
                          {user.subscription_end_date
                            ? new Date(user.subscription_end_date).toLocaleDateString('pt-BR')
                            : '-'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleManualAccess(user.id, user.manual_access)}
                        >
                          {user.manual_access ? 'Revogar acesso' : 'Liberar acesso'}
                        </Button>
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
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
