import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { isWithinInterval } from 'date-fns';
import { parseLocalDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSupabaseFinancialData } from '@/hooks/useSupabaseFinancialData';
import { TransactionList } from '@/components/TransactionList';
import { DateRangePicker } from '@/components/DateRangePicker';
import { LocalCategoryPieChart } from '@/components/LocalCategoryPieChart';
import { TransactionType } from '@/types/financial';

interface AllTransactionsProps {
  onClose: () => void;
  initialFilterType?: string;
}

export function AllTransactions({ onClose, initialFilterType }: AllTransactionsProps) {
  const { 
    getFilteredTransactions, 
    categories, 
    companies, 
    getCompanyById,
    deleteTransaction 
  } = useSupabaseFinancialData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>(initialFilterType ?? 'all');
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

    // Filtro de data - usar parseLocalDate para evitar problemas de timezone
    const matchesDateRange = !dateRange?.from || !dateRange?.to || 
      isWithinInterval(parseLocalDate(transaction.date), { 
        start: dateRange.from, 
        end: dateRange.to 
      });

    return matchesSearch && matchesType && matchesCategory && matchesCompany && matchesDateRange;
  });

  const sortedTransactions = useMemo(
    () => [...filteredTransactions].sort((a, b) => {
      const dateA = parseLocalDate(a.date);
      const dateB = parseLocalDate(b.date);
      return dateB.getTime() - dateA.getTime();
    }),
    [filteredTransactions]
  );

  const [listSearch, setListSearch] = useState('');
  const listSearchLower = listSearch.toLowerCase();

  const searchedTransactions = useMemo(
    () =>
      sortedTransactions.filter((transaction) =>
        (transaction.description || '').toLowerCase().includes(listSearchLower)
      ),
    [sortedTransactions, listSearchLower]
  );

  const [visibleCount, setVisibleCount] = useState(10);
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const transactionsToDisplay = useMemo(
    () => searchedTransactions.slice(0, visibleCount),
    [searchedTransactions, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(10);
  }, [searchedTransactions.length, listSearchLower]);

  useEffect(() => {
    const container = listContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) =>
            prev >= searchedTransactions.length
              ? prev
              : Math.min(prev + 10, searchedTransactions.length)
          );
        }
      },
      { root: container, rootMargin: '80px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [searchedTransactions.length, visibleCount]);

  return (
    <div className="fixed inset-0 bg-black/50 p-4 z-40 overflow-auto scrollbar-hide">
      <div className="mx-auto flex justify-center min-h-full">
        <Card className="w-full max-w-full sm:max-w-6xl bg-gradient-card border-border shadow-card overflow-visible sm:overflow-hidden">
          <div className="flex flex-col gap-6 p-4 sm:p-6 sm:max-h-[90vh] sm:overflow-visible">
          <div className="flex items-center justify-between flex-shrink-0">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 flex-shrink-0">
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
                {companies
                  .filter(company => company?.id && company?.name && 
                         typeof company.id === 'string' && 
                         typeof company.name === 'string')
                  .map(company => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {String(company.name)}
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
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-1 lg:grid-cols-2 overflow-hidden min-h-0">
            {/* Left side - Chart */}
            <div className="lg:col-span-1">
              <LocalCategoryPieChart 
                transactions={sortedTransactions}
                categories={categories}
              />
            </div>

            {/* Right side - Transaction List */}
            <div className="lg:col-span-1">
              <Card className="bg-gradient-card border-border shadow-card h-full">
                <div className="p-4 sm:p-6 flex flex-col h-full">
                  <div className="mb-4 flex-shrink-0">
                    <p className="text-sm text-muted-foreground">
                      {searchedTransactions.length} transações encontradas
                    </p>
                  </div>

                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar nesta lista..."
                        value={listSearch}
                        onChange={(e) => setListSearch(e.target.value)}
                        className="pl-10 bg-input border-border"
                      />
                    </div>
                  </div>

                  <div
                    ref={listContainerRef}
                    className="flex-1 overflow-y-auto scrollbar-hide"
                  >
                    {transactionsToDisplay.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Nenhuma transação encontrada para esta busca.
                      </div>
                    ) : (
                      <>
                        <TransactionList
                          transactions={transactionsToDisplay}
                          showDeleteButton={true}
                          showScrollbar={false}
                          onDeleteTransaction={async (id) => {
                            await deleteTransaction(id);
                          }}
                        />
                        {visibleCount < searchedTransactions.length && (
                          <div
                            ref={sentinelRef}
                            className="py-4 text-center text-xs text-muted-foreground"
                          >
                            Carregando mais...
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
