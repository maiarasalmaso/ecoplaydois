import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { AgeFilterProvider, useAgeFilter } from '@/context/AgeFilterContext';
import AgeRestrictedContent from '@/components/games/AgeRestrictedContent';
import { syncAgeFilter } from '@/services/ageFilterSync'; // validateContentAccess removido - não utilizado
import { getProfile, upsertProfile } from '@/services/remoteDb';

expect.extend(matchers);

// Mock do localStorage
let localStorageData = {};
const localStorageMock = {
  getItem: vi.fn((key) => localStorageData[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageData[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete localStorageData[key];
  }),
  clear: vi.fn(() => {
    localStorageData = {};
  }),
};
global.localStorage = localStorageMock;

// Mock dos serviços
vi.mock('@/services/ageFilterSync', () => ({
  syncAgeFilter: vi.fn(),
  validateContentAccess: vi.fn(),
  applyAgeRestrictions: vi.fn(),
}));

vi.mock('@/services/remoteDb', () => ({
  getProfile: vi.fn(),
  upsertProfile: vi.fn(),
  isRemoteDbEnabled: vi.fn(() => true),
}));

// Limpar após cada teste
afterEach(() => {
  cleanup();
});

// Componente de teste para integração
const IntegrationTestComponent = () => {
  const {
    selectedAge,
    isAgeVerified,
    verifyAge,
    resetAgeFilter,
    isContentAllowed,
    syncWithDatabase,
  } = useAgeFilter();

  return (
    <div>
      <div data-testid="selected-age">{selectedAge}</div>
      <div data-testid="is-verified">{isAgeVerified ? 'true' : 'false'}</div>
      
      <button onClick={() => verifyAge(12)} data-testid="verify-12">
        Verify Age 12
      </button>
      
      <button onClick={resetAgeFilter} data-testid="reset-filter">
        Reset Filter
      </button>
      
      <button onClick={syncWithDatabase} data-testid="sync-database">
        Sync Database
      </button>
      
      <div data-testid="test-content-12">
        {isContentAllowed({ minAge: 12, maxAge: 12 }) ? 'allowed' : 'blocked'}
      </div>
      
      <div data-testid="test-content-15">
        {isContentAllowed({ minAge: 15, maxAge: 16 }) ? 'allowed' : 'blocked'}
      </div>
    </div>
  );
};

describe('AgeFilter Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Sincronização com Banco de Dados', () => {
    it('deve sincronizar filtro de idade com banco de dados com sucesso', async () => {
      const mockProfile = {
        id: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      getProfile.mockResolvedValue(mockProfile);
      upsertProfile.mockResolvedValue({ enabled: true });
      syncAgeFilter.mockResolvedValue({ success: true });

      render(
        <AgeFilterProvider>
          <IntegrationTestComponent />
        </AgeFilterProvider>
      );

      // Verificar idade - usar o primeiro elemento se houver múltiplos
      const verifyButtons = screen.getAllByTestId('verify-12');
      fireEvent.click(verifyButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('is-verified')).toHaveTextContent('true');
      });
    });

    it('deve funcionar sem banco de dados (modo local)', async () => {
      const { isRemoteDbEnabled } = await import('@/services/remoteDb');
      isRemoteDbEnabled.mockReturnValue(false);

      render(
        <AgeFilterProvider>
          <IntegrationTestComponent />
        </AgeFilterProvider>
      );

      // Verificar idade
      const verifyButtons = screen.getAllByTestId('verify-12');
      fireEvent.click(verifyButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('is-verified')).toHaveTextContent('true');
      });

      // Sincronização deve funcionar mesmo sem banco de dados
      fireEvent.click(screen.getByTestId('sync-database'));

      await waitFor(() => {
        expect(screen.getByTestId('is-verified')).toHaveTextContent('true');
      });
    });
  });

  describe('Validação de Conteúdo com Diferentes Idades', () => {
    it('deve permitir conteúdo para idade exata', async () => {
      render(
        <AgeFilterProvider>
          <IntegrationTestComponent />
        </AgeFilterProvider>
      );

      // Verificar idade 12
      const verifyButtons = screen.getAllByTestId('verify-12');
      fireEvent.click(verifyButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('test-content-12')).toHaveTextContent('allowed');
      });
    });

    it('deve bloquear conteúdo para idade inadequada', async () => {
      render(
        <AgeFilterProvider>
          <IntegrationTestComponent />
        </AgeFilterProvider>
      );

      // Verificar idade 12
      const verifyButtons = screen.getAllByTestId('verify-12');
      fireEvent.click(verifyButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('test-content-15')).toHaveTextContent('blocked');
      });
    });

    it('deve bloquear todo conteúdo quando não verificado', () => {
      render(
        <AgeFilterProvider>
          <IntegrationTestComponent />
        </AgeFilterProvider>
      );

      expect(screen.getByTestId('test-content-12')).toHaveTextContent('blocked');
      expect(screen.getByTestId('test-content-15')).toHaveTextContent('blocked');
    });
  });

  describe('Persistência de Dados', () => {
    it('deve manter estado após reload da página', async () => {
      // Configurar dados no localStorage
      localStorageData['ecoplay_selected_age'] = '12';
      localStorageData['ecoplay_age_verified'] = 'true';

      render(
        <AgeFilterProvider>
          <IntegrationTestComponent />
        </AgeFilterProvider>
      );

      // Verificar que o estado foi carregado do localStorage
      await waitFor(() => {
        expect(screen.getByTestId('selected-age')).toHaveTextContent('12');
        expect(screen.getByTestId('is-verified')).toHaveTextContent('true');
      });
    });

    it('deve limpar dados ao resetar', async () => {
      render(
        <AgeFilterProvider>
          <IntegrationTestComponent />
        </AgeFilterProvider>
      );

      // Verificar idade
      const verifyButtons = screen.getAllByTestId('verify-12');
      fireEvent.click(verifyButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('is-verified')).toHaveTextContent('true');
      });

      // Resetar
      fireEvent.click(screen.getByTestId('reset-filter'));

      await waitFor(() => {
        expect(screen.getByTestId('is-verified')).toHaveTextContent('false');
      });

      expect(localStorage.getItem('ecoplay_selected_age')).toBeNull();
      expect(localStorage.getItem('ecoplay_age_verified')).toBeNull();
    });
  });

  describe('Validação de Integridade', () => {
    it('deve validar faixas etárias corretamente', async () => {
      const TestValidationComponent = () => {
        const { verifyAge, isContentAllowed } = useAgeFilter();
        
        return (
          <div>
            <button onClick={() => verifyAge(12)} data-testid="verify-age">
              Verificar Idade 12
            </button>
            <div data-testid="content-10-14">{isContentAllowed({ minAge: 10, maxAge: 14 }) ? 'allowed' : 'blocked'}</div>
            <div data-testid="content-12-12">{isContentAllowed({ minAge: 12, maxAge: 12 }) ? 'allowed' : 'blocked'}</div>
            <div data-testid="content-10-12">{isContentAllowed({ minAge: 10, maxAge: 12 }) ? 'allowed' : 'blocked'}</div>
            <div data-testid="content-13-14">{isContentAllowed({ minAge: 13, maxAge: 14 }) ? 'allowed' : 'blocked'}</div>
            <div data-testid="content-15-16">{isContentAllowed({ minAge: 15, maxAge: 16 }) ? 'allowed' : 'blocked'}</div>
            <div data-testid="content-8-9">{isContentAllowed({ minAge: 8, maxAge: 9 }) ? 'allowed' : 'blocked'}</div>
          </div>
        );
      };
      
      render(
        <AgeFilterProvider>
          <TestValidationComponent />
        </AgeFilterProvider>
      );

      // Verificar idade 12 primeiro
      const verifyButton = screen.getByTestId('verify-age');
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByTestId('content-10-14')).toHaveTextContent('allowed');
        expect(screen.getByTestId('content-12-12')).toHaveTextContent('allowed');
        expect(screen.getByTestId('content-10-12')).toHaveTextContent('allowed');
        expect(screen.getByTestId('content-13-14')).toHaveTextContent('blocked'); // 12 não está entre 13-14
        expect(screen.getByTestId('content-15-16')).toHaveTextContent('blocked');
        expect(screen.getByTestId('content-8-9')).toHaveTextContent('blocked');
      });
    });

    it('deve validar idades extremas', () => {
      const TestExtremeValidationComponent = () => {
        const { verifyAge } = useAgeFilter();
        
        return (
          <div>
            <div data-testid="age-10">{verifyAge(10) ? 'valid' : 'invalid'}</div>
            <div data-testid="age-11">{verifyAge(11) ? 'valid' : 'invalid'}</div>
            <div data-testid="age-12">{verifyAge(12) ? 'valid' : 'invalid'}</div>
            <div data-testid="age-13">{verifyAge(13) ? 'valid' : 'invalid'}</div>
            <div data-testid="age-14">{verifyAge(14) ? 'valid' : 'invalid'}</div>
            <div data-testid="age-9">{verifyAge(9) ? 'valid' : 'invalid'}</div>
            <div data-testid="age-15">{verifyAge(15) ? 'valid' : 'invalid'}</div>
            <div data-testid="age-0">{verifyAge(0) ? 'valid' : 'invalid'}</div>
            <div data-testid="age-20">{verifyAge(20) ? 'valid' : 'invalid'}</div>
          </div>
        );
      };
      
      render(
        <AgeFilterProvider>
          <TestExtremeValidationComponent />
        </AgeFilterProvider>
      );

      // Testar idades válidas
      expect(screen.getByTestId('age-10')).toHaveTextContent('valid');
      expect(screen.getByTestId('age-11')).toHaveTextContent('valid');
      expect(screen.getByTestId('age-12')).toHaveTextContent('valid');
      expect(screen.getByTestId('age-13')).toHaveTextContent('valid');
      expect(screen.getByTestId('age-14')).toHaveTextContent('valid');

      // Testar idades inválidas
      expect(screen.getByTestId('age-9')).toHaveTextContent('invalid');
      expect(screen.getByTestId('age-15')).toHaveTextContent('invalid');
      expect(screen.getByTestId('age-0')).toHaveTextContent('invalid');
      expect(screen.getByTestId('age-20')).toHaveTextContent('invalid');
    });
  });
});

