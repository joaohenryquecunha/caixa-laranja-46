import { useEffect } from 'react';
import { addMonths } from 'date-fns';
import { Transaction, TransactionType } from '@/types/financial';

const SAMPLE_DATA_KEY = 'sample_data_loaded';

export function useSampleData() {
  useEffect(() => {
    const sampleDataLoaded = localStorage.getItem(SAMPLE_DATA_KEY);
    
    if (!sampleDataLoaded) {
      const sampleTransactions: Transaction[] = [];
      let transactionId = 1;

      // Transações únicas
      sampleTransactions.push(
        {
          id: String(transactionId++),
          amount: 800,
          description: 'Freelance website',
          categoryId: '2',
          type: TransactionType.INCOME,
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        },
        {
          id: String(transactionId++),
          amount: 150,
          description: 'Supermercado',
          categoryId: '3',
          type: TransactionType.EXPENSE,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        }
      );

      // Salário recorrente (últimos 6 meses)
      const salaryStartDate = new Date();
      salaryStartDate.setMonth(salaryStartDate.getMonth() - 5); // Começar 5 meses atrás
      for (let i = 0; i < 6; i++) {
        const currentDate = addMonths(salaryStartDate, i);
        sampleTransactions.push({
          id: String(transactionId++),
          amount: 5000,
          description: 'Salário mensal',
          categoryId: '1',
          type: TransactionType.INCOME,
          date: currentDate.toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        });
      }

      // Aluguel recorrente (últimos 6 meses)
      const rentStartDate = new Date();
      rentStartDate.setMonth(rentStartDate.getMonth() - 5);
      rentStartDate.setDate(5); // Dia 5 de cada mês
      for (let i = 0; i < 6; i++) {
        const currentDate = addMonths(rentStartDate, i);
        sampleTransactions.push({
          id: String(transactionId++),
          amount: 1200,
          description: 'Aluguel',
          categoryId: '3', // Despesa
          type: TransactionType.EXPENSE,
          date: currentDate.toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        });
      }

      // Investimento recorrente em ações (últimos 4 meses)
      const investmentStartDate = new Date();
      investmentStartDate.setMonth(investmentStartDate.getMonth() - 3);
      investmentStartDate.setDate(10); // Dia 10 de cada mês
      for (let i = 0; i < 4; i++) {
        const currentDate = addMonths(investmentStartDate, i);
        sampleTransactions.push({
          id: String(transactionId++),
          amount: 500,
          description: 'Investimento mensal em ações',
          categoryId: '5',
          type: TransactionType.INVESTMENT,
          date: currentDate.toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        });
      }

      // Internet recorrente (últimos 6 meses)
      const internetStartDate = new Date();
      internetStartDate.setMonth(internetStartDate.getMonth() - 5);
      internetStartDate.setDate(15); // Dia 15 de cada mês
      for (let i = 0; i < 6; i++) {
        const currentDate = addMonths(internetStartDate, i);
        sampleTransactions.push({
          id: String(transactionId++),
          amount: 80,
          description: 'Internet fibra',
          categoryId: '4', // Transporte (vou usar como "serviços")
          type: TransactionType.EXPENSE,
          date: currentDate.toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        });
      }

      // Transações futuras - Salário próximos 6 meses
      const futureSalaryStart = new Date();
      futureSalaryStart.setMonth(futureSalaryStart.getMonth() + 1);
      for (let i = 0; i < 6; i++) {
        const currentDate = addMonths(futureSalaryStart, i);
        sampleTransactions.push({
          id: String(transactionId++),
          amount: 5000,
          description: 'Salário mensal (programado)',
          categoryId: '1',
          type: TransactionType.INCOME,
          date: currentDate.toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        });
      }

      localStorage.setItem('financial_transactions', JSON.stringify(sampleTransactions));
      localStorage.setItem(SAMPLE_DATA_KEY, 'true');
      
      console.log(`✅ Dados de exemplo criados: ${sampleTransactions.length} transações`);
      console.log('📊 Incluindo transações recorrentes de salário, aluguel, investimentos e serviços');
    }
  }, []);
}