import { describe, it, expect, beforeEach, vi } from 'vitest';

// Definir global para ambientes de teste
const global = (typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {});
import { renderHook, act } from '@testing-library/react';
import { AgeFilterProvider, useAgeFilter } from '@/context/AgeFilterContext';

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

describe('AgeFilterContext - Testes Unitários', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('deve inicializar com valores padrão', () => {
    const { result } = renderHook(() => useAgeFilter(), {
      wrapper: AgeFilterProvider,
    });

    expect(result.current.selectedAge).toBe(10);
    expect(result.current.isAgeVerified).toBe(false);
    expect(typeof result.current.ageRestrictions).toBe('object');
    expect(Object.keys(result.current.ageRestrictions).length).toBe(5);
  });

  it('deve verificar idade válida', () => {
    const { result } = renderHook(() => useAgeFilter(), {
      wrapper: AgeFilterProvider,
    });

    act(() => {
      result.current.verifyAge(12);
    });

    expect(result.current.selectedAge).toBe(12);
    expect(result.current.isAgeVerified).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('ecoplay_selected_age', '12');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('ecoplay_age_verified', 'true');
  });

  it('deve bloquear idade inválida', () => {
    const { result } = renderHook(() => useAgeFilter(), {
      wrapper: AgeFilterProvider,
    });

    let result9, result15;

    act(() => {
      result9 = result.current.verifyAge(9);
      result15 = result.current.verifyAge(15);
    });

    expect(result9).toBe(false);
    expect(result15).toBe(false);
    expect(result.current.isAgeVerified).toBe(false);
  });

  it('deve permitir conteúdo apropriado para a idade', () => {
    const { result } = renderHook(() => useAgeFilter(), {
      wrapper: AgeFilterProvider,
    });

    // Verificar idade 12
    act(() => {
      result.current.verifyAge(12);
    });

    // Conteúdo para 10-14 deve ser permitido
    const allowedContent = result.current.isContentAllowed({ minAge: 10, maxAge: 14 });
    expect(allowedContent).toBe(true);

    // Conteúdo para 15-16 deve ser bloqueado
    const blockedContent = result.current.isContentAllowed({ minAge: 15, maxAge: 16 });
    expect(blockedContent).toBe(false);
  });

  it('deve resetar filtro de idade', () => {
    const { result } = renderHook(() => useAgeFilter(), {
      wrapper: AgeFilterProvider,
    });

    // Primeiro verificar uma idade
    act(() => {
      result.current.verifyAge(12);
    });

    expect(result.current.isAgeVerified).toBe(true);

    // Depois resetar
    act(() => {
      result.current.resetAgeFilter();
    });

    expect(result.current.isAgeVerified).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('ecoplay_age_verified');
  });

  it('deve carregar idade salva do localStorage', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'ecoplay_selected_age') return '13';
      if (key === 'ecoplay_age_verified') return 'true';
      return null;
    });

    const { result } = renderHook(() => useAgeFilter(), {
      wrapper: AgeFilterProvider,
    });

    expect(result.current.selectedAge).toBe(13);
    expect(result.current.isAgeVerified).toBe(true);
  });

  it('deve retornar mensagem de restrição correta', () => {
    const { result } = renderHook(() => useAgeFilter(), {
      wrapper: AgeFilterProvider,
    });

    // Quando não verificado
    const messageNotVerified = result.current.getAgeRestrictionMessage({ minAge: 15, maxAge: 16 });
    expect(messageNotVerified).toBe('Por favor, selecione sua idade para acessar este conteúdo.');

    // Quando verificado com idade inadequada
    act(() => {
      result.current.verifyAge(12);
    });

    const messageVerified = result.current.getAgeRestrictionMessage({ minAge: 15, maxAge: 16 });
    expect(messageVerified).toBe('Este conteúdo é para 15+ anos. Você selecionou 12 anos.');
  });

  it('deve validar idades corretamente', () => {
    const { result } = renderHook(() => useAgeFilter(), {
      wrapper: AgeFilterProvider,
    });

    // Idades válidas (10-14)
    expect(result.current.verifyAge(10)).toBe(true);
    expect(result.current.verifyAge(11)).toBe(true);
    expect(result.current.verifyAge(12)).toBe(true);
    expect(result.current.verifyAge(13)).toBe(true);
    expect(result.current.verifyAge(14)).toBe(true);

    // Idades inválidas
    expect(result.current.verifyAge(9)).toBe(false);
    expect(result.current.verifyAge(15)).toBe(false);
    expect(result.current.verifyAge(0)).toBe(false);
    expect(result.current.verifyAge(20)).toBe(false);
  });

  it('deve sincronizar com banco de dados quando habilitado', async () => {
    // Mock do remoteDb com banco habilitado
    vi.doMock('../services/remoteDb', () => ({
      isRemoteDbEnabled: () => true,
      getProfile: vi.fn().mockResolvedValue({ id: 'user-123' }),
      ecoplay_set_age_filter: vi.fn().mockResolvedValue({ success: true }),
    }));

    // Recarregar o módulo com novo mock
    vi.resetModules();
    const { AgeFilterProvider: NewProvider, useAgeFilter: NewHook } = await import('@/context/AgeFilterContext');

    const { result } = renderHook(() => NewHook(), {
      wrapper: NewProvider,
    });

    // Verificar idade
    await act(async () => {
      await result.current.verifyAge(12);
    });

    expect(result.current.selectedAge).toBe(12);
    expect(result.current.isAgeVerified).toBe(true);
  });
});