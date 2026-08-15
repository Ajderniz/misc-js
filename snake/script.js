const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const themeLink = document.getElementById('theme-link');
const themeSwitch = document.getElementById('theme-switch');
const scoreSpan = document.getElementById('score');
const optsForm = document.getElementById('opts');


const initSleepTime = 500,
      sleepTimeDecrement = 5,
      initDirX = 1,
      initDirY = 0,
      initSnakeLen = 3,
      initFruitChance = .01,
      fruitChanceIncrement = .005;

const Themes = {
  light: 0,
  dark:  1,
  count: 2,
};
let theme = (themeSwitch.checked) ? Themes.dark : Themes.light;

const ColorsLight = {
  dot:       'lightblue',
  snakeBody: 'lightcoral',
  snakeHead: 'coral',
  fruit:     'orange',
  font:      'black',
};
const ColorsDark = {
  fruit: 'white',
  font:  'white',
};
const fontLight = "32px Comic Sans MS";
const fontDark  = "32px monospace";

let dotsX = 0,
    dotsY = 0;
    dotSize = 0
    halfDot = 0;

let key = '';

let sleepTime = initSleepTime;

let snakeX = [],
    snakeY = [],
    dirX = initDirX,
    dirY = initDirY;

let fruitX = [],
    fruitY = [],
    fruitChance = initFruitChance;

let score = 0;

let text = "PRESS ANY KEY";

