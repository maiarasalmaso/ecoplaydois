import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Definir global para ambientes de teste
const global = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {});
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { AgeFilterProvider, useAgeFilter } from '../../frontend/src/context/AgeFilterContext';
import AgeVerificationModal from '../../frontend/src/components/forms/AgeVerificationModal';
import AgeRestrictedContent from '../../frontend/src/components/games/AgeRestrictedContent';
import AgeFilterBanner from '../../frontend/src/components/games/AgeFilterBanner';

expect.extend(matchers);

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock do remoteDb
vi.mock('../../frontend/src/services/remoteDb', () => ({
  isRemoteDbEnabled: () => false,
}));

describe('Sistema de Filtro de Idades - Teste de Integração Completo', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('deve verificar idade e filtrar conteúdo corretamente', async () => {
    const TestComponent = () => {
      const { selectedAge, isAgeVerified, verifyAge, isContentAllowed } = useAgeFilter();
      
      return (
        <div>
          <div data-testid="age">{selectedAge}</div>
          <div data-testid="verified">{isAgeVerified ? 'sim' : 'não'}</div>
          
          <button onClick={() => verifyAge(12)} data-testid="verify-12">
            Verificar 12 anos
          </button>
          
          <div data-testid="content-10-14">
            {isContentAllowed({ minAge: 10, maxAge: 14 }) ? 'permitido' : 'bloqueado'}
          </div>
          
          <div data-testid="content-15-16">
            {isContentAllowed({ minAge: 15, maxAge: 16 }) ? 'permitido' : 'bloqueado'}
          </div>
        </div>
      );
    };

    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Estado inicial
    expect(screen.getByTestId('age')).toHaveTextContent('10');
    expect(screen.getByTestId('verified')).toHaveTextContent('não');
    expect(screen.getByTestId('content-10-14')).toHaveTextContent('bloqueado');
    expect(screen.getByTestId('content-15-16')).toHaveTextContent('bloqueado');

    // Verificar idade - usar getAllByTestId para evitar duplicados
    fireEvent.click(screen.getAllByTestId('verify-12')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('verified')).toHaveTextContent('sim');
      expect(screen.getByTestId('age')).toHaveTextContent('12');
    });

    // Verificar conteúdo após verificação
    expect(screen.getByTestId('content-10-14')).toHaveTextContent('permitido');
    expect(screen.getByTestId('content-15-16')).toHaveTextContent('bloqueado');

    // Verificar localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('ecoplay_selected_age', '12');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('ecoplay_age_verified', 'true');
  });

  it('deve persistir estado no localStorage', async () => {
    // Simular dados salvos
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'ecoplay_selected_age') return '13';
      if (key === 'ecoplay_age_verified') return 'true';
      return null;
    });

    const TestComponent = () => {
      const { selectedAge, isAgeVerified } = useAgeFilter();
      return (
        <div>
          <div data-testid="age">{selectedAge}</div>
          <div data-testid="verified">{isAgeVerified ? 'sim' : 'não'}</div>
        </div>
      );
    };

    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Deve carregar do localStorage
    expect(screen.getByTestId('age')).toHaveTextContent('13');
    expect(screen.getByTestId('verified')).toHaveTextContent('sim');
  });

  it('deve resetar filtro corretamente', async () => {
    const TestComponent = () => {
      const { selectedAge, isAgeVerified, verifyAge, resetAgeFilter } = useAgeFilter();
      
      return (
        <div>
          <div data-testid="age">{selectedAge}</div>
          <div data-testid="verified">{isAgeVerified ? 'sim' : 'não'}</div>
          
          <button onClick={() => verifyAge(12)} data-testid="verify">
            Verificar
          </button>
          
          <button onClick={resetAgeFilter} data-testid="reset">
            Resetar
          </button>
        </div>
      );
    };

    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Verificar idade
    fireEvent.click(screen.getAllByTestId('verify')[0]);

    await waitFor(() => {
      expect(screen.getByTestId('verified')).toHaveTextContent('sim');
    });

    // Resetar
    fireEvent.click(screen.getByTestId('reset'));

    await waitFor(() => {
      expect(screen.getByTestId('verified')).toHaveTextContent('não');
      expect(screen.getByTestId('age')).toHaveTextContent('10');
    });

    // Verificar que limpou localStorage
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('ecoplay_age_verified');
  });

  it('deve mostrar modal de verificação corretamente', async () => {
    const onVerify = vi.fn();
    const onClose = vi.fn();

    render(
      <AgeFilterProvider>
        <AgeVerificationModal isOpen={true} onClose={onClose} onVerify={onVerify} />
      </AgeFilterProvider>
    );

    // Verificar que o modal aparece
    expect(screen.getByText('Verificação de Idade')).toBeInTheDocument();
    expect(screen.getByText('Por favor, selecione sua idade para acessar o conteúdo apropriado.')).toBeInTheDocument();
    
    // Verificar que mostra idades 10-14 - usar getAllByText e pegar o primeiro
    expect(screen.getAllByText('10')[0]).toBeInTheDocument();
    expect(screen.getAllByText('11')[0]).toBeInTheDocument();
    expect(screen.getAllByText('12')[0]).toBeInTheDocument();
    expect(screen.getAllByText('13')[0]).toBeInTheDocument();
    expect(screen.getAllByText('14')[0]).toBeInTheDocument();

    // Selecionar idade e confirmar
    const user = userEvent.setup();
    
    // Clicar no botão "12" do modal (deve ser o primeiro)
    const ageButtons = screen.getAllByText('12');
    await user.click(ageButtons[0]);
    
    // Clicar no botão "Confirmar" (deve ser o primeiro)
    const confirmButtons = screen.getAllByText('Confirmar');
    await user.click(confirmButtons[0]);

    expect(onVerify).toHaveBeenCalledWith(12);
  });

  it('deve bloquear conteúdo inadequado', () => {
    const TestComponent = () => {
      const { verifyAge } = useAgeFilter();
      
      return (
        <div>
          <button onClick={() => verifyAge(12)} data-testid="verify-12">
            Verificar 12 anos
          </button>
          
          <AgeRestrictedContent content={{ minAge: 15, maxAge: 16 }}>
            <div>Conteúdo para 15-16 anos</div>
          </AgeRestrictedContent>
        </div>
      );
    };

    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Antes de verificar idade - deve mostrar mensagem genérica
    expect(screen.getByText('Conteúdo Restrito')).toBeInTheDocument();
    expect(screen.getByText('Por favor, selecione sua idade para acessar este conteúdo.')).toBeInTheDocument();

    // Verificar idade
    fireEvent.click(screen.getByTestId('verify-12'));

    // Ainda deve estar bloqueado
    expect(screen.getByText('Conteúdo Restrito')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return content.includes('Este conteúdo é para 15+ anos. Você selecionou 12 anos.');
    })).toBeInTheDocument();
  });

  it('deve mostrar banner quando verificado', async () => {
    const TestComponent = () => {
      const { verifyAge } = useAgeFilter();
      
      return (
        <div>
          <button onClick={() => verifyAge(12)} data-testid="verify">
            Verificar
          </button>
          <AgeFilterBanner />
        </div>
      );
    };

    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Inicialmente não mostra banner
    expect(screen.queryByText('Filtro de Idade Ativado')).not.toBeInTheDocument();

    // Verificar idade - usar getAllByTestId para evitar duplicados
    fireEvent.click(screen.getAllByTestId('verify')[0]);

    await waitFor(() => {
      expect(screen.getByText('Filtro de Idade Ativado')).toBeInTheDocument();
      expect(screen.getByText('Mostrando conteúdo para 12 anos')).toBeInTheDocument();
    });
  });

  it('deve validar idades corretamente', () => {
    const TestComponent = () => {
      const { verifyAge } = useAgeFilter();
      const [result, setResult] = useState('');
      
      const testAge = (age) => {
        const success = verifyAge(age);
        setResult(`${age} anos: ${success ? 'válido' : 'inválido'}`);
      };
      
      return (
        <div>
          <div data-testid="result">{result}</div>
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
    };

    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Testar idades - usar getAllByTestId para evitar duplicados
    fireEvent.click(screen.getAllByTestId('test-9')[0]);
    expect(screen.getAllByTestId('result')[0]).toHaveTextContent('9 anos: inválido');

    fireEvent.click(screen.getAllByTestId('test-10')[0]);
    expect(screen.getAllByTestId('result')[0]).toHaveTextContent('10 anos: válido');

    fireEvent.click(screen.getAllByTestId('test-14')[0]);
    expect(screen.getAllByTestId('result')[0]).toHaveTextContent('14 anos: válido');

    fireEvent.click(screen.getAllByTestId('test-15')[0]);
    expect(screen.getAllByTestId('result')[0]).toHaveTextContent('15 anos: inválido');
  });
});