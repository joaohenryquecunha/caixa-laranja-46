import { useState } from 'react';
import { X, Plus, Tag, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ColorPicker';
import { useSupabaseFinancialData } from '@/hooks/useSupabaseFinancialData';
import { TransactionType, Category } from '@/types/financial';
import { toast } from '@/hooks/use-toast';

interface CategoryManagerProps {
  onClose: () => void;
}

const TYPE_LABELS = {
  [TransactionType.INCOME]: 'Receita',
  [TransactionType.EXPENSE]: 'Despesa',
  [TransactionType.INVESTMENT]: 'Investimento'
};

export function CategoryManager({ onClose }: CategoryManagerProps) {
  const { categories, addCategory, updateCategory, deleteCategory, isCategoryInUse } = useSupabaseFinancialData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#22c55e',
    type: '' as TransactionType
  });

  const startEdit = (category: Category) => {
    setEditingCategory(category.id);
    setFormData({
      name: category.name,
      color: category.color,
      type: category.type
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      color: '#22c55e',
      type: '' as TransactionType
    });
    setShowAddForm(false);
  };

  const handleDelete = async (categoryId: string) => {
    const result = await deleteCategory(categoryId);
    if (result) {
      toast({
        title: result.success ? "Sucesso!" : "Erro",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory, {
        name: formData.name,
        color: formData.color,
        icon: '',
        type: formData.type
      });

      toast({
        title: "Sucesso!",
        description: "Categoria atualizada com sucesso. As mudanças foram refletidas em todas as transações.",
      });
    } else {
      addCategory({
        name: formData.name,
        color: formData.color,
        icon: '',
        type: formData.type
      });

      toast({
        title: "Sucesso!",
        description: "Categoria criada com sucesso.",
      });
    }

    cancelEdit();
  };

  const groupedCategories = categories.reduce((groups, category) => {
    if (!groups[category.type]) {
      groups[category.type] = [];
    }
    groups[category.type].push(category);
    return groups;
  }, {} as Record<TransactionType, typeof categories>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl bg-gradient-card border-border shadow-card max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex flex-col h-full min-h-0">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Gerenciar Categorias
                </h2>
                <p className="text-muted-foreground text-sm">
                  Crie, edite e organize suas categorias de transações
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 min-h-0 scrollbar-hide">
            <div className="space-y-6">
              {/* Add New Category Button */}
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  variant="outline"
                  className="w-full border-dashed border-2 hover:border-primary/50 transition-colors"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Nova Categoria
                </Button>
              )}

              {/* Add/Edit Category Form */}
              {showAddForm && (
                <Card className="p-4 border-border bg-secondary/10">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-foreground">
                      {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                    </h3>
                    {editingCategory && isCategoryInUse(editingCategory) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ⚠️ Esta categoria está sendo usada em transações. Algumas alterações podem ser limitadas.
                      </p>
                    )}
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="categoryName">Nome *</Label>
                        <Input
                          id="categoryName"
                          placeholder="Ex: Mercado, Academia..."
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-input border-border"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tipo *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as TransactionType }))}
                          disabled={editingCategory ? isCategoryInUse(editingCategory) : false}
                        >
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            <SelectItem value={TransactionType.INCOME}>Receita</SelectItem>
                            <SelectItem value={TransactionType.EXPENSE}>Despesa</SelectItem>
                            <SelectItem value={TransactionType.INVESTMENT}>Investimento</SelectItem>
                          </SelectContent>
                        </Select>
                        {editingCategory && isCategoryInUse(editingCategory) && (
                          <p className="text-xs text-muted-foreground">
                            Tipo não pode ser alterado pois há transações usando esta categoria
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <ColorPicker
                        value={formData.color}
                        onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                        label="Cor"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEdit}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="gradient"
                        className="flex-1"
                      >
                        {editingCategory ? (
                          <>
                            <Edit className="mr-2 h-4 w-4" />
                            Atualizar Categoria
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Categoria
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Existing Categories */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground flex items-center">
                  <Tag className="mr-2 h-5 w-5" />
                  Categorias Existentes
                </h3>
                
                {Object.entries(groupedCategories).map(([type, categoryList]) => (
                  <div key={type} className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {TYPE_LABELS[type as TransactionType]}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryList.map(category => {
                        const isInUse = isCategoryInUse(category.id);
                        return (
                          <Card key={category.id} className="p-3 bg-secondary/30 border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: category.color }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">
                                    {category.name}
                                  </p>
                                  {isInUse && (
                                    <p className="text-xs text-muted-foreground">
                                      Em uso
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(category)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                  title="Editar categoria"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                {!isInUse && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(category.id)}
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    title="Excluir categoria"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {categories.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      Nenhuma categoria encontrada. Crie sua primeira categoria acima.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
