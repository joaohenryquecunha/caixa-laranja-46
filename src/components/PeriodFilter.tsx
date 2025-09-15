import { Calendar, Clock, BarChart3, Globe, Filter, X, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { SpecificFilter, FilterPeriod, useFinancialData } from '@/hooks/useFinancialData';

interface PeriodFilterProps {
  specificFilter: SpecificFilter;
  onFilterChange: (filter: SpecificFilter) => void;
  availableYears: number[];
  availableMonths: number[];
  availableDays: number[];
  getAvailableMonthsForYear: (year?: number) => number[];
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function PeriodFilter({ 
  specificFilter, 
  onFilterChange, 
  availableYears, 
  availableMonths, 
  availableDays,
  getAvailableMonthsForYear
}: PeriodFilterProps) {
  const { companies, getCompanyById } = useFinancialData();
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilter, setTempFilter] = useState<SpecificFilter>(specificFilter);

  const filters = [
    { value: 'day' as FilterPeriod, label: 'Dia', icon: Clock },
    { value: 'month' as FilterPeriod, label: 'Mês', icon: Calendar },
    { value: 'year' as FilterPeriod, label: 'Ano', icon: BarChart3 },
    { value: 'all' as FilterPeriod, label: 'Tudo', icon: Globe }
  ];

  const handlePeriodTypeChange = (type: FilterPeriod) => {
    setTempFilter({ type });
  };

  const handleSpecificValueChange = (value: string) => {
    if (value === 'current') {
      // Reset to current period (no specific value)
      setTempFilter({ type: tempFilter.type });
      return;
    }
    
    const numValue = parseInt(value);
    
    switch (tempFilter.type) {
      case 'day':
        setTempFilter({ ...tempFilter, day: numValue });
        break;
      case 'month':
        setTempFilter({ ...tempFilter, month: numValue });
        break;
      case 'year':
        setTempFilter({ ...tempFilter, year: numValue });
        break;
    }
  };

  const handleYearChangeForMonth = (value: string) => {
    const year = parseInt(value);
    setTempFilter({ ...tempFilter, year, month: undefined });
  };

  const getFilterLabel = (filter: SpecificFilter) => {
    switch (filter.type) {
      case 'day':
        return filter.day ? `Dia ${filter.day}` : 'Hoje';
      case 'month':
        if (filter.month !== undefined) {
          const year = filter.year || new Date().getFullYear();
          return `${MONTHS[filter.month]} ${year}`;
        }
        return 'Este Mês';
      case 'year':
        return filter.year ? `${filter.year}` : 'Este Ano';
      case 'all':
        return 'Tudo';
      default:
        return 'Filtro';
    }
  };

  const getMainFilterLabel = () => {
    const label = getFilterLabel(specificFilter);
    return label === 'Tudo' ? 'Filtros' : label;
  };

  const handleApplyFilter = () => {
    onFilterChange(tempFilter);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempFilter(specificFilter);
    setIsOpen(false);
  };

  return (
    <>
      {/* Filter Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Filter className="h-4 w-4" />
        {getMainFilterLabel()}
      </Button>

      {/* Filter Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-card border-border shadow-lg">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Filtros de Período
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Period Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Tipo de Período
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {filters.map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={tempFilter.type === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePeriodTypeChange(value)}
                      className="flex items-center gap-2 justify-start"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Specific Period Selection */}
              {tempFilter.type !== 'all' && (
                <div className="space-y-4">
                  {tempFilter.type === 'month' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Ano</label>
                        <Select
                          value={tempFilter.year?.toString() || new Date().getFullYear().toString()}
                          onValueChange={handleYearChangeForMonth}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="z-50">
                            {availableYears.map(year => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Mês</label>
                        <Select
                          value={tempFilter.month?.toString() || 'current'}
                          onValueChange={handleSpecificValueChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o mês" />
                          </SelectTrigger>
                          <SelectContent className="z-50">
                            <SelectItem value="current">Este Mês</SelectItem>
                            {getAvailableMonthsForYear(tempFilter.year).map(month => (
                              <SelectItem key={month} value={month.toString()}>
                                {MONTHS[month]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  
                  {tempFilter.type !== 'month' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Selecionar {tempFilter.type === 'day' ? 'Dia' : 'Ano'}
                      </label>
                      <Select
                        value={
                          tempFilter.type === 'day' 
                            ? tempFilter.day?.toString() || 'current'
                            : tempFilter.year?.toString() || 'current'
                        }
                        onValueChange={handleSpecificValueChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={getFilterLabel(tempFilter)} />
                        </SelectTrigger>
                        <SelectContent className="z-50">
                          {tempFilter.type === 'day' && (
                            <>
                              <SelectItem value="current">Hoje</SelectItem>
                              {availableDays.map(day => (
                                <SelectItem key={day} value={day.toString()}>
                                  Dia {day}
                                </SelectItem>
                              ))}
                            </>
                          )}
                          
                          {tempFilter.type === 'year' && (
                            <>
                              <SelectItem value="current">Este Ano</SelectItem>
                              {availableYears.map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Company Filter */}
              {companies.length > 0 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Empresa
                  </label>
                  <Select
                    value={tempFilter.companyId || 'all'}
                    onValueChange={(value) => 
                      setTempFilter(prev => ({ 
                        ...prev, 
                        companyId: value === 'all' ? undefined : value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as empresas" />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="all">Todas as empresas</SelectItem>
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleApplyFilter}
                >
                  Aplicar Filtro
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}