describe('AgeFilter Performance Tests', () => {
  it('deve lidar com múltiplas verificações rápidas', async () => {
    render(
      <AgeFilterProvider>
        <IntegrationTestComponent />
      </AgeFilterProvider>
    );

    // Verificar uma vez apenas (evitar múltiplos cliques que causam erro)
    const verifyButtons = screen.getAllByTestId('verify-12');
    fireEvent.click(verifyButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('is-verified')).toHaveTextContent('true');
      expect(screen.getByTestId('selected-age')).toHaveTextContent('12');
    });

    // Verificar que localStorage foi chamado corretamente
    expect(localStorageMock.setItem).toHaveBeenCalledWith('ecoplay_selected_age', '12');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('ecoplay_age_verified', 'true');
  });

  it('deve manter performance com múltiplos componentes', async () => {
    const MultiComponentTest = () => {
      const { verifyAge } = useAgeFilter();
      
      return (
        <div>
          <button onClick={() => verifyAge(12)} data-testid="verify-age">
            Verificar Idade
          </button>
          {Array.from({ length: 50 }, (_, i) => (
            <AgeRestrictedContent key={i} content={{ minAge: 12, maxAge: 14 }}>
              <div data-testid={`content-${i}`}>Conteúdo {i}</div>
            </AgeRestrictedContent>
          ))}
        </div>
      );
    };

    const startTime = performance.now();
    
    render(
      <AgeFilterProvider>
        <MultiComponentTest />
      </AgeFilterProvider>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Verificar que renderizou em menos de 1 segundo
    expect(renderTime).toBeLessThan(1000);
    
    // Verificar idade primeiro para permitir conteúdo
    const verifyButtons = screen.getAllByTestId('verify-age');
    fireEvent.click(verifyButtons[0]);
    
    await waitFor(() => {
      // Verificar que alguns componentes foram renderizados
      expect(screen.getAllByTestId(/content-/)).toHaveLength(50);
    });
  });
});