function hslToHex(h, s, l) {
  l *= .01;
  const a = s * Math.min(l, 1 - l) * .01;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function waitKey() {
  return new Promise(resolve => {
    function onKeyHandler(event) {
      resolve(event);
    }
    document.addEventListener('keydown', onKeyHandler, { once: true });
  })
}

const storeKeydown = evt => key = evt.code;

function switchTheme(evt) {
  theme = (theme += 1) % Themes.count;
  if (themeLink.getAttribute('href') === 'theme-light.css') {
    themeLink.setAttribute('href', 'theme-dark.css')
  } else {
    themeLink.setAttribute('href', 'theme-light.css')
  }
  draw();
}

function updateValues() {
  const data = new FormData(optsForm);

  const oldCanvasWidth = canvas.width;
  const newCanvasWidth = parseInt(data.get('canvas-width-number'));
  const newCanvasHeight = parseInt(data.get('canvas-height-number'));

  console.log(oldCanvasWidth, newCanvasWidth, newCanvasHeight);

  canvas.width = newCanvasWidth;
  canvas.height = newCanvasHeight;

  console.log(oldCanvasWidth, newCanvasWidth, newCanvasHeight);

  if (oldCanvasWidth !== newCanvasWidth) {
    dotsXNumber = document.getElementById('dots-x-number');
    dotsXSlider = document.getElementById('dots-x-slider');

    dotsXNumber.max = canvas.width;
    dotsXSlider.max = canvas.width;

    if (+dotsXNumber.max < +dotsXNumber.value) {
      dotsXNumber.value = canvas.width;
      dotsXSlider.value = canvas.width;
    }
  }

  const oldDotsX = dotsX;
  const oldDotsY = dotsY;
  const newDotsX = data.get('dots-x-number');

  if (newDotsX === oldDotsX) return;

  dotSize = Math.ceil(canvas.width / newDotsX);
  dotsX = newDotsX;
  dotsY   = Math.ceil(canvas.height / dotSize);
  halfDot = dotSize * .5;

  if (oldDotsX === 0 || oldDotsX < newDotsX) return;

  for (let i = 0; i < snakeX.length; i++) {
    let fracX = snakeX[i] / oldDotsX;
    let fracY = snakeY[i] / oldDotsY;
    snakeX[i] = Math.ceil(fracX * dotsX);
    snakeY[i] = Math.ceil(fracY * dotsY);
  }
  for (let j = 0; j < fruitX.length; j++) {
    while (dotsX < fruitX[j] || dotsY < fruitY[j]) {
      fruitX.splice(j, 1);
      fruitY.splice(j, 1);
    }
    let fracX = fruitX[j] / oldDotsX;
    let fracY = fruitY[j] / oldDotsY;
    fruitX[j] = Math.ceil(fracX * dotsX);
    fruitY[j] = Math.ceil(fracY * dotsY);
  }
}

function changeOpts(evt) {
  const data = new FormData(optsForm);
  const name = evt.srcElement.name;
  let value = 0;
  switch(name) {
  case 'dots-x-number':
    value = parseInt(data.get('dots-x-number'));
    document.getElementById('dots-x-slider').value = value;
    break;
  case 'dots-x-slider':
    value = parseInt(data.get('dots-x-slider'));
    document.getElementById('dots-x-number').value = value;
    break;
  case 'canvas-width-number':
    value = parseInt(data.get('canvas-width-number'));
    document.getElementById('canvas-width-slider').value = value;
    canvas.width = value;
    break;
  case 'canvas-width-slider':
    value = parseInt(data.get('canvas-width-slider'));
    document.getElementById('canvas-width-number').value = value;
    canvas.width = value;
    break;
  case 'canvas-height-number':
    value = parseInt(data.get('canvas-height-number'));
    document.getElementById('canvas-height-slider').value = value;
    break;
  case 'canvas-height-slider':
    value = parseInt(data.get('canvas-height-slider'));
    document.getElementById('canvas-height-number').value = value;
    break;
  default: break;
  }
  if (value !== 0) {
    updateValues();
    draw();
  }
}

function drawDot(x, y, fillStyle) {
  ctx.fillStyle = fillStyle;
  if (3 <= dotSize) {
    ctx.beginPath();
    ctx.arc(halfDot + x*dotSize, halfDot + y*dotSize, halfDot, 0, 2*Math.PI);
    ctx.fill();
  } else {
    ctx.fillRect(x*dotSize, y*dotSize, dotSize, dotSize);
  }
}

function drawTextCentered(txt) {
  const color = (theme === Themes.light) ? ColorsLight.font : ColorsDark.font;
  ctx.font = (theme === Themes.light) ? fontLight : fontDark;
  const m = ctx.measureText(txt);
  //let h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;

  x = (canvas.width - m.width) * .5;
  y = (canvas.height/* - h*/) * .5;

  ctx.fillStyle = color;
  ctx.fillText(txt, x, y);
}

function drawText() {
  drawTextCentered(text);
}

function drawBG() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (theme === Themes.dark) return;
  if (3 <= dotSize) {
    for (let x = 0; x < dotsX; x++) {
      for (let y = 0; y < dotsY; y++) {
        drawDot(x, y, ColorsLight.dot);
      }
    }
  } else {
    ctx.fillStyle = ColorsLight.dot;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawSnake() {
  if (theme === Themes.light) {
    drawDot(snakeX[0], snakeY[0], ColorsLight.snakeHead);
    for (let i = 1; i < snakeX.length; i++) {
      drawDot(snakeX[i], snakeY[i], ColorsLight.snakeBody);
    }
  } else {
    hue = 0;
    for (let i = 0; i < snakeX.length; i++) {
      drawDot(snakeX[i], snakeY[i], hslToHex(hue, 100, 50));
      hue += 10;
    }
  }
}

function drawFruit() {
  const color = (theme === Themes.light) ? ColorsLight.fruit : ColorsDark.fruit;
  for (let i = 0; i < fruitX.length; i++) {
    drawDot(fruitX[i], fruitY[i], color);
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
    x = Math.trunc(Math.random() * dotsX);
    y = Math.trunc(Math.random() * dotsY);
  } while (
    snakeX.some((sx, i) => sx === x && snakeY[i] === y) ||
    fruitX.some((fx, i) => fx === x && fruitY[i] === y)
  );
  fruitX.push(x);
  fruitY.push(y);
}

function eatFruit() {
  const index = fruitX.findIndex((fx, i) =>
    fx === snakeX[0] && fruitY[i] === snakeY[0]
  );
  if (index !== -1) {
    fruitX.splice(index, 1);
    fruitY.splice(index, 1);
    snakeX.push(snakeX[snakeX.length-1]);
    snakeY.push(snakeY[snakeY.length-1]);
    sleepTime -= sleepTimeDecrement;
    fruitChance += fruitChanceIncrement;
    score++;
    scoreSpan.textContent = score;
  }
}

function init() {
  key = '';

  sleepTime = initSleepTime;

  snakeX = [];
  snakeY = [];
  dirX = initDirX;
  dirY = initDirY;

  fruitX = [];
  fruitY = [];
  fruitChance = initFruitChance;

  score = 0;
  scoreSpan.textContent = score;

  const centerX = Math.trunc(dotsX / 2);
  const centerY = Math.trunc(dotsY / 2);
  const snakeMiddle = Math.trunc(initSnakeLen / 2);
  for (let i = initSnakeLen - 1; 0 <= i; i--) {
    snakeX.push(centerX + (i - snakeMiddle));
    snakeY.push(centerY);
  }
  spawnFruit();
  draw();
}

async function loop() {

  switch(key) {
  case 'ArrowUp': case 'KeyW': case 'KeyK':
    dirX = 0;
    if (dirY !== 1) { dirY = -1; }
    break;
  case 'ArrowDown': case 'KeyS': case 'KeyJ':
    dirX = 0;
    if (dirY !== -1) { dirY = 1; }
    break;
  case 'ArrowLeft': case 'KeyA': case 'KeyH':
    if (dirX !== 1) { dirX = -1; }
    dirY = 0;
    break;
  case 'ArrowRight': case 'KeyD': case 'KeyL':
    if (dirX !== -1) { dirX = 1; }
    dirY = 0;
    break;
  default:
    break;
  }

  for (let i = snakeX.length - 1; 1 <= i; i--) {
    snakeX[i] = snakeX[i-1];
    snakeY[i] = snakeY[i-1];
  }
  snakeX[0] += dirX;
  snakeY[0] += dirY;

  eatFruit();

  doneFor = false;
  doneFor = snakeX[0] < 0 || dotsX <= snakeX[0];
  doneFor = doneFor || (snakeY[0] < 0 || dotsY <= snakeY[0]);
  doneFor = doneFor || snakeX.some(
    (sx, i) => i !== 0 && sx === snakeX[0] && snakeY[i] === snakeY[0]
  );
  if (doneFor) {
    text = "GAME OVER";
    drawText();
    await waitKey();
    text = "";
    init();
  }

  draw();

  if (Math.random() <= fruitChance) { spawnFruit(); }

  await sleep(sleepTime);

  window.requestAnimationFrame(loop);
}

async function run() {
  updateValues();
  if (themeSwitch.checked) { themeLink.setAttribute('href', 'theme-dark.css'); }
  themeSwitch.addEventListener('change', switchTheme);
  optsForm.addEventListener('change', changeOpts);
  optsForm.addEventListener('submit', evt => evt.preventDefault())
  text = "PRESS ANY KEY";
  init();
  await waitKey();
  text = "";
  window.addEventListener('keydown', storeKeydown);
  loop();
}

run();
