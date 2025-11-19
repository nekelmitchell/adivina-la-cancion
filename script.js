document.addEventListener('DOMContentLoaded', ()=>{

/* ----------------------------
   Data: Replace file paths/titles with real ones
   ---------------------------- */
const SONGS = [
  { id: 's1', file: 'songuno.mp3', title: 'Tití Me Preguntó', artist: 'Bad Bunny', backgroundImage: 'guesspage1.jpg' },
  { id: 's2', file: 'songdos.mp3', title: 'Como La Flor', artist: 'Selena', backgroundImage: 'guesspage2.jpg' },
  { id: 's3', file: 'songtres.mp3', title: 'Chantaje', artist: 'Shakira', backgroundImage: 'guesspage1.jpg' },
  { id: 's4', file: 'songcuatro.mp3', title: 'Corazón Sin Cara', artist: 'Prince Royce', backgroundImage: 'guesspage2.jpg' },
  { id: 's5', file: 'songcinco.mp3', title: 'Bailando', artist: 'Enrique Iglesias', backgroundImage: 'guesspage1.jpg' },
  { id: 's6', file: 'songseis.mp3', title: 'Propuesta Indecente', artist: 'Romeo Santos', backgroundImage: 'guesspage2.jpg' },
  { id: 's7', file: 'songsiete.mp3', title: 'X Si Volvemos', artist: 'Karol G & Romeo Santos', backgroundImage: 'guesspage1.jpg' },
  { id: 's8', file: 'songocho.mp3', title: 'Ella Quiere Beber', artist: 'Anuel AA & Romeo Santos', backgroundImage: 'guesspage2.jpg' },
  { id: 's9', file: 'songnueve.mp3', title: 'Muchacha', artist: 'Becky G & Gente De Zona', backgroundImage: 'guesspage1.jpg' },
  { id: 's10', file: 'songdiez.mp3', title: 'Nuevayol', artist: 'Bad Bunny', backgroundImage: 'guesspage2.jpg' }
];

/* ---------- GAME STATE ---------- */
let state = {
  score: 0,
  queue: [],          // array of song objects (5 items)
  currentIndex: 0,    // index in queue (0..4)
  attempt: 1,         // 1..3 (which attempt user is on for current song)
  totalSongsToPlay: 5,
  countdownPlaying: false,
  countdownTimeouts: [],
  segmentTimeout: null,
  nextSongTimeout: null
};

/* ---------- ELEMENTS ---------- */
const pageHeader = document.getElementById('pageHeader');
const homeScreen = document.getElementById('homeScreen');
const startBtn = document.getElementById('startBtn');

const chooseScreen = document.getElementById('chooseScreen');
const songsGrid = document.getElementById('songsGrid');
const chooserPreview = document.getElementById('chooserPreview');

const guessScreen = document.getElementById('guessScreen');
const guessBg = document.getElementById('guessBg');
const currentTitle = document.getElementById('currentTitle');
const playSongBtn = document.getElementById('playSongBtn');
const countdownDiv = document.getElementById('countdown');
const lyricsBox = document.getElementById('lyricsBox');
const lyricDisplay = document.getElementById('lyricDisplay');
const questionArea = document.getElementById('questionArea');
const guessInput = document.getElementById('guessInput');
const guessSubmit = document.getElementById('guessSubmit');
const messageArea = document.getElementById('messageArea');
const triesLeftSpan = document.getElementById('triesLeft');
const audioPlayer = document.getElementById('audioPlayer');
const replayBtn = document.getElementById('replayBtn');

const finalScreen = document.getElementById('finalScreen');
const finalTitle = document.getElementById('finalTitle');
const finalMessage = document.getElementById('finalMessage');
const playAgainBtn = document.getElementById('playAgainBtn');

const scoreEl = document.getElementById('score');
const songIndexEl = document.getElementById('songIndex');

/* ---------- Initialization ---------- */
function initChooser(){
  songsGrid.innerHTML = '';
  SONGS.forEach((s, idx)=>{
    const btn = document.createElement('button');
    btn.className = 'song-btn';
    btn.innerHTML = `<div class="song-title">${s.title}</div><div class="song-artist">${s.artist}</div>`;
    btn.onclick = ()=> onSongChosen(s);
    btn.onmouseover = ()=> chooserPreview.style.backgroundImage = `url('${s.backgroundImage || 'startpage.jpg'}')`;
    btn.onmouseleave = ()=> chooserPreview.style.backgroundImage = `url('startpage.jpg')`;
    songsGrid.appendChild(btn);
  });
}
initChooser();
updateScoreboard();

/* ---------- UI SWITCHERS ---------- */
startBtn.addEventListener('click', ()=> showChooseScreen());
playAgainBtn.addEventListener('click', restartGame);

function showChooseScreen(){
  homeScreen.style.display='none';
  chooseScreen.style.display='flex';
  guessScreen.style.display='none';
  finalScreen.style.display='none';
  pageHeader.textContent = 'Elige una Canción';
}

function showGuessScreen(){
  homeScreen.style.display='none';
  chooseScreen.style.display='none';
  guessScreen.style.display='block';
  finalScreen.style.display='none';
  updateScoreboard();
}

function showFinalScreen(){
  homeScreen.style.display='none';
  chooseScreen.style.display='none';
  guessScreen.style.display='none';
  finalScreen.style.display='flex';
  pageHeader.textContent = 'Resultados';
}

/* ---------- Build queue when user picks a song ---------- */
function onSongChosen(selectedSong){
  // build queue: chosen + 4 random other distinct songs
  const others = SONGS.filter(s=> s.id !== selectedSong.id);
  shuffleArray(others);
  const queue = [selectedSong, ...others.slice(0, state.totalSongsToPlay - 1)];
  state.queue = queue;
  state.currentIndex = 0;
  state.score = 0;
  state.attempt = 1;
  clearTimers();
  pageHeader.textContent = 'Listo Para Jugar';
  updateScoreboard();
  showNextSongIntro();
}

function showNextSongIntro(){
  showGuessScreen();
  const song = state.queue[state.currentIndex];
  if(!song) return;
  currentTitle.textContent = `Canción ${state.currentIndex+1} — ???`;
  const bgUrl = song.backgroundImage || 'guesspage1.jpg';
  guessBg.style.backgroundImage = `url('${bgUrl}')`;
  lyricDisplay.textContent = 'Pulsa Reproducir para escuchar el fragmento.';
  questionArea.style.display = 'block';
  guessInput.value = '';
  messageArea.textContent = '';
  state.attempt = 1;
  triesLeftSpan.textContent = 3;
  songIndexEl.textContent = `${state.currentIndex+1}/${state.queue.length}`;
  audioPlayer.src = song.file;
  audioPlayer.load();
  playSongBtn.style.display='inline-block';
}

/* ---------- Play / Countdown ---------- */
playSongBtn.addEventListener('click', startCountdownAndPlay);

function startCountdownAndPlay(){
  if(state.countdownPlaying) return;
  state.countdownPlaying = true;
  playSongBtn.style.display='none';
  countdownDiv.style.display='block';
  // optionally set images; keep simple numeric countdown using text background fallback
  countdownDiv.style.backgroundImage = `url('number3.png')`;
  // clear previous
  state.countdownTimeouts.forEach(t=>clearTimeout(t));
  state.countdownTimeouts = [];

  const t1 = setTimeout(()=> countdownDiv.style.backgroundImage = `url('number2.png')`, 1000);
  const t2 = setTimeout(()=> countdownDiv.style.backgroundImage = `url('number1.png')`, 2000);
  const t3 = setTimeout(()=> {
    countdownDiv.style.display='none';
    state.countdownPlaying = false;
    startSongPlayback(); // begins attempt 1
  }, 3000);

  state.countdownTimeouts.push(t1,t2,t3);
}

/* ---------- Song playback by segment ---------- */
const SEGMENTS = [15, 25, 35]; // seconds per attempt: attempt1->5s, attempt2->10s, attempt3->15s

function startSongPlayback(){
  // start first segment for current attempt (attempt is already 1 on entry)
  playSegment(state.attempt);
}

function playSegment(attempt){
  clearSegmentTimeout();

  const song = state.queue[state.currentIndex];
  if(!song) return;

  // compute start time = sum of previous segments
  const start = SEGMENTS.slice(0, attempt - 1).reduce((a,b)=>a+b, 0);
  const duration = SEGMENTS[attempt - 1];

  // safety: clamp start/duration to audio length if necessary (we will just attempt to play; if duration exceeds, audio will end)
  try {
    audioPlayer.currentTime = start;
  } catch(e){
    // some browsers may throw if currentTime set too large; ignore
  }

  // play
  audioPlayer.play().catch(()=>{ /* autoplay can be blocked if not user gesture; but play was triggered by user click earlier */ });

  // show UI state
  lyricDisplay.textContent = `Reproduciendo clip: ${duration}s (attempt ${attempt})`;
  messageArea.textContent = '';
  triesLeftSpan.textContent = 4 - attempt; // attempts left after this attempt (for display)
  questionArea.style.display = 'block';
  guessInput.focus();

  // schedule pause after duration
  state.segmentTimeout = setTimeout(()=>{
    try{ audioPlayer.pause(); } catch(e){}
    // after the clip stops, allow the user to submit guess (we already show input)
    lyricDisplay.textContent = 'El vídeo ha terminado -- ahora debes adivinar.';
  }, duration * 1000);
}

/* Clear timeouts */
function clearSegmentTimeout(){
  if(state.segmentTimeout) { clearTimeout(state.segmentTimeout); state.segmentTimeout = null; }
}
function clearCountdownTimeouts(){
  state.countdownTimeouts.forEach(t=>clearTimeout(t));
  state.countdownTimeouts = [];
  state.countdownPlaying = false;
}
function clearNextSongTimeout(){
  if(state.nextSongTimeout){ clearTimeout(state.nextSongTimeout); state.nextSongTimeout = null; }
}
function clearTimers(){
  clearSegmentTimeout();
  clearCountdownTimeouts();
  clearNextSongTimeout();
}

/* ---------- Replay button ---------- */
replayBtn.addEventListener('click', ()=>{
  // replay the current attempt's clip
  playSegment(state.attempt);
});

/* ---------- Guess handling ---------- */
guessSubmit.addEventListener('click', checkGuess);
guessInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') checkGuess(); });

function checkGuess(){
  // user may submit answer even if clip still playing; evaluate based on current attempt
  const song = state.queue[state.currentIndex];
  const expected = (song.title || '').trim();
  const user = guessInput.value.trim();
  if(user.length === 0){ messageArea.textContent = 'Por favor escribe algo.'; return; }

  if(normalize(expected) === normalize(user)){
    // correct — award points based on attempt
    let awarded = 0;
    if(state.attempt === 1) awarded = 15;
    else if(state.attempt === 2) awarded = 10;
    else if(state.attempt === 3) awarded = 5;
    state.score += awarded;
    updateScoreboard();
    messageArea.textContent = `¡Correcto/a! +${awarded} agujas`;
    currentTitle.textContent = `${song.title} — ${song.artist}`;
    // stop any clip
    try{ audioPlayer.pause(); } catch(e){}
    clearSegmentTimeout();

    // proceed to next song after showing Next Song + 3s countdown
    startNextSongCountdown();
  } else {
    // wrong guess
    messageArea.textContent = 'Incorrecto/a - intente de nuevo (si los intentos permanecen)';
    // if there are attempts left, increment attempt and play next clip segment after brief pause
    if(state.attempt < 3){
      state.attempt += 1;
      // replay next segment after 800ms so user sees message
      clearSegmentTimeout();
      setTimeout(()=> playSegment(state.attempt), 800);
      triesLeftSpan.textContent = 4 - state.attempt;
    } else {
      // no attempts left -> penalty of -5, reveal title and go to next song
      state.score -= 5;
      updateScoreboard();
      messageArea.textContent = `Sin intentos — canción correcta: "${song.title}" (-5 points)`;
      currentTitle.textContent = `${song.title} — ${song.artist}`;
      try{ audioPlayer.pause(); } catch(e){}
      clearSegmentTimeout();
      // move to next after short pause
      startNextSongCountdown();
    }
  }
}

/* Start a 3s 'Next Song' countdown then move on */
function startNextSongCountdown(){
  // show a quick countdown in lyricDisplay
  let c = 3;
  lyricDisplay.textContent = `Siguiente Canción— ${c}...`;
  clearNextSongTimeout();
  state.nextSongTimeout = setInterval(()=>{
    c--;
    if(c > 0){
      lyricDisplay.textContent = `Siguiente canción — ${c}...`;
    } else {
      clearNextSongTimeout();
      // advance
      onSongFinished();
    }
  }, 1000);
}

/* ---------- Move to next song / end ---------- */
function onSongFinished(){
  clearTimers();
  try{ audioPlayer.pause(); } catch(e){}
  state.currentIndex += 1;
  if(state.currentIndex >= state.queue.length){
    endGame();
  } else {
    // reset attempt for next song and show intro
    state.attempt = 1;
    showNextSongIntro();
  }
}

function endGame(){
  showFinalScreen();
  updateScoreboard();
  const WIN_THRESHOLD = 40; // per your rules
  if(state.score >= WIN_THRESHOLD){
    finalTitle.textContent = '¡Ganaste!';
    finalMessage.textContent = `Tu anotaste ${state.score} — ¡gran trabajo!`;
  } else {
    finalTitle.textContent = '¡Perdiste!';
    finalMessage.textContent = `Tu anotaste ${state.score} — necesitas ${WIN_THRESHOLD - state.score} más para ganar`;
  }
}

/* ---------- Utilities ---------- */
function restartGame(){
  state.score = 0;
  state.queue = [];
  state.currentIndex = 0;
  state.attempt = 1;
  clearTimers();
  try{ audioPlayer.pause(); } catch(e){}
  pageHeader.textContent = '¡Adivina la Canción!';
  homeScreen.style.display='flex';
  chooseScreen.style.display='none';
  guessScreen.style.display='none';
  finalScreen.style.display='none';
  updateScoreboard();
}

function updateScoreboard(){
  scoreEl.textContent = state.score;
  songIndexEl.textContent = `${Math.min(state.currentIndex+1, state.queue.length)}/${state.queue.length || state.totalSongsToPlay}`;
}

function shuffleArray(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function normalize(str){ return (str||'').toLowerCase().replace(/[^\w\s]|_/g,'').replace(/\s+/g,' ').trim(); }

}); 
