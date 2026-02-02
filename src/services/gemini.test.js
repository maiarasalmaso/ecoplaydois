import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateQuizQuestions } from '../../frontend/src/services/gemini';

describe('Gemini Service - generateQuizQuestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    import.meta.env.VITE_GEMINI_API_KEY = 'test-key';
    globalThis.fetch = vi.fn();
  });

  it('deve gerar 5 perguntas válidas quando a API retorna JSON correto', async () => {
    const mockQuestions = Array(5).fill(null).map((_, i) => ({
      id: `q${i}`,
      question: `Question ${i}`,
      options: ['A', 'B', 'C', 'D'],
      correct: 0,
      explanation: 'Exp'
    }));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: JSON.stringify(mockQuestions) }] } }
        ]
      })
    });

    const result = await generateQuizQuestions(10, 'test', 5, true);

    expect(result.success).toBe(true);
    expect(result.questions).toHaveLength(5);
    expect(result.source).toBe('api');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('deve tentar corrigir e retornar sucesso se a API falhar na primeira tentativa mas conseguir na segunda (retry logic)', async () => {
    const partialQuestions = Array(2).fill(null).map((_, i) => ({
      id: `q${i}`,
      question: `Question ${i}`,
      options: ['A', 'B', 'C', 'D'],
      correct: 0,
      explanation: 'Exp'
    }));

    const moreQuestions = Array(3).fill(null).map((_, i) => ({
      id: `q_new_${i}`,
      question: `New Question ${i}`,
      options: ['A', 'B', 'C', 'D'],
      correct: 0,
      explanation: 'Exp'
    }));

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(partialQuestions) }] } }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(moreQuestions) }] } }
          ]
        })
      });

    const result = await generateQuizQuestions(10, 'test', 5, true);

    expect(result.success).toBe(true);
    expect(result.questions).toHaveLength(5);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('deve retornar fallback se a API falhar completamente', async () => {
    fetch.mockRejectedValue(new Error('API Error'));

    const result = await generateQuizQuestions(10, 'test', 5, true);

    expect(result.success).toBe(false);
    expect(result.source).toBe('fallback');
    expect(result.questions).toBeDefined();
    expect(result.questions.length).toBeGreaterThan(0);
  });

  it('deve validar estrutura das perguntas', async () => {
    const invalidQuestions = [
      { question: 'No options' },
      { question: 'Valid', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'Exp' }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: JSON.stringify(invalidQuestions) }] } }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            { content: { parts: [{ text: JSON.stringify([]) }] } }
          ]
        })
      });

    const result = await generateQuizQuestions(10, 'test', 5, true);

    expect(result.success).toBe(true);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].question).toBe('Valid');
  });

  it('deve retornar perguntas de fallback se a chave API estiver ausente', async () => {
    import.meta.env.VITE_GEMINI_API_KEY = '';
    const result = await generateQuizQuestions(10, 'test', 5, true);
    expect(result.success).toBe(false);
    expect(result.source).toBe('fallback');
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.error).toContain('Chave de API não configurada');
  });
});
