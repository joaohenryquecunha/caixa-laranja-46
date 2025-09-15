import { useState } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialData } from '@/hooks/useFinancialData';
import { TransactionList } from '@/components/TransactionList';
import { DateRangePicker } from '@/components/DateRangePicker';
import { LocalCategoryPieChart } from '@/components/LocalCategoryPieChart';
import { TransactionType } from '@/types/financial';

interface AllTransactionsProps {
  onClose: () => void;
}

export function AllTransactions({ onClose }: AllTransactionsProps) {
  const { getFilteredTransactions, categories, companies, getCompanyById } = useFinancialData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCompany, setFilterCompany] = useState<string>('none');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const transactions = getFilteredTransactions();
  
  const filteredTransactions = transactions.filter(transaction => {
    const category = categories.find(c => c.id === transaction.categoryId);
    const company = transaction.companyId ? getCompanyById(transaction.companyId) : null;
    
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.categoryId === filterCategory;
    const matchesCompany = filterCompany === 'all' || 
      (filterCompany === 'none' && !transaction.companyId) ||
      (filterCompany !== 'none' && transaction.companyId === filterCompany);

    // Filtro de data
    const matchesDateRange = !dateRange?.from || !dateRange?.to || 
      isWithinInterval(parseISO(transaction.date), { 
        start: dateRange.from, 
        end: dateRange.to 
      });

    return matchesSearch && matchesType && matchesCategory && matchesCompany && matchesDateRange;
  });

  const sortedTransactions = filteredTransactions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[95vh] bg-gradient-card border-border shadow-card overflow-hidden">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Todas as Transações
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-input border-border">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value={TransactionType.INCOME}>Receitas</SelectItem>
                <SelectItem value={TransactionType.EXPENSE}>Despesas</SelectItem>
                <SelectItem value={TransactionType.INVESTMENT}>Investimentos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma empresa</SelectItem>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker 
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden min-h-0">
            {/* Left side - Chart */}
            <div className="lg:col-span-1 flex flex-col min-h-0">
              <LocalCategoryPieChart 
                transactions={sortedTransactions}
                categories={categories}
              />
            </div>

            {/* Right side - Transaction List */}
            <div className="lg:col-span-1 flex flex-col min-h-0">
              {/* Results count */}
              <div className="mb-4 flex-shrink-0">
                <p className="text-sm text-muted-foreground">
                  {sortedTransactions.length} transações encontradas
                </p>
              </div>

              {/* Transaction List */}
              <div className="flex-1 overflow-y-auto scrollbar-none md:scrollbar-thin md:scrollbar-thumb-border md:scrollbar-track-transparent">
                <TransactionList 
                  transactions={sortedTransactions} 
                  showDeleteButton={true}
                  showScrollbar={false}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}