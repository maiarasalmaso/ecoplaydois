import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { useState } from 'react';

// Definir global para ambientes de teste
const global = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {});
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { AgeFilterProvider, useAgeFilter } from '@/context/AgeFilterContext';
import AgeVerificationModal from '@/components/forms/AgeVerificationModal';
import AgeRestrictedContent from '@/components/games/AgeRestrictedContent';
import AgeFilterBanner from '@/components/games/AgeFilterBanner';

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
vi.mock('@/services/remoteDb', () => ({
  isRemoteDbEnabled: () => false,
}));

// Limpar entre testes
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Componente de teste para o hook
const TestComponent = () => {
  const {
    selectedAge,
    isAgeVerified,
    ageRestrictions,
    verifyAge,
    resetAgeFilter,
    isContentAllowed,
    getAgeRestrictionMessage,
  } = useAgeFilter();

  return (
    <div>
      <div data-testid="selected-age">{selectedAge}</div>
      <div data-testid="is-verified">{isAgeVerified ? 'true' : 'false'}</div>
      <div data-testid="restrictions-count">{Object.keys(ageRestrictions).length}</div>
      
      <button onClick={() => verifyAge(12)} data-testid="verify-12">
        Verify Age 12
      </button>
      
      <button onClick={() => resetAgeFilter()} data-testid="reset-filter">
        Reset Filter
      </button>
      
      <div data-testid="test-content-allowed">
        {isContentAllowed({ minAge: 10, maxAge: 14 }) ? 'allowed' : 'blocked'}
      </div>
      
      <div data-testid="restriction-message">
        {getAgeRestrictionMessage({ minAge: 15, maxAge: 16 })}
      </div>
    </div>
  );
};

describe('AgeFilterContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('deve inicializar com valores padrão', () => {
    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    expect(screen.getAllByTestId('selected-age')[0]).toHaveTextContent('10');
    expect(screen.getAllByTestId('is-verified')[0]).toHaveTextContent('false');
    expect(screen.getAllByTestId('restrictions-count')[0]).toHaveTextContent('5');
  });

  it('deve carregar idade salva do localStorage', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'ecoplay_selected_age') return '12';
      if (key === 'ecoplay_age_verified') return 'true';
      return null;
    });

    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    expect(screen.getAllByTestId('selected-age')[0]).toHaveTextContent('12');
    expect(screen.getAllByTestId('is-verified')[0]).toHaveTextContent('true');
  });

  it('deve verificar idade válida', async () => {
    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    fireEvent.click(screen.getAllByTestId('verify-12')[0]);

    await waitFor(() => {
      expect(screen.getAllByTestId('selected-age')[0]).toHaveTextContent('12');
      expect(screen.getAllByTestId('is-verified')[0]).toHaveTextContent('true');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('ecoplay_selected_age', '12');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('ecoplay_age_verified', 'true');
  });

  it('deve bloquear idade inválida', async () => {
    const TestInvalidAgeComponent = () => {
      const { verifyAge, isAgeVerified } = useAgeFilter();
      
      return (
        <div>
          <button onClick={() => verifyAge(9)} data-testid="verify-9">
            Verificar Idade 9
          </button>
          <button onClick={() => verifyAge(15)} data-testid="verify-15">
            Verificar Idade 15
          </button>
          <div data-testid="is-verified">{isAgeVerified ? 'true' : 'false'}</div>
        </div>
      );
    };

    render(
      <AgeFilterProvider>
        <TestInvalidAgeComponent />
      </AgeFilterProvider>
    );

    // Testar idade fora do intervalo permitido
    fireEvent.click(screen.getAllByTestId('verify-9')[0]);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('is-verified')[0]).toHaveTextContent('false');
    });

    fireEvent.click(screen.getAllByTestId('verify-15')[0]);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('is-verified')[0]).toHaveTextContent('false');
    });
  });

  it('deve resetar filtro de idade', async () => {
    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Primeiro verificar uma idade
    fireEvent.click(screen.getAllByTestId('verify-12')[0]);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('is-verified')[0]).toHaveTextContent('true');
    });

    // Depois resetar
    fireEvent.click(screen.getAllByTestId('reset-filter')[0]);

    await waitFor(() => {
      expect(screen.getAllByTestId('is-verified')[0]).toHaveTextContent('false');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('ecoplay_age_verified');
  });

  it('deve permitir conteúdo apropriado para a idade', async () => {
    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Verificar idade 12
    fireEvent.click(screen.getAllByTestId('verify-12')[0]);

    await waitFor(() => {
      expect(screen.getAllByTestId('test-content-allowed')[0]).toHaveTextContent('allowed');
    });
  });

  it('deve bloquear conteúdo inapropriado para a idade', async () => {
    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Verificar idade 12
    fireEvent.click(screen.getAllByTestId('verify-12')[0]);

    await waitFor(() => {
      expect(screen.getAllByTestId('restriction-message')[0]).toHaveTextContent(
        'Este conteúdo é para 15+ anos. Você selecionou 12 anos.'
      );
    });
  });

  it('deve exibir mensagem quando não verificado', () => {
    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    expect(screen.getAllByTestId('restriction-message')[0]).toHaveTextContent(
      'Por favor, selecione sua idade para acessar este conteúdo.'
    );
  });
});

