import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { useState } from 'react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { AgeFilterProvider, useAgeFilter } from '@/context/AgeFilterContext';

expect.extend(matchers);

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
// Definir global para ambientes de teste
const global = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {});
global.localStorage = localStorageMock;

// Mock do remoteDb
vi.mock('@/services/remoteDb', () => ({
  isRemoteDbEnabled: () => false,
}));

describe('Sistema de Filtro de Idades - Teste Simples', () => {
  beforeEach(() => {
    // Limpar completamente o localStorage antes de cada teste
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('deve verificar idade e funcionar corretamente', async () => {
    function TestComponent() {
      const { selectedAge, isAgeVerified, verifyAge, isContentAllowed } = useAgeFilter();
      
      return (
        <div>
          <div data-testid="age-display">{selectedAge}</div>
          <div data-testid="verified-display">{isAgeVerified ? 'verificado' : 'nao-verificado'}</div>
          
          <button onClick={() => verifyAge(12)} data-testid="verify-button">
            Verificar Idade 12
          </button>
          
          <div data-testid="content-status-10-14">
            {isContentAllowed({ minAge: 10, maxAge: 14 }) ? 'permitido' : 'bloqueado'}
          </div>
          
          <div data-testid="content-status-15-16">
            {isContentAllowed({ minAge: 15, maxAge: 16 }) ? 'permitido' : 'bloqueado'}
          </div>
        </div>
      );
    }

    // Garantir que o provider seja completamente novo
    const { unmount } = render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );
    
    // Adicionar unmount para garantir limpeza completa
    afterEach(() => {
      unmount();
    });

    // Estado inicial
    expect(screen.getByTestId('age-display')).toHaveTextContent('10');
    expect(screen.getByTestId('verified-display')).toHaveTextContent('nao-verificado');
    expect(screen.getByTestId('content-status-10-14')).toHaveTextContent('bloqueado');
    expect(screen.getByTestId('content-status-15-16')).toHaveTextContent('bloqueado');

    // Verificar idade
    fireEvent.click(screen.getByTestId('verify-button'));

    await waitFor(() => {
      expect(screen.getByTestId('age-display')).toHaveTextContent('12');
      expect(screen.getByTestId('verified-display')).toHaveTextContent('verificado');
    });

    // Verificar conteúdo após verificação
    expect(screen.getByTestId('content-status-10-14')).toHaveTextContent('permitido');
    expect(screen.getByTestId('content-status-15-16')).toHaveTextContent('bloqueado');

    // Verificar localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('ecoplay_selected_age', '12');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('ecoplay_age_verified', 'true');
  });

  it('deve carregar do localStorage', async () => {
    // Simular dados salvos
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'ecoplay_selected_age') return '13';
      if (key === 'ecoplay_age_verified') return 'true';
      return null;
    });

    function TestComponent() {
      const { selectedAge, isAgeVerified } = useAgeFilter();
      return (
        <div>
          <div data-testid="age-display">{selectedAge}</div>
          <div data-testid="verified-display">{isAgeVerified ? 'verificado' : 'nao-verificado'}</div>
        </div>
      );
    }

    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Deve carregar do localStorage
    expect(screen.getAllByTestId('age-display')[0]).toHaveTextContent('13');
    expect(screen.getAllByTestId('verified-display')[0]).toHaveTextContent('verificado');
  });

  it('deve resetar corretamente', async () => {
    function TestComponent() {
      const { selectedAge, isAgeVerified, verifyAge, resetAgeFilter } = useAgeFilter();
      
      return (
        <div>
          <div data-testid="age-display">{selectedAge}</div>
          <div data-testid="verified-display">{isAgeVerified ? 'verificado' : 'nao-verificado'}</div>
          
          <button onClick={() => verifyAge(12)} data-testid="verify-button">
            Verificar
          </button>
          
          <button onClick={resetAgeFilter} data-testid="reset-button">
            Resetar
          </button>
        </div>
      );
    }

    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Verificar idade
    fireEvent.click(screen.getByTestId('verify-button'));

    await waitFor(() => {
      expect(screen.getByTestId('verified-display')).toHaveTextContent('verificado');
    });

    // Resetar
    fireEvent.click(screen.getByTestId('reset-button'));

    await waitFor(() => {
      expect(screen.getByTestId('verified-display')).toHaveTextContent('nao-verificado');
      expect(screen.getByTestId('age-display')).toHaveTextContent('10');
    });

    // Verificar que limpou localStorage
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('ecoplay_age_verified');
  });

  it('deve validar idades corretamente', () => {
    function TestComponent() {
      const { verifyAge } = useAgeFilter();
      const [result, setResult] = useState('');
      
      const testAge = (age) => {
        const success = verifyAge(age);
        setResult(`${age} anos: ${success ? 'válido' : 'inválido'}`);
      };
      
      return (
        <div>
          <div data-testid="result-display">{result}</div>
          <button onClick={() => testAge(9)} data-testid="test-9">
            Testar 9
          </button>
          <button onClick={() => testAge(10)} data-testid="test-10">
            Testar 10
          </button>
          <button onClick={() => testAge(14)} data-testid="test-14">
            Testar 14
          </button>
          <button onClick={() => testAge(15)} data-testid="test-15">
            Testar 15
          </button>
        </div>
      );
    }

    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Testar idades
    fireEvent.click(screen.getByTestId('test-9'));
    expect(screen.getByTestId('result-display')).toHaveTextContent('9 anos: inválido');

    fireEvent.click(screen.getByTestId('test-10'));
    expect(screen.getByTestId('result-display')).toHaveTextContent('10 anos: válido');

    fireEvent.click(screen.getByTestId('test-14'));
    expect(screen.getByTestId('result-display')).toHaveTextContent('14 anos: válido');

    fireEvent.click(screen.getByTestId('test-15'));
    expect(screen.getByTestId('result-display')).toHaveTextContent('15 anos: inválido');
  });
});