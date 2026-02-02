export const selectDeterministicOpponent = ({ selfId, selfName, peers }) => {
  const me = String(selfId || '').trim();
  if (!me) return null;

  const roster = [{ userId: me, name: String(selfName || 'Você') }, ...(Array.isArray(peers) ? peers : [])]
    .map((p) => ({ userId: String(p?.userId || '').trim(), name: String(p?.name || 'Jogador') }))
    .filter((p) => p.userId);

  const seen = new Set();
  const unique = [];
  roster.forEach((p) => {
    if (seen.has(p.userId)) return;
    seen.add(p.userId);
    unique.push(p);
  });

  unique.sort((a, b) => a.userId.localeCompare(b.userId));
  const idx = unique.findIndex((p) => p.userId === me);
  if (idx === -1) return null;

  const partnerIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
  if (partnerIdx < 0 || partnerIdx >= unique.length) return null;

  const opponentId = unique[partnerIdx]?.userId;
  if (!opponentId) return null;

  const isHost = [me, opponentId].sort()[0] === me;
  return { opponentId, isHost };
};

export const shouldRequestMatchResync = ({ stage, nowMs, lastStateAtMs }) => {
  if (stage !== 'playing' && stage !== 'final') return false;
  const now = Number(nowMs || 0);
  const last = Number(lastStateAtMs || 0);
  if (!now || !last) return true;
  return now - last >= 4500;
};

export const hostResyncResponse = ({ event, payload, matchId, state }) => {
  if (event !== 'sync-request') return null;
  const p = payload || {};
  if (String(p.matchId || '') !== String(matchId || '')) return null;
  if (!state) return null;
  return { event: 'state', payload: state };
};

export const shouldAcceptIncomingState = ({ currentState, incomingState }) => {
  const next = incomingState || null;
  if (!next) return false;
  if (!next.matchId) return false;
  const cur = currentState || null;
  if (!cur) return true;
  if (String(cur.matchId || '') !== String(next.matchId || '')) return false;
  const curRev = Number(cur.rev || 0);
  const nextRev = Number(next.rev || 0);
  return nextRev >= curRev;
};

export const nextStateWithRev = ({ prevState, nextState, nowMs }) => {
  const prevRev = Number(prevState?.rev || 0);
  const nextRev = prevRev + 1;
  const at = Number(nowMs || Date.now());
  return { ...nextState, rev: nextRev, updatedAtMs: at };
};

export const updateRttEstimate = ({ prevMs, sampleMs, alpha }) => {
  const a = typeof alpha === 'number' ? Math.min(1, Math.max(0, alpha)) : 0.25;
  const sample = Math.min(5000, Math.max(0, Number(sampleMs || 0)));
  const prev = Number(prevMs || 0);
  if (!prev) return Math.round(sample);
  const next = prev + (sample - prev) * a;
  return Math.round(next);
};
