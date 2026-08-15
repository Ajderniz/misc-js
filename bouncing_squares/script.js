const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const w = 32,
      h = 32,
      speed = 1,
      endX = canvas.width - w,
      endY = canvas.height - h,
      hueRange = 360;
      recCount = 4;
      sat = "50%",
      lig = "50%";

let posX = [0, endX, endX, 0],
    posY = [0, 0, endY, endY],
    dirX = [1, 1, 1, 1],
    dirY = [1, 1, 1, 1],
    hues = [
      0,
      hueRange * .25,
      hueRange * .5,
      hueRange * .75
    ];

function anim() {
  for (let i = 0; i < recCount; i++) {
    if (posX[i] < 0 || endX <= posX[i]) { dirX[i] *= -1; }
    if (posY[i] < 0 || endY <= posY[i]) { dirY[i] *= -1; }

    posX[i] += dirX[i] * speed;
    posY[i] += dirY[i] * speed;

    hues[i]++;
    ctx.fillStyle = "hsl("+hues[i]+" "+sat+" "+lig+")";

    ctx.fillRect(posX[i], posY[i], w, h);
  }

  window.requestAnimationFrame(anim); 
}

window.requestAnimationFrame(anim);