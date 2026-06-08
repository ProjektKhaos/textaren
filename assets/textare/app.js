/**
 * Hasses Textare - lokal textningsapp.
 * Media hanteras med object URLs i webbläsaren och laddas inte upp.
 */

const state = {
  lines: [],
  curIdx: -1,
  fileBase: 'export',
  mediaType: null,
  exportReady: false,
  lastStampedIndex: -1,
  filledMissingCount: 0,
};

const els = {
  mediaInput: document.getElementById('mediaInput'),
  audioPlayer: document.getElementById('audioPlayer'),
  videoPlayer: document.getElementById('videoPlayer'),
  noMedia: document.getElementById('noMedia'),
  txt: document.getElementById('txt'),
  prep: document.getElementById('prep'),
  clear: document.getElementById('clear'),
  start: document.getElementById('start'),
  stamp: document.getElementById('stamp'),
  undo: document.getElementById('undo'),
  finish: document.getElementById('finish'),
  nudgeLeft: document.getElementById('nudgeLeft'),
  nudgeRight: document.getElementById('nudgeRight'),
  list: document.getElementById('list'),
  idx: document.getElementById('idx'),
  doneCount: document.getElementById('doneCount'),
  cur: document.getElementById('cur'),
  bar: document.getElementById('bar'),
  status: document.getElementById('status'),
  exportSummary: document.getElementById('exportSummary'),
  dlSRT: document.getElementById('dlSRT'),
};

if (!els.mediaInput || !els.txt || !els.list) {
  console.warn('Textare: DOM saknas, script avbryts.');
} else {
  initTextare();
}

function initTextare() {
  updateUiState();
  renderList();

  els.mediaInput.addEventListener('change', handleMediaChange);
  els.audioPlayer.addEventListener('timeupdate', onTimeUpdate);
  els.videoPlayer.addEventListener('timeupdate', onTimeUpdate);

  els.prep.addEventListener('click', prepareLines);
  els.clear.addEventListener('click', clearAll);
  els.start.addEventListener('click', startPlayback);
  els.stamp.addEventListener('click', stampCurrentLine);
  els.undo.addEventListener('click', undoStamp);
  els.nudgeLeft.addEventListener('click', () => nudgeLastStamp(-0.1));
  els.nudgeRight.addEventListener('click', () => nudgeLastStamp(0.1));
  els.finish.addEventListener('click', finishExport);
  els.dlSRT.addEventListener('click', downloadSrt);

  document.addEventListener('keydown', handleKeyboard);
}

const pad = (n, z = 2) => String(n).padStart(z, '0');

function fmtTime(t) {
  if (typeof t !== 'number' || Number.isNaN(t)) return '0:00.00';
  const safe = Math.max(0, t);
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  const centiseconds = Math.round((safe - Math.floor(safe)) * 100);
  return `${minutes}:${pad(seconds)}.${pad(centiseconds)}`;
}

