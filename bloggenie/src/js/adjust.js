/*import * as texLineBreak from 'tex-linebreak';
const {layoutText, justifyContent, positionItems, breakLines, createHyphenator} = texLineBreak.default;

import enUsPatterns from 'hyphenation.en-us';*/

/*
const hyphenate = createHyphenator(enUsPatterns);
const measure = word => word.length * 5;

const { items, positions } = layoutText(text, lineWidth, measure, hyphenate);

positions.forEach(pos => {
  // Draw text as in the above example for the low-level APIs
});*/

const reduceMin = (acc, cur) => (cur < acc ? cur : acc);
const reduceMax = (acc, cur) => (cur > acc ? cur : acc);
const measureWord = ctx => word => {
  return {
    word,
    width: ctx.measureText(word).width,
  };
};

const minWidth = paragraphs => {
  return paragraphs
    .map(words => words.map(word => word.width).reduce(reduceMax))
    .reduce(reduceMax);
};

function measureWords(ctx, paragraphs) {
  return paragraphs.map(words => words.map(measureWord(ctx)));
}
function splitIntoLines(paragraph, spaceWidth, maxWidth) {
  const lines = [];
  let currentWidth = 0;
  let currentLine = [];
  //How much space would be needed at minimum to fit another word on another line
  let minMissing = Infinity;
  const breakLine = needed => {
    if (needed < minMissing) minMissing = needed;
    lines.push({
      words: currentLine,
      //Adjust for the added space at the end of each word
      totalWidth: currentWidth - spaceWidth,
    });
    currentWidth = 0;
    currentLine = [];
  };
  for (let i = 0; i < paragraph.length; i++) {
    const word = paragraph[i];
    const spaceNeeded = currentWidth + word.width - maxWidth;
    if (spaceNeeded > 0) {
      breakLine(spaceNeeded);
      i--;
    } else {
      //word.x = currentWidth;
      currentWidth += spaceWidth + word.width;
      currentLine.push(word);
    }
  }
  breakLine(Infinity);
  //To avoid weird bugs, because last line will never break
  lines[lines.length - 1].totalWidth = 0;
  return lines;
}
function drawText(
  ctx,
  lines,
  justify = "block",
  { lineHeight, maxWidth, spaceWidth },
  offset
) {
  let actualSpaceWidth = spaceWidth;
  lines.forEach((line, i) => {
    const baseY = offset.y + lineHeight * i;
    if (justify === "block")
      actualSpaceWidth =
        i === lines.length - 1
          ? spaceWidth
          : spaceWidth + (maxWidth - line.totalWidth) / (line.words.length - 1);
    let x = offset.x;
    for (let word of line.words) {
      ctx.fillText(word.word, x, baseY);
      x += actualSpaceWidth + word.width;
    }
  });
  return lineHeight * lines.length;
}
const totalHeight = (splitLines, lineHeight) => {
  let totalY = 0;
  for (let line of splitLines) {
    totalY += line.length * lineHeight;
  }
  return totalY - lineHeight * 1;
};
const minMissing = (splitLines, maxWidth, minOffset = 2) => {
  const missing = splitLines
    .map(lines =>
      lines
        .map(line => {
          let delta = maxWidth - line.totalWidth;
          return delta > minOffset ? delta : Infinity;
        })
        .reduce(reduceMin)
    )
    .reduce(reduceMin);
  return missing == Infinity ? minOffset : missing;
};

export function process(ctx, text, maxHeight = 500) {
  const spaceWidth = measureWord(ctx)(" ").width;
  const lineWord = ctx.measureText(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  );
  const ascent = lineWord.actualBoundingBoxAscent;
  const descent = lineWord.actualBoundingBoxDescent;
  const lineHeight = (ascent + descent) * 1.5;

  let paragraphs = text.split("\n");
  //Split into words
  paragraphs = paragraphs.map(t => t.split(" "));
  //Measure words
  paragraphs = measureWords(ctx, paragraphs);

  let currentMaxWidth = minWidth(paragraphs);
  let totalH = 0;
  let i = 0;
  let splitLines;
  while (i < 1000) {
    i++;
    splitLines = paragraphs.map(p =>
      splitIntoLines(p, spaceWidth, currentMaxWidth)
    );
    totalH = totalHeight(splitLines, lineHeight);
    if (totalH < maxHeight) break;

    const missing = minMissing(splitLines, currentMaxWidth);
    currentMaxWidth += missing;
  }

  const draw = (offset, justify = "block") => {
    let currentY = offset.y;
    for (let split of splitLines) {
      currentY += drawText(
        ctx,
        split,
        justify,
        {
          spaceWidth,
          maxWidth: currentMaxWidth,
          lineHeight,
        },
        {
          x: offset.x,
          y: currentY,
        }
      );
    }
  };
  return {
    width: currentMaxWidth,
    linesHeight: totalH,
    draw,
  };
}

/*
export function _process(ctx, text, lineWidth = 200, offset = {x: 0, y: 0}) {
  //ctx.font = '10px "Roboto Slab"';
  ctx.fillStyle = "black";

  const testWord = measureWord(ctx)( "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ").metrics;

  const measureText = str => ctx.measureText(str).width;
  const hyphenate = createHyphenator(enUsPatterns);

  const { items, positions } = layoutText(text, lineWidth, measureText, hyphenate);
  
  const ascent = testWord.actualBoundingBoxAscent;
  const descent = testWord.actualBoundingBoxDescent;
  const lineHeight = (ascent + descent) * 1.5;

  console.log(testWord);
  positions.forEach(pi => {
    const item = items[pi.item];
    console.log(pi, item)

    let y = offset.y + pi.line * lineHeight;
    if(item.flagged)
      ctx.fillText("-", offset.x + pi.xOffset, y)
    else
      ctx.fillText(item.text, offset.x + pi.xOffset, y);
  });
  
}
/*
export function process(ctx, text, width = 200) {
  const spaceWord = measureWord(ctx, " ");
  let paragraphs = text.split("\n");
  //Split into words
  paragraphs = paragraphs.map(t => t.split(" "));
  //Measure words
  paragraphs = measureWords(ctx, paragraphs);

  const minW = minWidth(paragraphs);
  console.log(minW);
}*/
