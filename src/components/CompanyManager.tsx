import { useState } from 'react';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSupabaseFinancialData } from '@/hooks/useSupabaseFinancialData';
import { toast } from 'sonner';

interface CompanyManagerProps {
  onClose: () => void;
}

export function CompanyManager({ onClose }: CompanyManagerProps) {
  const { companies, addCompany, updateCompany, deleteCompany } = useSupabaseFinancialData();
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAddCompany = () => {
    if (!newCompanyName.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    addCompany({ name: newCompanyName.trim() });
    setNewCompanyName('');
    toast.success('Empresa adicionada com sucesso');
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    const result = await updateCompany(editingId!, { name: editingName.trim() });
    if (result && result.success) {
      toast.success(result.message);
      setEditingId(null);
      setEditingName('');
    } else if (result) {
      toast.error(result.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteCompany = async (id: string) => {
    const result = await deleteCompany(id);
    if (result && result.success) {
      toast.success(result.message);
    } else if (result) {
      toast.error(result.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-gradient-card border-border shadow-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Gerenciar Empresas
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </Button>
          </div>

          {/* Add new company */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <Input
                placeholder="Nome da empresa"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCompany()}
                className="bg-input border-border"
              />
              <Button onClick={handleAddCompany} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Companies list */}
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-none md:scrollbar-thin md:scrollbar-thumb-border md:scrollbar-track-transparent">
            {companies.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma empresa cadastrada
              </p>
            ) : (
              companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border"
                >
                  {editingId === company.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                        className="flex-1 bg-input border-border"
                        autoFocus
                      />
                      <Button
                        onClick={handleSaveEdit}
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        ✓
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        size="sm"
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        ✕
                      </Button>
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="flex-1 text-foreground">{company.name}</span>
                      <Button
                        onClick={() => handleStartEdit(company.id, company.name)}
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteCompany(company.id)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}