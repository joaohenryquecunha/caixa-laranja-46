import { TransactionType } from '@/types/financial';

const DRAFT_STORAGE_KEY = 'caixa-laranja-transaction-form-draft';
const MODAL_OPEN_KEY = 'caixa-laranja-transaction-form-open';

export interface TransactionFormDraft {
  type: TransactionType | '';
  amount: string;
  categoryId: string;
  companyId: string;
  description: string;
  date: string;
  isRecurring: boolean;
  recurringTimes: string;
  recurringStartDate: string;
}

export function readTransactionFormDraft(): TransactionFormDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TransactionFormDraft;
  } catch {
    return null;
  }
}

export function saveTransactionFormDraft(draft: TransactionFormDraft): void {
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignorar falhas de storage
  }
}

export function isTransactionFormModalOpen(): boolean {
  try {
    return sessionStorage.getItem(MODAL_OPEN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setTransactionFormModalOpen(open: boolean): void {
  try {
    if (open) {
      sessionStorage.setItem(MODAL_OPEN_KEY, 'true');
    } else {
      sessionStorage.removeItem(MODAL_OPEN_KEY);
    }
  } catch {
    // Ignorar falhas de storage
  }
}

export function clearTransactionFormStorage(): void {
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    sessionStorage.removeItem(MODAL_OPEN_KEY);
  } catch {
    // Ignorar falhas de storage
  }
}

export function draftHasContent(draft: TransactionFormDraft): boolean {
  return Boolean(
    draft.type ||
      draft.amount ||
      draft.categoryId ||
      draft.companyId ||
      draft.description ||
      draft.isRecurring
  );
}
