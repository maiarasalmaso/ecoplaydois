import { isRemoteDbEnabled, upsertFeedbackResponse } from '../services/remoteDb';

export const FEEDBACK_RESPONSES_KEY = 'ecoplay.feedback.responses';
export const FEEDBACK_BACKUPS_KEY = 'ecoplay.feedback.backups';
export const FEEDBACK_CTA_CLICKS_KEY = 'ecoplay.feedback.cta.clicks';

const readJson = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeJson = (storage, key, value) => {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

const safeString = (value) => String(value ?? '').trim();

const newId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch (e) {
    void e;
  }
  return `fb-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
};

export const listFeedbackResponses = () => {
  const responses = readJson(localStorage, FEEDBACK_RESPONSES_KEY);
  return Array.isArray(responses) ? responses : [];
};

export const recordFeedbackCtaClick = ({ pathname } = {}) => {
  const prev = readJson(localStorage, FEEDBACK_CTA_CLICKS_KEY);
  const next = Array.isArray(prev) ? prev.slice() : [];
  next.push({ at: new Date().toISOString(), pathname: safeString(pathname) || null });
  writeJson(localStorage, FEEDBACK_CTA_CLICKS_KEY, next.slice(-5000));
  return next.length;
};

export const getFeedbackCtaClicks = () => {
  const clicks = readJson(localStorage, FEEDBACK_CTA_CLICKS_KEY);
  return Array.isArray(clicks) ? clicks : [];
};

const writeBackupSnapshot = (responses) => {
  const prev = readJson(localStorage, FEEDBACK_BACKUPS_KEY);
  const backups = Array.isArray(prev) ? prev.slice() : [];
  backups.push({ at: new Date().toISOString(), count: responses.length, responses });
  writeJson(localStorage, FEEDBACK_BACKUPS_KEY, backups.slice(-10));
};

export const saveFeedbackResponse = async (input) => {
  const nowIso = new Date().toISOString();
  const response = {
    id: safeString(input?.id) || newId(),
    createdAt: safeString(input?.createdAt) || nowIso,
    user: input?.user && typeof input.user === 'object' ? input.user : null,
    ux: input?.ux && typeof input.ux === 'object' ? input.ux : {},
    learning: input?.learning && typeof input.learning === 'object' ? input.learning : {},
    score: Number(input?.score || 0),
    level: safeString(input?.level) || 'Semente',
    badges: Array.isArray(input?.badges) ? input.badges : [],
    meta: input?.meta && typeof input.meta === 'object' ? input.meta : {},
  };

  const prev = listFeedbackResponses();
  const next = [response, ...prev].slice(0, 5000);
  writeJson(localStorage, FEEDBACK_RESPONSES_KEY, next);
  writeBackupSnapshot(next);

  if (isRemoteDbEnabled()) {
    try {
      await upsertFeedbackResponse(response);
    } catch (e) {
      void e;
    }
  }

  return response;
};

const mean = (values) => {
  const filtered = (values || []).map((v) => Number(v)).filter((v) => Number.isFinite(v));
  if (!filtered.length) return 0;
  return filtered.reduce((a, b) => a + b, 0) / filtered.length;
};

const distribution = (values) => {
  const out = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  (values || []).forEach((v) => {
    const n = Number(v);
    if (n >= 1 && n <= 5) out[n] += 1;
  });
  return out;
};

export const computeFeedbackSummary = (responses, { uxLikertIds = [], learningLikertIds = [] } = {}) => {
  const safe = Array.isArray(responses) ? responses : [];

  const uxById = Object.fromEntries(uxLikertIds.map((id) => [id, []]));
  const learningById = Object.fromEntries(learningLikertIds.map((id) => [id, []]));

  safe.forEach((r) => {
    uxLikertIds.forEach((id) => {
      uxById[id].push(r?.ux?.[id]);
    });
    learningLikertIds.forEach((id) => {
      learningById[id].push(r?.learning?.[id]);
    });
  });

  const uxAverages = Object.fromEntries(uxLikertIds.map((id) => [id, mean(uxById[id])]));
  const learningAverages = Object.fromEntries(learningLikertIds.map((id) => [id, mean(learningById[id])]));
  const uxOverall = mean(Object.values(uxAverages));
  const learningOverall = mean(Object.values(learningAverages));
  const scores = safe.map((r) => Number(r?.score));
  const scoreAvg = mean(scores);

  const byDay = new Map();
  safe.forEach((r) => {
    const day = safeString(r?.createdAt).slice(0, 10);
    if (!day) return;
    byDay.set(day, (byDay.get(day) || 0) + 1);
  });
  const volumeByDay = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, count]) => ({ day, count }));

  return {
    totalResponses: safe.length,
    uxOverall,
    learningOverall,
    scoreAvg,
    uxAverages,
    learningAverages,
    uxDistributions: Object.fromEntries(uxLikertIds.map((id) => [id, distribution(uxById[id])])),
    learningDistributions: Object.fromEntries(learningLikertIds.map((id) => [id, distribution(learningById[id])])),
    volumeByDay,
  };
};

const csvEscape = (value) => {
  const raw = safeString(value);
  const needs = /[",\n\r]/.test(raw);
  const escaped = raw.replace(/"/g, '""');
  return needs ? `"${escaped}"` : escaped;
};

export const buildFeedbackCsv = (responses) => {
  const rows = Array.isArray(responses) ? responses : [];
  const headers = [
    'id',
    'createdAt',
    'userId',
    'userName',
    'userEmail',
    'userType',
    'score',
    'level',
    'badges',
    'ux',
    'learning',
  ];
  const lines = [headers.join(',')];
  rows.forEach((r) => {
    const u = r?.user || {};
    const line = [
      r?.id,
      r?.createdAt,
      u?.id,
      u?.name,
      u?.email,
      u?.type,
      r?.score,
      r?.level,
      Array.isArray(r?.badges) ? r.badges.join('|') : '',
      JSON.stringify(r?.ux || {}),
      JSON.stringify(r?.learning || {}),
    ].map(csvEscape);
    lines.push(line.join(','));
  });
  return `${lines.join('\n')}\n`;
};

export const downloadTextFile = (filename, content, mime = 'text/plain;charset=utf-8') => {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
};

export const openPrintableReport = ({ title, html }) => {
  try {
    const fullHtml = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${safeString(title)}</title></head><body>${String(
      html ?? ''
    )}</body></html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      URL.revokeObjectURL(url);
      return false;
    }

    const cleanup = () => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        void e;
      }
    };

    win.addEventListener('beforeunload', cleanup, { once: true });
    win.addEventListener(
      'load',
      () => {
        try {
          win.focus();
          win.print();
        } catch (e) {
          void e;
        }
      },
      { once: true }
    );
    return true;
  } catch {
    return false;
  }
};