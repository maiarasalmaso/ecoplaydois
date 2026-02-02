import { describe, it, expect } from 'vitest';
import {
  hostResyncResponse,
  nextStateWithRev,
  selectDeterministicOpponent,
  shouldAcceptIncomingState,
  shouldRequestMatchResync,
  updateRttEstimate,
} from './passaRepassaMultiplayer';

describe('passaRepassaMultiplayer', () => {
  it('forma duplas determinísticas sem sobreposição', () => {
    const peersA = [
      { userId: 'b', name: 'B' },
      { userId: 'c', name: 'C' },
      { userId: 'd', name: 'D' }
    ];
    const pickA = selectDeterministicOpponent({ selfId: 'a', selfName: 'A', peers: peersA });
    expect(pickA).toEqual({ opponentId: 'b', isHost: true });

    const peersC = [
      { userId: 'a', name: 'A' },
      { userId: 'b', name: 'B' },
      { userId: 'd', name: 'D' }
    ];
    const pickC = selectDeterministicOpponent({ selfId: 'c', selfName: 'C', peers: peersC });
    expect(pickC).toEqual({ opponentId: 'd', isHost: true });
  });

  it('não cria dupla quando há quantidade ímpar e o self fica sem par', () => {
    const peersE = [
      { userId: 'a', name: 'A' },
      { userId: 'b', name: 'B' }
    ];
    const pickE = selectDeterministicOpponent({ selfId: 'e', selfName: 'E', peers: peersE });
    expect(pickE).toBeNull();
  });

  it('solicita resync quando estado está ausente ou stale', () => {
    expect(shouldRequestMatchResync({ stage: 'playing', nowMs: 10_000, lastStateAtMs: 0 })).toBe(true);
    expect(shouldRequestMatchResync({ stage: 'playing', nowMs: 10_000, lastStateAtMs: 6000 })).toBe(false);
    expect(shouldRequestMatchResync({ stage: 'playing', nowMs: 10_000, lastStateAtMs: 5000 })).toBe(true);
    expect(shouldRequestMatchResync({ stage: 'queue', nowMs: 10_000, lastStateAtMs: 0 })).toBe(false);
  });

  it('host responde sync-request com state atual', () => {
    const state = { matchId: 'm1', phase: 'question' };
    const response = hostResyncResponse({ event: 'sync-request', payload: { matchId: 'm1', userId: 'b' }, matchId: 'm1', state });
    expect(response).toEqual({ event: 'state', payload: state });

    expect(hostResyncResponse({ event: 'sync-request', payload: { matchId: 'm2' }, matchId: 'm1', state })).toBeNull();
  });

  it('aceita state apenas quando rev não retrocede', () => {
    const current = { matchId: 'm1', rev: 5, phase: 'question' };
    expect(shouldAcceptIncomingState({ currentState: current, incomingState: { matchId: 'm1', rev: 6 } })).toBe(true);
    expect(shouldAcceptIncomingState({ currentState: current, incomingState: { matchId: 'm1', rev: 5 } })).toBe(true);
    expect(shouldAcceptIncomingState({ currentState: current, incomingState: { matchId: 'm1', rev: 4 } })).toBe(false);
    expect(shouldAcceptIncomingState({ currentState: current, incomingState: { matchId: 'm2', rev: 99 } })).toBe(false);
  });

  it('incrementa rev e adiciona updatedAtMs ao publicar state', () => {
    const prev = { matchId: 'm1', rev: 2 };
    const next = nextStateWithRev({ prevState: prev, nextState: { matchId: 'm1', phase: 'result' }, nowMs: 1234 });
    expect(next.rev).toBe(3);
    expect(next.updatedAtMs).toBe(1234);
  });

  it('suaviza RTT para evitar oscilação sob jitter', () => {
    expect(updateRttEstimate({ prevMs: null, sampleMs: 120 })).toBe(120);
    expect(updateRttEstimate({ prevMs: 100, sampleMs: 300, alpha: 0.25 })).toBe(150);
    expect(updateRttEstimate({ prevMs: 150, sampleMs: 50, alpha: 0.5 })).toBe(100);
  });
});
