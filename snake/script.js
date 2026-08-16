/*
TODO:
 - auto adjust cnv size + dot size
 - touch move relative to snake head
 - responsiveness
*/

const Init = {
  sleepTime:   500,
  dirX:        1,
  dirY:        0,
  snakeLen:    3,
  fruitChance: 0.01,
};

const Cnst = {
  sleepTimeDec:   5,
  fruitChanceInc: .005,
};

const Themes = {
  light: 0,
  dark:  1,
  count: 2,
};

const ClrLight = {
  dot:             'silver',
  dotShadow:       'lightblue',
  snakeBody:       'lightcoral',
  snakeBodyShadow: 'darkred',
  snakeHead:       'orangered',
  snakeHeadShadow: 'maroon',
  fruit:           'orange',
  fruitShadow:     'sienna',
  font:            'black',
};
const ClrDark = {
  fruit: 'white',
  font:  'white',
};
const fontLight = '28px Comic Sans MS';
const fontDark  = '36px MS Mincho';

const Elems = {
  cnvCnt:      document.getElementById('canvas-container'),
  cnv:         document.getElementById('canvas'),
  themeLink:   document.getElementById('theme-link'),
  themeSwitch: document.getElementById('theme-switch'),
  scoreSpan:   document.getElementById('score'),
  optsForm:    document.getElementById('opts'),

  info:            document.getElementById('info'),
  infoDotsY:       document.getElementById('info-dots-y'),
  infoDotSize:     document.getElementById('info-dot-size'),
  infoInputKey:    document.getElementById('info-input-key'),
  infoSleepTime:   document.getElementById('info-sleep-time'),
  infoFruitCount:  document.getElementById('info-fruit-count'),
  infoFruitChance: document.getElementById('info-fruit-chance'),
};
const ctx = Elems.cnv.getContext('2d');
const inputPairs = new Map();

const Opts = {
  dotsX:        0,
  canvasWidth:  Elems.cnv.width,
  canvasHeight: Elems.cnv.height,
  otGradient:  false,
};

const Sys = {
  infoShown: false,
  dotsY:     0,
  dotSize:   0,
  dotHalf:   0,
  dotQrt:    0,
  theme:     (Elems.themeSwitch.checked) ? Themes.dark : Themes.light,
};

const St = {
  inputKey:  '',
  sleepTime: Init.sleepTime,
  score:     0,
  text:      'PRESS ANY KEY',
}

const Snake = {
  x:    [],
  y:    [],
  dirX: Init.dirX,
  dirY: Init.dirY,
};

