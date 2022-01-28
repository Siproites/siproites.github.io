import { process } from "./adjust.js";
import { generateText } from "./generateText.js";
import { loadImage } from "./utils.js";

export async function caption(cap, height = 800, options = {}) {
  const canvas = document.createElement("canvas");
  //document.body.appendChild(canvas);
  options = Object.assign(
    {
      padding: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 50,
      },
      backgroundColor: "rgb(100, 100, 0)",
      textColor: "white",
      font: "12px 'Roboto Slab'",
    },
    options
  );

  let pad = options.padding;
  if (Number.isFinite(pad)) {
    pad = {
      left: pad,
      right: pad,
      top: pad,
      bottom: pad,
    };
  }
  const out_img = document.getElementById("cap_out");

  const ctx = canvas.getContext("2d");

  //Set font options
  ctx.textBaseline = "top";
  ctx.font = options.font;

  const text = generateText(cap, "text");
  //You have the total height minus the padding
  const textHeight = height - pad.top - pad.bottom;
  const res = process(ctx, text, textHeight);
  console.log(res);
  const img = await loadImage(cap.img);
  const img_width = (height / img.naturalHeight) * img.naturalWidth;

  //Everything is dependent on height
  canvas.height = height;
  //Image width + text width + padding
  canvas.width = img_width + res.width + pad.left + pad.right;

  //Set background color
  ctx.fillStyle = cap["background color"] || options.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //Set text color
  ctx.fillStyle = cap["text color"] || options.textColor;
  ctx.font = options.font;

  ctx.drawImage(img, 0, 0, img_width, height);
  res.draw(
    {
      x: img_width + pad.left,
      y: pad.top + (textHeight - res.linesHeight) / 2,
    },
    "block"
  );

  ctx.font = "20px Nunito";
  ctx.textAlign = "right";
  makeMark(ctx, "Siproites.blogspot.com | #" + cap.seed, {
    x: canvas.width - pad.right,
    y: canvas.height - pad.top,
  });

  canvas.toBlob(blob => {
    out_img.src = URL.createObjectURL(blob);
  });
}

/*text-shadow: -2px 2px 0 #418597, -4px 4px 0 #5e6b8a, -6px 6px 0 #7a507e, -8px 8px 0 #973671, -10px 10px 0 #b41c65;*/

function makeMark(ctx, text = "Siproites", offset) {
  ctx.fillText(text, offset.x, offset.y);
}

function _makeMark(ctx, text = "Siproites", offset) {
  const step = 1.5;
  const colors = ["#418597", "#5e6b8a", "#7a507e", "#973671", "#b41c65"]; /*
  const outline = 2;
  ctx.font = "bold " + (size + 2 * outline) + "px Nunito";
  ctx.fillStyle = "white";
  for(let i = 0; i < colors.length; i++){
    ctx.fillText(text, offset.x -  (2 + outline) * i - outline, offset.y + (2 + outline) * i + outline);
  }*/
  let i = 0;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  for (let color of colors) {
    let x = offset.x - step * i;
    let y = offset.y + step * i;
    ctx.strokeText(text, x, y);
    i++;
  }
  i = 0;
  ctx.lineWidth = 1;
  for (let color of colors) {
    let x = offset.x - step * i;
    let y = offset.y + step * i;
    ctx.fillStyle = color;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    i++;
  }
}
