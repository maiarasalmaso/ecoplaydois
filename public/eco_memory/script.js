const EMOJIS = ['☀️','☀️','🌬️','🌬️','💧','💧','🌊','🌊','🌱','🌱','⚡','⚡','🌍','🌍','♻️','♻️','🔋','🔋','🌿','🌿','💣','💣','💣','💣'];
const KB = [
  {q:"O que a energia solar utiliza?", a:["Luz do Sol","Vento","Calor"], c:0},
  {q:"Fonte da energia eólica:", a:["Vento","Água","Sol"], c:0},
  {q:"Biomassa usa:", a:["Matéria orgânica","Plástico","Metal"], c:0},
  {q:"Hidrelétrica gera energia via:", a:["Água","Fogo","Ar"], c:0},
  {q:"Geotérmica vem de:", a:["Calor da Terra","Maré","Chuva"], c:0}
];

let state = { cards: [], flipped: [], score: 100, turns: 0, lock: false, matches: 0, muted: false };
const els = { board: document.getElementById('game-board'), score: document.getElementById('score'), turns: document.getElementById('turns'), modal: { ov: document.getElementById('modal-overlay'), ti: document.getElementById('modal-title'), msg: document.getElementById('modal-msg'), act: document.getElementById('modal-actions') } };

const playSound = (type) => {
  if(state.muted) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.connect(ctx.destination);
    osc.frequency.value = type==='win'?600 : type==='err'?150 : 400;
    osc.type = type==='err'?'sawtooth':'sine';
    osc.start(); setTimeout(()=>osc.stop(), 100);
  } catch {
    return;
  }
};

const shuffle = arr => {
  for(let i=arr.length-1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
};

const init = () => {
  state = { ...state, cards: shuffle([...EMOJIS]).map((v,i)=>({id:i, val:v, flip:false, match:false})), flipped: [], score: 100, turns: 0, matches: 0, lock: false };
  render();
};

const render = () => {
  els.score.textContent = `Pontos: ${state.score}`;
  els.turns.textContent = `Turnos: ${state.turns}/60`;
  els.board.innerHTML = '';
  state.cards.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = `card ${c.flip ? 'flipped' : ''} ${c.match ? 'matched' : ''}`;
    el.innerHTML = `<div class="face front">🌱</div><div class="face back">${c.val}</div>`;
    el.onclick = () => clickCard(i);
    els.board.appendChild(el);
  });
};

const clickCard = (i) => {
  if(state.lock || state.cards[i].flip || state.cards[i].match || state.turns>=60) return;
  playSound('flip');
  state.cards[i].flip = true;
  state.flipped.push(i);
  render();
  
  if(state.flipped.length === 2) {
    state.lock = true;
    state.turns++;
    if(state.turns >= 60) endGame(false);
    checkMatch();
  }
};

const checkMatch = () => {
  const [i1, i2] = state.flipped;
  const c1 = state.cards[i1], c2 = state.cards[i2];
  const isBomb = c => c.val === '💣';
  
  if(c1.val === c2.val && !isBomb(c1)) {
    state.score += 10; state.matches++;
    playSound('match');
    setTimeout(() => {
      state.cards[i1].match = state.cards[i2].match = true;
      resetTurn();
      if(state.matches === 10) endGame(true);
    }, 1000);
  } else if (isBomb(c1) && isBomb(c2)) {
    state.score = 0;
    playSound('err');
    shake([i1, i2]);
    setTimeout(() => showQuiz(50, true, "💥 CAOS TOTAL!"), 1000);
  } else if (isBomb(c1) || isBomb(c2)) {
    state.score -= 10;
    playSound('err');
    shake([i1, i2]);
    setTimeout(() => showQuiz(5, true, "⚠️ POLUIÇÃO!"), 1000);
  } else {
    setTimeout(resetTurn, 1000);
  }
};

const shake = (ids) => {
  ids.forEach(id => els.board.children[id].classList.add('shake'));
};

const resetTurn = () => {
  state.flipped.forEach(i => state.cards[i].flip = false);
  state.flipped = [];
  state.lock = false;
  render();
};

const showQuiz = (reward, reshuffleReq, title) => {
  const q = KB[Math.floor(Math.random()*KB.length)];
  els.modal.ti.textContent = title;
  els.modal.msg.textContent = q.q;
  els.modal.act.innerHTML = '';
  q.a.forEach((ans, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.textContent = ans;
    btn.onclick = () => {
      if(idx === q.c) state.score += reward;
      else state.score -= 5;
      els.modal.ov.classList.add('hidden');
      if(reshuffleReq) doReshuffle();
      else resetTurn();
    };
    els.modal.act.appendChild(btn);
  });
  els.modal.ov.classList.remove('hidden');
};

const doReshuffle = () => {
  const unmatched = state.cards.filter(c => !c.match);
  const vals = shuffle(unmatched.map(c => c.val));
  unmatched.forEach((c, i) => { c.val = vals[i]; c.flip = false; });
  state.flipped = [];
  state.lock = false;
  render();
};

const endGame = (win) => {
  els.modal.ti.textContent = win ? "VITÓRIA!" : "FIM DE JOGO";
  els.modal.msg.textContent = win ? `Score: ${state.score}` : "Energia Esgotada!";
  els.modal.act.innerHTML = `<button onclick="init(); els.modal.ov.classList.add('hidden')">Reiniciar</button>`;
  els.modal.ov.classList.remove('hidden');
  if(win) playSound('win');
};

document.getElementById('mute-btn').onclick = (e) => {
  state.muted = !state.muted;
  e.target.textContent = state.muted ? '🔇' : '🔊';
};

init();
