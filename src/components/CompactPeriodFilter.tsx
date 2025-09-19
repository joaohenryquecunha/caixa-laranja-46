import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SpecificFilter, FilterPeriod } from '@/hooks/useSupabaseFinancialData';

interface CompactPeriodFilterProps {
  specificFilter: SpecificFilter;
  onFilterChange: (filter: SpecificFilter) => void;
  availableYears: number[];
  availableMonths: number[];
  availableDays: number[];
  getAvailableMonthsForYear: (year?: number) => number[];
}

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

export function CompactPeriodFilter({ 
  specificFilter, 
  onFilterChange, 
  availableYears, 
  availableMonths, 
  availableDays,
  getAvailableMonthsForYear
}: CompactPeriodFilterProps) {

  const getCurrentPeriodDisplay = () => {
    switch (specificFilter.type) {
      case 'day':
        return specificFilter.day ? `dia ${specificFilter.day}` : 'hoje';
      case 'month':
        if (specificFilter.month !== undefined) {
          const year = specificFilter.year || new Date().getFullYear();
          return `${MONTHS[specificFilter.month]} de ${year}`;
        }
        return `${MONTHS[new Date().getMonth()]} de ${new Date().getFullYear()}`;
      case 'year':
        return specificFilter.year ? `${specificFilter.year}` : `${new Date().getFullYear()}`;
      case 'all':
        return 'todos os períodos';
      default:
        return 'período atual';
    }
  };

  const getPeriodTypeLabel = () => {
    switch (specificFilter.type) {
      case 'day':
        return 'Dia';
      case 'month':
        return 'Mês';
      case 'year':
        return 'Ano';
      case 'all':
        return 'Todos';
      default:
        return 'Período';
    }
  };

  const handlePeriodTypeChange = (type: FilterPeriod) => {
    onFilterChange({ type });
  };

  const handleSpecificValueChange = (value: string) => {
    if (value === 'current') {
      onFilterChange({ type: specificFilter.type });
      return;
    }
    
    const numValue = parseInt(value);
    
    switch (specificFilter.type) {
      case 'day':
        onFilterChange({ ...specificFilter, day: numValue });
        break;
      case 'month':
        onFilterChange({ ...specificFilter, month: numValue });
        break;
      case 'year':
        onFilterChange({ ...specificFilter, year: numValue });
        break;
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Period Type Selector */}
      <Select
        value={specificFilter.type}
        onValueChange={handlePeriodTypeChange}
      >
        <SelectTrigger className="w-auto min-w-20 border-0 bg-transparent text-foreground font-medium">
          <SelectValue />
          <ChevronDown className="h-4 w-4 ml-1" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Dia</SelectItem>
          <SelectItem value="month">Mês</SelectItem>
          <SelectItem value="year">Ano</SelectItem>
          <SelectItem value="all">Todos</SelectItem>
        </SelectContent>
      </Select>

      {/* Specific Value Selector */}
      {specificFilter.type !== 'all' && (
        <Select
          value={
            specificFilter.type === 'day' 
              ? specificFilter.day?.toString() || 'current'
              : specificFilter.type === 'month'
                ? specificFilter.month?.toString() || 'current'
                : specificFilter.year?.toString() || 'current'
          }
          onValueChange={handleSpecificValueChange}
        >
          <SelectTrigger className="w-auto min-w-32 border-0 bg-transparent text-muted-foreground">
            <SelectValue />
            <ChevronDown className="h-4 w-4 ml-1" />
          </SelectTrigger>
          <SelectContent>
            {specificFilter.type === 'day' && (
              <>
                <SelectItem value="current">hoje</SelectItem>
                {availableDays.map(day => (
                  <SelectItem key={day} value={day.toString()}>
                    dia {day}
                  </SelectItem>
                ))}
              </>
            )}
            
            {specificFilter.type === 'month' && (
              <>
                <SelectItem value="current">este mês</SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month.toString()}>
                    {MONTHS[month]}
                  </SelectItem>
                ))}
              </>
            )}

            {specificFilter.type === 'year' && (
              <>
                <SelectItem value="current">este ano</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}