const Fruit = {
  x:      [],
  y:      [],
  chance: Init.fruitChance,
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function onClick(evt) {
  const dT = evt.offsetY;
  const dL = evt.offsetX;
  const dB = Elems.cnvCnt.offsetHeight - dT;
  const dR = Elems.cnvCnt.offsetWidth  - dL;
  switch(Math.min(dT, dL, dB, dR)) {
  case dT: St.inputKey = 'ArrowUp'; break;
  case dL: St.inputKey = 'ArrowLeft'; break;
  case dB: St.inputKey = 'ArrowDown'; break;
  case dR: St.inputKey = 'ArrowRight'; break;
  }
}

function hslToHex(h, s, l) {
  l *= .01;
  const a = s * Math.min(l, 1 - l) * .01;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    // convert to Hex and prefix '0' if needed
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function waitInput() {
  return new Promise(resolve => {
    function onKeyHandler(evt) {
      resolve(evt);
    }
    function onClickHandler(evt) {
      resolve(evt);
    }
    document.addEventListener('keydown', onKeyHandler, { once: true });
    Elems.cnvCnt.addEventListener('click', onKeyHandler, { once: true });
  })
}

function switchTheme(evt) {
  Sys.theme = (Sys.theme += 1) % Themes.count;
  if (Elems.themeLink.getAttribute('href') === 'theme-light.css') {
    Elems.themeLink.setAttribute('href', 'theme-dark.css')
  } else {
    Elems.themeLink.setAttribute('href', 'theme-light.css')
  }
  draw();
}

function updateInfo() {
  if (!Sys.infoShown) return;
  Elems.infoDotsY.textContent = Sys.dotsY;
  Elems.infoDotSize.textContent = Sys.dotSize;
  Elems.infoInputKey.textContent = St.inputKey;
  Elems.infoSleepTime.textContent = St.sleepTime;
  Elems.infoFruitCount.textContent = Fruit.x.length;
  Elems.infoFruitChance.textContent = +Fruit.chance * 100
}

function updateSys() {
  const data = new FormData(Elems.optsForm);

  Opts.dotGradient = document.getElementById('dot-gradient').checked;

  const oldCanvasWidth = Elems.cnv.width;
  const newCanvasWidth = parseInt(data.get('canvas-width-number'));
  const newCanvasHeight = parseInt(data.get('canvas-height-number'));

  Elems.cnv.width = newCanvasWidth;
  Elems.cnv.height = newCanvasHeight;

  if (oldCanvasWidth !== newCanvasWidth) {
    Opts.dotsXNumber = document.getElementById('dots-x-number');
    Opts.dotsXSlider = document.getElementById('dots-x-slider');

    Opts.dotsXNumber.max = Elems.cnv.width;
    Opts.dotsXSlider.max = Elems.cnv.width;

    if (+Opts.dotsXNumber.max < +Opts.dotsXNumber.value) {
      Opts.dotsXNumber.value = Elems.cnv.width;
      Opts.dotsXSlider.value = Elems.cnv.width;
    }
  }

  const oldDotsX = Opts.dotsX;
  const oldDotsY = Sys.dotsY;
  const newDotsX = data.get('dots-x-number');

  if (newDotsX === oldDotsX) return;

  Sys.dotSize = Math.trunc(Elems.cnv.width / newDotsX);
  Opts.dotsX = Math.trunc(Elems.cnv.width / Sys.dotSize);
  document.getElementById('dots-x-number').value = Opts.dotsX;
  document.getElementById('dots-x-slider').value = Opts.dotsX;
  Sys.dotsY   = Math.trunc(Elems.cnv.height / Sys.dotSize);
  Sys.dotHalf = Sys.dotSize * .5;
  Sys.dotQrt = Sys.dotHalf * .5;

  if (oldDotsX === 0/* || oldDotsX < newDotsX*/) return;

  let oldSnakeX = Snake.x[0];
  let oldSnakeY = Snake.y[0];
  let fracX = Snake.x[0] / oldDotsX;
  let fracY = Snake.y[0] / oldDotsY;
  Snake.x[0] = Math.trunc(fracX * Opts.dotsX);
  Snake.y[0] = Math.trunc(fracY * Sys.dotsY);
  for (let i = 1; i < Snake.x.length; i++) {
    let offsetX = Snake.x[i] - oldSnakeX;
    let offsetY = Snake.y[i] - oldSnakeY;
    Snake.x[i] = Snake.x[0] + offsetX;
    Snake.y[i] = Snake.y[0] + offsetY;
  }
  for (let j = 0; j < Fruit.x.length; j++) {
    let fracX = Fruit.x[j] / oldDotsX;
    let fracY = Fruit.y[j] / oldDotsY;
    Fruit.x[j] = Math.trunc(fracX * Opts.dotsX);
    Fruit.y[j] = Math.trunc(fracY * Sys.dotsY);
  }
}

function changeOpts(evt) {
  const data = new FormData(Elems.optsForm);
  const name = evt.srcElement.name;
  let value = 0;
  let pair = inputPairs.get(name);
  if (pair !== undefined) {
    value = data.get(name);
    document.getElementById(pair).value = value;
  } else {
    value = data.get('dot-gradient');
  }
  if (value !== 0) {
    updateSys();
    draw();
  }
}

function dotGradient(x, y, startColor, endColor) {
  if (Sys.dotSize < 3) return startColor;
  const grd =ctx.createRadialGradient(
    Sys.dotQrt + x*Sys.dotSize,
    Sys.dotQrt + y*Sys.dotSize,
    Sys.dotQrt,
    x*Sys.dotSize,
    y*Sys.dotSize,
    Sys.dotSize
  );
  grd.addColorStop(0, startColor);
  grd.addColorStop(1, endColor);
  return grd;
}

function drawDot(x, y, fillStyle) {
 ctx.fillStyle = fillStyle;
  if (3 <= Sys.dotSize) {
   ctx.beginPath();
   ctx.arc(
    Sys.dotHalf + x*Sys.dotSize,
    Sys.dotHalf + y*Sys.dotSize,
    Sys.dotHalf,
    0,
    2*Math.PI
  );
   ctx.fill();
  } else {
   ctx.fillRect(x*Sys.dotSize, y*Sys.dotSize, Sys.dotSize, Sys.dotSize);
  }
}

function drawTextCentered(txt) {
  const color = (Sys.theme === Themes.light)? ClrLight.font : ClrDark.font;
 ctx.font = (Sys.theme === Themes.light) ? fontLight : fontDark;
  const m =ctx.measureText(txt);
  //let h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;

  x = (Elems.cnv.width - m.width) * .5;
  y = (Elems.cnv.height/* - h*/) * .5;

 ctx.fillStyle = color;
 ctx.fillText(txt, x, y);
}

function drawText() {
  drawTextCentered(text);
}

function drawBG() {
 ctx.clearRect(0, 0, Elems.cnv.width, Elems.cnv.height);
  if (Sys.theme === Themes.dark) return;
  if (3 <= Sys.dotSize) {
    for (let x = 0; x < Opts.dotsX; x++) {
      for (let y = 0; y < Sys.dotsY; y++) {
        let style = (Opts.dotGradient) ?
          dotGradient(x, y, ClrLight.dotShadow, ClrLight.dot) :
          ClrLight.dot;
        drawDot(x, y, style);
      }
    }
  } else {
   ctx.fillStyle = ClrLight.dot;
   ctx.fillRect(0, 0, Elems.cnv.width, Elems.cnv.height);
  }
}

function drawSnake() {
  let style = '#000000';
  if (Sys.theme === Themes.light) {
    style = (Opts.dotGradient) ?
      dotGradient(
        Snake.x[0], Snake.y[0], ClrLight.snakeHead, ClrLight.snakeHeadShadow
      ) :
      ClrLight.snakeHead;

    drawDot(Snake.x[0], Snake.y[0], style);
    for (let i = 1; i < Snake.x.length; i++) {
      style = (Opts.dotGradient) ? dotGradient(
        Snake.x[i], Snake.y[i], ClrLight.snakeBody, ClrLight.snakeBodyShadow
      ) : ClrLight.snakeBody;
      drawDot(Snake.x[i], Snake.y[i], style);
    }
  } else {
    hue = 0;
    for (let i = 0; i < Snake.x.length; i++) {
      style = (Opts.dotGradient) ?
        dotGradient(Snake.x[i],Snake.y[i],hslToHex(hue,100,50),'black') :
        hslToHex(hue,100,50);
      drawDot(Snake.x[i], Snake.y[i], style);
      hue += 10;
    }
  }
}

function drawFruit() {
  let c1, c2;
  c1 = (Sys.theme === Themes.light) ? ClrLight.fruit : ClrDark.fruit;
  c2 = (Sys.theme === Themes.light) ? ClrLight.fruitShadow : 'black';
  for (let i = 0; i < Fruit.x.length; i++) {
    const x = Fruit.x[i];
    const y = Fruit.y[i];
    drawDot(x, y, (Opts.dotGradient) ? dotGradient(x, y, c1, c2): c1);
  }
}

function draw() {
  drawBG();
  drawSnake();
  drawFruit();
  if (text !== '') drawText();
}

function spawnFruit() {
  let x = 0, y = 0;
  do {
    x = Math.trunc(Math.random() * Opts.dotsX);
    y = Math.trunc(Math.random() * Sys.dotsY);
  } while (
    Snake.x.some((sx, i) => sx === x && Snake.y[i] === y) ||
    Fruit.x.some((fx, i) => fx === x && Fruit.y[i] === y)
  );
  Fruit.x.push(x);
  Fruit.y.push(y);
}

function eatFruit() {
  const index = Fruit.x.findIndex((fx, i) =>
    fx === Snake.x[0] && Fruit.y[i] === Snake.y[0]
  );
  if (index === -1) return;
  Fruit.x.splice(index, 1);
  Fruit.y.splice(index, 1);
  Snake.x.push(Snake.x[Snake.x.length-1]);
  Snake.y.push(Snake.y[Snake.y.length-1]);
  St.sleepTime -= Cnst.sleepTimeDec;
  Fruit.chance += Cnst.fruitChanceInc;
  St.score++;
  Elems.scoreSpan.textContent = St.score;
}

function reset() {
  St.inputKey = '';

  St.sleepTime = Init.sleepTime;

  Snake.x = [];
  Snake.y = [];
  Snake.dirX = Init.dirX;
  Snake.dirY = Init.dirY;

  Fruit.x = [];
  Fruit.y = [];
  Fruit.chance = Init.fruitChance;

  St.score = 0;
  Elems.scoreSpan.textContent = St.score;

  const centerX = Math.trunc(Opts.dotsX / 2);
  const centerY = Math.trunc(Sys.dotsY / 2);
  const snakeMiddle = Math.trunc(Init.snakeLen / 2);
  for (let i = Init.snakeLen - 1; 0 <= i; i--) {
    Snake.x.push(centerX + (i - snakeMiddle));
    Snake.y.push(centerY);
  }
  spawnFruit();
  draw();
}

async function loop() {

  switch(St.inputKey) {
  case 'ArrowUp': case 'KeyW': case 'KeyK':
    Snake.dirX = 0;
    if (Snake.dirY !== 1) { Snake.dirY = -1; }
    break;
  case 'ArrowDown': case 'KeyS': case 'KeyJ':
    Snake.dirX = 0;
    if (Snake.dirY !== -1) { Snake.dirY = 1; }
    break;
  case 'ArrowLeft': case 'KeyA': case 'KeyH':
    if (Snake.dirX !== 1) { Snake.dirX = -1; }
    Snake.dirY = 0;
    break;
  case 'ArrowRight': case 'KeyD': case 'KeyL':
    if (Snake.dirX !== -1) { Snake.dirX = 1; }
    Snake.dirY = 0;
    break;
  default:
    break;
  }

  for (let i = Snake.x.length - 1; 1 <= i; i--) {
    Snake.x[i] = Snake.x[i-1];
    Snake.y[i] = Snake.y[i-1];
  }
  Snake.x[0] += Snake.dirX;
  Snake.y[0] += Snake.dirY;

  eatFruit();

  doneFor = false;
  doneFor = Snake.x[0] < 0 || Opts.dotsX <= Snake.x[0];
  doneFor = doneFor || (Snake.y[0] < 0 || Sys.dotsY <= Snake.y[0]);
  doneFor = doneFor || Snake.x.some(
    (sx, i) => i !== 0 && sx === Snake.x[0] && Snake.y[i] === Snake.y[0]
  );
  if (doneFor) {
    text = 'GAME OVER';
    drawText();
    await waitInput();
    text = '';
    reset();
  }

  updateInfo();
  draw();

  if (Math.random() <= Init.fruitChance) { spawnFruit(); }

  await sleep(St.sleepTime);

  window.requestAnimationFrame(loop);
}

async function run() {
  const trs = document.getElementsByTagName('tr')
  for (let i=0; i < trs.length; i++) {
    const inputs = trs[i].getElementsByTagName('input');
    if (inputs.length === 2) {
      inputPairs.set(inputs[0].name, inputs[1].name);
      inputPairs.set(inputs[1].name, inputs[0].name);
    }
  }

  updateSys();
  if (Elems.themeSwitch.checked) {
    Elems.themeLink.setAttribute('href', 'theme-dark.css');
  }
  Elems.info.addEventListener('toggle', () => Sys.infoShown = !Sys.infoShown);
  Elems.themeSwitch.addEventListener('change', switchTheme);
  Elems.optsForm.addEventListener('change', changeOpts);
  Elems.optsForm.addEventListener('submit', evt => evt.preventDefault())
  text = 'PRESS ANY KEY';
  reset();
  await waitInput();
  text = '';
  window.addEventListener('keydown', evt => St.inputKey = evt.code);
  Elems.cnvCnt.addEventListener('click', onClick);
  loop();
}

run();
