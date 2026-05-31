export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
}

/** Ordena transações pelo fluxo real de lançamento: createdAt desc, depois data desc. */
export function sortTransactionsDesc<T extends { date: string; createdAt?: string; id?: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (createdB !== createdA) return createdB - createdA;
    const dateA = parseLocalDate(a.date).getTime();
    const dateB = parseLocalDate(b.date).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return (b.id ?? '').localeCompare(a.id ?? '');
  });
}

/**
 * Parse uma data no formato YYYY-MM-DD como data local (não UTC)
 * Isso evita problemas de timezone onde uma data pode aparecer como o dia anterior
 * 
 * @param dateString - Data no formato YYYY-MM-DD ou ISO string
 * @returns Date object representando a data local
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) {
    return new Date(NaN);
  }
  
  // Se a data está no formato YYYY-MM-DD (sem hora), parse como local
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    // month - 1 porque Date usa meses de 0-11
    return new Date(year, month - 1, day);
  }
  
  // Se tem hora mas queremos tratar como local, tenta parsear
  // Caso contrário, usa o comportamento padrão
  return new Date(dateString);
}

export function formatDate(date: string): string {
  if (!date) return '';
  try {
    const localDate = parseLocalDate(date);
    if (isNaN(localDate.getTime())) {
      console.warn('Data inválida:', date);
      return date;
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    }).format(localDate);
  } catch (error) {
    console.error('Erro ao formatar data:', error, date);
    return date;
  }
}

export function formatDateShort(date: string): string {
  if (!date) return '';
  try {
    const localDate = parseLocalDate(date);
    if (isNaN(localDate.getTime())) {
      console.warn('Data inválida:', date);
      return date;
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(localDate);
  } catch (error) {
    console.error('Erro ao formatar data:', error, date);
    return date;
  }
}

export function formatDateTime(dateTime: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateTime));
}

export function formatTime(dateTime: string | null | undefined): string {
  if (!dateTime) return '';
  try {
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
}