function fmtSrt(t) {
  if (typeof t !== 'number' || Number.isNaN(t)) return '00:00:00,000';
  const safe = Math.max(0, t);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = Math.floor(safe % 60);
  const milliseconds = Math.round((safe - Math.floor(safe)) * 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

function getActivePlayer() {
  if (state.mediaType === 'video') return els.videoPlayer;
  if (state.mediaType === 'audio') return els.audioPlayer;
  return null;
}

function setStatus(message, type = 'info') {
  els.status.textContent = message;
  els.status.dataset.status = type;
}

function handleMediaChange(event) {
  const file = event.target.files?.[0];

  els.audioPlayer.pause();
  els.videoPlayer.pause();
  els.audioPlayer.removeAttribute('src');
  els.videoPlayer.removeAttribute('src');
  els.audioPlayer.hidden = true;
  els.videoPlayer.hidden = true;
  els.noMedia.hidden = false;

  if (!file) {
    state.mediaType = null;
    state.fileBase = 'export';
    setStatus('Ingen mediafil vald.', 'warning');
    updateUiState();
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  state.fileBase = (file.name || 'export').replace(/\.[^.]+$/, '') || 'export';

  if (file.type.startsWith('video/')) {
    state.mediaType = 'video';
    els.videoPlayer.src = objectUrl;
    els.videoPlayer.hidden = false;
  } else {
    state.mediaType = 'audio';
    els.audioPlayer.src = objectUrl;
    els.audioPlayer.hidden = false;
  }

  els.noMedia.hidden = true;
  setStatus(`Media vald: ${file.name}. Klistra in texten som ska tidsättas.`, 'success');
  updateUiState();
}

function onTimeUpdate() {
  const player = getActivePlayer();
  if (!player) return;

  const currentTime = player.currentTime || 0;
  const duration = player.duration || 0;
  els.cur.textContent = fmtTime(currentTime);
  els.bar.style.width = duration > 0 ? `${Math.min(100, (100 * currentTime) / duration)}%` : '0%';
}

function prepareLines() {
  const rawLines = els.txt.value.replace(/\r/g, '').split('\n');
  state.lines = rawLines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => ({ text: line, t: null }));

  state.curIdx = state.lines.length ? 0 : -1;
  state.exportReady = false;
  state.lastStampedIndex = -1;
  state.filledMissingCount = 0;

  renderList();

  if (!state.lines.length) {
    setStatus('Klistra in text innan du förbereder rader.', 'warning');
  } else if (!getActivePlayer()) {
    setStatus('Raderna är förberedda. Välj media för att tidsätta.', 'info');
  } else {
    setStatus('Raderna är förberedda. Starta uppspelningen och använd Space.', 'success');
  }

  updateUiState();
}

function clearAll() {
  state.lines = [];
  state.curIdx = -1;
  state.exportReady = false;
  state.lastStampedIndex = -1;
  state.filledMissingCount = 0;
  els.txt.value = '';
  renderList();
  setStatus('Text och tider är rensade.', 'info');
  updateUiState();
}

function startPlayback() {
  const player = getActivePlayer();
  if (!player) {
    setStatus('Välj ljud- eller videofil först.', 'warning');
    return;
  }

  player.play()
    .then(() => setStatus('Uppspelning startad. Tryck Space när aktuell rad börjar.', 'info'))
    .catch(() => setStatus('Kunde inte starta uppspelningen. Kontrollera vald mediafil.', 'error'));
}

function canStamp() {
  return Boolean(getActivePlayer() && state.lines.length && state.curIdx >= 0 && state.curIdx < state.lines.length);
}

function stampCurrentLine() {
  const player = getActivePlayer();

  if (!player) {
    setStatus('Välj media innan du tidsätter.', 'warning');
    return;
  }

  if (!state.lines.length) {
    setStatus('Förbered textrader innan du tidsätter.', 'warning');
    return;
  }

  if (!canStamp()) {
    setStatus('Alla rader är tidsatta. Kontrollera tiderna och förbered export.', 'success');
    return;
  }

  state.lines[state.curIdx].t = player.currentTime || 0;
  state.lastStampedIndex = state.curIdx;
  state.exportReady = false;

  const stampedNumber = state.curIdx + 1;
  state.curIdx += 1;
  if (state.curIdx >= state.lines.length) {
    state.curIdx = state.lines.length;
  }

  renderList();
  if (state.curIdx >= state.lines.length) {
    setStatus('Alla rader är tidsatta. Kontrollera tiderna och förbered export.', 'success');
  } else {
    setStatus(`Rad ${stampedNumber} av ${state.lines.length} tidsatt.`, 'success');
  }
  updateUiState();
}

function undoStamp() {
  if (!state.lines.length) {
    setStatus('Det finns inga rader att ångra.', 'warning');
    return;
  }

  if (state.curIdx >= state.lines.length) {
    state.curIdx = state.lines.length - 1;
  } else if (state.lines[state.curIdx]?.t === null && state.curIdx > 0) {
    state.curIdx -= 1;
  }

  if (state.lines[state.curIdx]) {
    state.lines[state.curIdx].t = null;
    state.lastStampedIndex = findLastStampedIndex();
    state.exportReady = false;
    renderList();
    setStatus(`Tiden för rad ${state.curIdx + 1} är borttagen.`, 'info');
    updateUiState();
  }
}

function nudgeLastStamp(delta) {
  const index = state.lastStampedIndex >= 0 ? state.lastStampedIndex : findLastStampedIndex();

  if (index < 0) {
    setStatus('Ingen tidsatt rad finns att justera.', 'warning');
    return;
  }

  state.lines[index].t = Math.max(0, (state.lines[index].t || 0) + delta);
  state.lastStampedIndex = index;
  state.exportReady = false;
  renderList();
  setStatus(`Rad ${index + 1} justerad till ${fmtTime(state.lines[index].t)}.`, 'info');
  updateUiState();
}

function findLastStampedIndex() {
  for (let i = state.lines.length - 1; i >= 0; i -= 1) {
    if (state.lines[i].t !== null) return i;
  }
  return -1;
}

function fillMissing() {
  const player = getActivePlayer();
  const duration = player ? player.duration || 0 : 0;
  let filled = 0;

  for (let i = 0; i < state.lines.length; i += 1) {
    if (state.lines[i].t !== null) continue;

    filled += 1;
    const previous = state.lines[i - 1]?.t ?? 0;
    const nextLine = state.lines.slice(i + 1).find((line) => line.t !== null);
    const next = nextLine ? nextLine.t : duration || previous + 10;
    const guess = Math.min(next - 0.01, previous + 2.0);
    state.lines[i].t = Math.max(0, guess);
  }

  state.lines.sort((a, b) => (a.t || 0) - (b.t || 0));
  state.curIdx = state.lines.length;
  state.lastStampedIndex = findLastStampedIndex();
  state.filledMissingCount = filled;
  state.exportReady = true;
}

function finishExport() {
  if (!state.lines.length) {
    setStatus('Det finns inga rader att exportera.', 'warning');
    updateUiState();
    return;
  }

  fillMissing();
  renderList();
  setStatus('SRT-export redo.', 'success');
  updateUiState();
}

function downloadSrt() {
  if (!state.exportReady) {
    setStatus('Förbered SRT-export först.', 'warning');
    return;
  }

  const items = state.lines.map((line, index) => {
    const start = line.t || 0;
    let end = start + 3.0;
    const next = state.lines[index + 1]?.t;

    if (next && next > start) {
      end = Math.max(next - 0.01, start + 0.1);
    }

    return `${index + 1}\n${fmtSrt(start)} --> ${fmtSrt(end)}\n${line.text}\n`;
  });

  download(`${state.fileBase}.srt`, items.join('\n'));
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

function handleKeyboard(event) {
  const tagName = event.target.tagName;
  if (tagName === 'TEXTAREA' || tagName === 'INPUT' || event.target.isContentEditable) return;

  if (event.code === 'Space') {
    event.preventDefault();
    stampCurrentLine();
  } else if (event.code === 'Backspace') {
    event.preventDefault();
    undoStamp();
  } else if (event.code === 'ArrowLeft') {
    event.preventDefault();
    nudgeLastStamp(-0.1);
  } else if (event.code === 'ArrowRight') {
    event.preventDefault();
    nudgeLastStamp(0.1);
  }
}

function renderList() {
  els.list.replaceChildren();

  if (!state.lines.length) {
    const empty = document.createElement('div');
    empty.className = 'lyrics-empty';
    empty.textContent = 'Förbered textraderna för att börja.';
    els.list.appendChild(empty);
    updateCounters();
    return;
  }

  state.lines.forEach((line, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'line';
    if (index === state.curIdx) item.classList.add('current');
    if (line.t !== null) item.classList.add('done');

    const time = document.createElement('span');
    time.className = 'mini mono line-time';
    time.textContent = line.t !== null ? `[${fmtTime(line.t)}]` : '[ --:--.-- ]';

    const text = document.createElement('span');
    text.className = 'line-text';
    text.textContent = line.text;

    item.append(time, text);
    item.addEventListener('click', () => {
      if (line.t === null) {
        state.curIdx = index;
        renderList();
        setStatus(`Rad ${index + 1} vald för tidsättning.`, 'info');
        updateUiState();
        return;
      }

      const player = getActivePlayer();
      if (player) {
        player.currentTime = line.t;
        setStatus(`Hoppade till rad ${index + 1}: ${fmtTime(line.t)}.`, 'info');
      } else {
        setStatus('Välj media för att kunna hoppa till tidsatta rader.', 'warning');
      }
    });

    els.list.appendChild(item);
  });

  const active = els.list.children[state.curIdx];
  if (active) active.scrollIntoView({ behavior: 'smooth', block: 'center' });
  updateCounters();
}

function updateCounters() {
  const total = state.lines.length;
  const done = state.lines.filter((line) => line.t !== null).length;

  if (!total) {
    els.idx.textContent = '-';
  } else if (state.curIdx >= total) {
    els.idx.textContent = `klar / ${total}`;
  } else {
    els.idx.textContent = `${state.curIdx + 1} / ${total}`;
  }

  els.doneCount.textContent = `${done} / ${total}`;
}

function updateUiState() {
  const hasMedia = Boolean(getActivePlayer());
  const hasLines = state.lines.length > 0;
  const hasStampedLine = state.lines.some((line) => line.t !== null);

  els.start.disabled = !hasMedia;
  els.stamp.disabled = !hasMedia || !hasLines || state.curIdx >= state.lines.length;
  els.undo.disabled = !hasLines || !hasStampedLine;
  els.nudgeLeft.disabled = !hasStampedLine;
  els.nudgeRight.disabled = !hasStampedLine;
  els.finish.disabled = !hasLines;
  els.dlSRT.disabled = !state.exportReady;

  updateCounters();

  if (!hasLines) {
    els.exportSummary.textContent = 'Förbered export när tiderna är klara.';
  } else if (state.exportReady) {
    els.exportSummary.textContent = 'SRT-export redo.';
  } else {
    els.exportSummary.textContent = 'Förbered export när tiderna är klara.';
  }
}