describe('AgeVerificationModal', () => {
  it('deve renderizar modal de verificação', () => {
    render(
      <AgeFilterProvider>
        <AgeVerificationModal isOpen={true} onClose={vi.fn()} />
      </AgeFilterProvider>
    );

    expect(screen.getByText('Verificação de Idade')).toBeInTheDocument();
    expect(screen.getByText('Por favor, selecione sua idade para acessar o conteúdo apropriado.')).toBeInTheDocument();
  });

  it('deve permitir selecionar idade', async () => {
    const onVerify = vi.fn();
    
    render(
      <AgeFilterProvider>
        <AgeVerificationModal isOpen={true} onClose={vi.fn()} onVerify={onVerify} />
      </AgeFilterProvider>
    );

    fireEvent.click(screen.getAllByText('12')[0]);
    fireEvent.click(screen.getAllByText('Confirmar')[0]);

    await waitFor(() => {
      expect(onVerify).toHaveBeenCalledWith(12);
    });
  });

  it('deve fechar modal ao cancelar', () => {
    const onClose = vi.fn();
    
    render(
      <AgeFilterProvider>
        <AgeVerificationModal isOpen={true} onClose={onClose} />
      </AgeFilterProvider>
    );

    fireEvent.click(screen.getAllByText('Cancelar')[0]);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AgeRestrictedContent', () => {
  it('deve renderizar conteúdo quando permitido', async () => {
    const TestComponent = () => {
      const { verifyAge } = useAgeFilter();
      
      return (
        <div>
          <button onClick={() => verifyAge(12)} data-testid="verify-12">
            Verificar Idade
          </button>
          <AgeRestrictedContent content={{ minAge: 10, maxAge: 14 }}>
            <div>Conteúdo permitido</div>
          </AgeRestrictedContent>
        </div>
      );
    };

    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Verificar idade primeiro
    fireEvent.click(screen.getAllByTestId('verify-12')[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Conteúdo permitido')[0]).toBeInTheDocument();
    });
  });

  it('deve renderizar mensagem de restrição quando bloqueado', async () => {
    const TestBlockedComponent = () => {
      const { verifyAge } = useAgeFilter();
      
      return (
        <div>
          <button onClick={() => verifyAge(10)} data-testid="verify-10">
            Verificar Idade 10
          </button>
          <AgeRestrictedContent content={{ minAge: 15, maxAge: 16 }}>
            <div>Conteúdo bloqueado</div>
          </AgeRestrictedContent>
        </div>
      );
    };

    render(
      <AgeFilterProvider>
        <TestBlockedComponent />
      </AgeFilterProvider>
    );

    // Verificar idade 10
    fireEvent.click(screen.getAllByTestId('verify-10')[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Conteúdo Restrito')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Este conteúdo é para 15+ anos. Você selecionou 10 anos.')[0]).toBeInTheDocument();
    });
  });
});

describe('AgeFilterBanner', () => {
  it('não deve renderizar quando não verificado', () => {
    render(
      <AgeFilterProvider>
        <AgeFilterBanner />
      </AgeFilterProvider>
    );

    expect(screen.queryByText('Filtro de Idade Ativado')).not.toBeInTheDocument();
  });

  it('deve renderizar quando verificado', async () => {
    const TestBannerComponent = () => {
      const { verifyAge } = useAgeFilter();
      
      return (
        <div>
          <button onClick={() => verifyAge(12)} data-testid="verify-12">
            Verificar Idade
          </button>
          <AgeFilterBanner />
        </div>
      );
    };

    render(
      <AgeFilterProvider>
        <TestBannerComponent />
      </AgeFilterProvider>
    );

    // Verificar idade
    fireEvent.click(screen.getAllByTestId('verify-12')[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Filtro de Idade Ativado')[0]).toBeInTheDocument();
      expect(screen.getByText((content, element) => {
        return content.includes('Mostrando conteúdo para') && content.includes('12');
      })).toBeInTheDocument();
    });
  });

  it('deve permitir alterar idade', async () => {
    const TestChangeAgeComponent = () => {
      const { verifyAge, resetAgeFilter } = useAgeFilter();
      const [showModal, setShowModal] = useState(false);
      
      return (
        <div>
          <button onClick={() => verifyAge(12)} data-testid="verify-12">
            Verificar Idade
          </button>
          <button onClick={() => setShowModal(true)} data-testid="change-age">
            Alterar
          </button>
          <AgeVerificationModal 
            isOpen={showModal} 
            onClose={() => setShowModal(false)} 
          />
          <AgeFilterBanner />
        </div>
      );
    };
    
    render(
      <AgeFilterProvider>
        <TestChangeAgeComponent />
      </AgeFilterProvider>
    );

    // Verificar idade
    fireEvent.click(screen.getAllByTestId('verify-12')[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Filtro de Idade Ativado')[0]).toBeInTheDocument();
    });

    // Clicar em alterar
    fireEvent.click(screen.getAllByTestId('change-age')[0]);

    // Selecionar nova idade
    fireEvent.click(screen.getAllByText('13')[0]);
    fireEvent.click(screen.getAllByText('Confirmar')[0]);

    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return content.includes('Mostrando conteúdo para') && content.includes('13');
      })).toBeInTheDocument();
    });
  });
});

describe('Integração com localStorage', () => {
  it('deve persistir estado no localStorage', async () => {
    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    fireEvent.click(screen.getAllByTestId('verify-12')[0]);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('ecoplay_selected_age', '12');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('ecoplay_age_verified', 'true');
    });
  });

  it('deve limpar estado do localStorage ao resetar', async () => {
    render(
      <AgeFilterProvider>
        <TestComponent />
      </AgeFilterProvider>
    );

    // Primeiro verificar
    fireEvent.click(screen.getAllByTestId('verify-12')[0]);

    await waitFor(() => {
      expect(screen.getAllByTestId('is-verified')[0]).toHaveTextContent('true');
    });

    // Depois resetar
    fireEvent.click(screen.getAllByTestId('reset-filter')[0]);

    await waitFor(() => {
      expect(screen.getAllByTestId('is-verified')[0]).toHaveTextContent('false');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ecoplay_age_verified');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('ecoplay_selected_age');
    });
  });
});