
class Captioneer {
  constructor(canvas, options = {}) {
    this.ctx = canvas.getContext("2d", {alpha: false});
    this.canv = canvas;
    this.fontSize = options.fontSize || 10;
    this.padding = options.padding || 10;
    this.textCol = options.textCol || "#FFFFFF";
    this.bgCol = options.bgCol || "#000000";
    this.setMode(options.mode);
    this.width = this.canv.width;
    this.height = this.canv.height;
    this.eyedropperEnabled = false;
    this.initEyedropper();
    this.lineFactor = 1.3;
  }

  initScript(font, size = 12) {
    this.fontSize = size;
    this.fontFamily = font;
    this.font = `${size}px ${font}`;
    this.ctx.font = `${size}px ${font}`;
    this.spaceW = this.ctx.measureText(" ").width;
    this.lineH = 1.3 * size;
    this.lineHeights = {};
    this.parseDeltas();
  }

  resizeCanvas(width, height) {
    this.canv.width = width;
    this.width = width;
    this.canv.height = height;
    this.height = height;
    this.ctx.font = this.font;
  }
  setImage (src_img, cropData, scale = 1) {
    this.img = src_img;
    this.scale = scale;
    this.cropData = cropData || {
      x: 0,
      y: 0,
      width: this.img.w,
      height: this.img.h
    };
    if(this.fixedWidthEnabled){
      let t = this.fixedWidth / this.cropData.width;

      this.img.w = this.cropData.width * t;
      this.img.h = this.cropData.height * t;
    }else{
      this.img.w =  this.cropData.width * this.scale;
      this.img.h =  this.cropData.height * this.scale;
    }
    this.resizeCanvas(this.img.w, this.img.h);
    return this;
  };

  setFixedWidth (enab, width) {
    this.fixedWidthEnabled = enab;
    if(this.fixedWidthEnabled){
      this.fixedWidth = width;
    }
    return this;
  }

  setDeltas(deltas) {
    this.deltas = deltas;
    //this.parseDeltas();
    return this;
  }

  setFont(font, size) {
    this.initScript(font, size);
    return this;
  }

  setPadding(padding) {
    this.padding = padding;
    return this;
  }

  setMode(mode = "west") {
    let modes = {
      "n": "north",
      "up": "north",
      "s": "south",
      "down": "south",
      "w": "west",
      "left": "west",
      "e": "east",
      "right": "east"
    };
    if(modes[mode]){
      mode = modes[mode];
    }
    this.mode = mode;
    return this;
  }

  setTextColor(color) {
    this.textCol = color;
    return this;
  }

  setBackground(color) {
    this.bgCol = color;
    return this;
  }

  setAdjustImageSize(bool) {
    this.adjustImageSize = bool;
    return this;
  }

  initEyedropper() {
    let _this = this;
    document.addEventListener("click", function(e) {
      if (e.target != this.canv) {
        this.eyedropperEnabled = false;
      }
    });
    this.canv.addEventListener("mousemove", ({clientX, clientY}) => {
      if (!_this.eyedropperEnabled) return;
      _this.update();
      
      const rect = _this.canv.getBoundingClientRect();
      const scaleX = _this.canv.width / rect.width;
      const scaleY = _this.canv.height / rect.height;

      const x = Math.floor((clientX - rect.left) * scaleX);
      const y = Math.floor((clientY - rect.top) * scaleY);
      let col = _this.ctx.getImageData(x, y, 1, 1).data;
      _this.ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 1)`;
      _this.ctx.lineWidth = Math.floor(3 * scaleX);
      _this.ctx.strokeStyle = "white";
      _this.ctx.beginPath();
      _this.ctx.arc(x, y, Math.floor(10 * scaleX), 0, 2 * Math.PI);
      _this.ctx.stroke();
      _this.ctx.fill();
    });
    this.canv.addEventListener("click", ({clientX, clientY}) => {
      if (!_this.eyedropperEnabled) return;
      _this.eyedropperEnabled = false;
      _this.update();
      const rect = _this.canv.getBoundingClientRect();
      const scaleX = _this.canv.width / rect.width;
      const scaleY = _this.canv.height / rect.height;

      const x = Math.floor((clientX - rect.left) * scaleX);
      const y = Math.floor((clientY - rect.top) * scaleY);
      let col = _this.ctx.getImageData(x, y, 1, 1).data;
      if (_this.eyedropperCallback) _this.eyedropperCallback(col);
    });
    this.canv.addEventListener("mouseleave", e => {
      if (!_this.eyedropperEnabled) return;
      _this.update();
    });
  }

  calculateWidthNeeded(paragraphs, initialWidth) {
    const lines = [];
    if(((this.lineH * paragraphs.length) + 2 * this.padding) >
      this.canv.height){
      console.error("Too many paragraphs");
      return Infinity;
    }
    let currentWidth = initialWidth;
    let returnWidth;
    let running = 0;
    let needed = Infinity;
    let height = Infinity;
    const maxHeight = this.img.h - 2 * this.padding;
    while(height > maxHeight){
      running++;
      //Run at least once
      height = 0;
      for(let paragraph of paragraphs){
        let res = this.calculateLinesDeltas(paragraph, currentWidth);
        height += res.height;
        needed = Math.min(needed, res.nextWidth);
      }
      if(running > this.deltas.length){
        console.error("Too many Iterations");
        return Infinity;
      }
      //Set Width for next iteration
      returnWidth = currentWidth;
      currentWidth = needed;
      needed = Infinity;
    }
    return returnWidth;
  }

  calculateLinesDeltas(paragraph, width){ 
    var lines = [];
    var running = [];
    var runningWidth = 0;
    var neededWidth = 0;
    var remaining = width;
    var mLineH = 0;
    var mFSize = 0;

    var totalHeight = 0;
    var PUSH = (i) => {
      //ARROW FUNCTION retains "this"
      if(mLineH === 0){
        mLineH = this.lineFactor * this.fontSize;
      }
      if(mFSize === 0){
        mFSize = this.fontSize;
      }
      totalHeight += mLineH;
      //Maximum amount of Width
      neededWidth = Math.max(neededWidth, runningWidth);
      let push = {
        width: runningWidth,
        words: running,
        height: mLineH,
        baseline: mFSize,
        remaining: width - runningWidth,
        attributes: {}
      };
      if(paragraph.attributes.align){
        push.attributes.align = paragraph.attributes.align;
      }
      lines.push(push);
      running = [];
      runningWidth = 0;
      mLineH = 0;
      mFSize = 0;
      remaining = width;
    }
    
      var t = 0;
    for(let i = 0; i < paragraph.words.length; i++){
      let word = paragraph.words[i];
      let w = word.width;
      t++;
      if(w >= width){
        //Word doesn't fit into width
        if(runningWidth > 0){
          //Make sure the word is on it's own line.
          PUSH(i);
        }
        running.push(word);
        if(word.attributes && word.attributes.size)
          mFSize = Math.max(mFSize, word.attributes.size)
        mLineH = Math.max(mLineH, word.height);
        remaining -= (w + this.spaceW);
        runningWidth += (w + this.spaceW);
        PUSH(i);
      }else if(remaining >= (w + this.spaceW)){
        running.push(word);
        if(word.attributes && word.attributes.size)
          mFSize = Math.max(mFSize, word.attributes.size)
        mLineH = Math.max(mLineH, word.height);
        remaining -= (w + this.spaceW);
        runningWidth += (w + this.spaceW);
      }else if(remaining >= (w)){
        running.push(word);
        if(word.attributes && word.attributes.size)
          mFSize = Math.max(mFSize, word.attributes.size)
        mLineH = Math.max(mLineH, word.height);
        remaining -= (w + this.spaceW);
        runningWidth += (w + this.spaceW);
        PUSH(i);
      } else {
        //Word doesn't fit, start new Line and process Word again
        if(t > (2 * paragraph.words.length)){
          console.error("IT BROKE! IT SHOUDLNT");
          return;
        }
        i--;
        PUSH(i);
      }
    }
    if(runningWidth > 0){
      PUSH();
    }
    
    if(lines.length > 0 && lines[lines.length - 1].attributes.align){
      if(lines[lines.length - 1].attributes.align === "justify"){
        lines[lines.length - 1].attributes.align = "left";
      }
    }
      
    let cmin = Infinity;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let nline = lines[i + 1];
      if (!nline || nline.words.length === 0) continue;
      //What would be needed to have the next Word on the current Line -> smallest amount
      cmin = Math.min(cmin, lines[i].width + this.spaceW + nline.words[0].width);
    }
    return {
      //To "remove" all extra spaces
      width: Math.max(0, neededWidth - this.spaceW),
      nextWidth: cmin,
      lines: lines,
      height: totalHeight
    };
  }

  update(){
    if (!(this.img && this.paragraphs && this.drawLines)) return;
    if (this.mode == "south" || this.mode == "north") {
      this.updateVertical();
    } else if (this.mode == "east" || this.mode == "west") {
      this.updateHorizontal();
    }
  }

  updateHorizontal() {
    this.ctx.fillStyle = this.bgCol;
    this.ctx.fillRect(0, 0, this.width, this.height);
    if (this.mode == "east") {
      this.ctx.drawImage(
        this.img,
        this.cropData.x,
        this.cropData.y,
        this.cropData.width,
        this.cropData.height,
        0,
        0,
        this.img.w,
        this.img.h
      );
      this.drawTextDeltas(this.drawLines, this.img.w + this.padding, this.padding, this.drawTextWidth);
    } else if (this.mode == "west") {
      this.ctx.drawImage(
        this.img,
        this.cropData.x,
        this.cropData.y,
        this.cropData.width,
        this.cropData.height,
        this.drawTextWidth + 2 * this.padding,
        0,
        this.img.w,
        this.img.h
      );
      this.drawTextDeltas(this.drawLines, this.padding, this.padding, this.drawTextWidth);
    }
  }

  updateVertical(){
    this.ctx.fillStyle = this.bgCol;
    this.ctx.fillRect(0, 0, this.width, this.height);
    if (this.mode == "north") {
      this.ctx.drawImage(
        this.img,
        this.cropData.x,
        this.cropData.y,
        this.cropData.width,
        this.cropData.height,
        0,
        height,
        this.img.w,
        this.img.h
      );
      this.drawTextDeltas(this.drawLines, this.padding, this.padding, this.drawTextWidth);
    } else if (this.mode == "south") {
      this.ctx.drawImage(
        this.img,
        this.cropData.x,
        this.cropData.y,
        this.cropData.width,
        this.cropData.height,
        0,
        0,
        this.img.w,
        this.img.h
      );
      this.drawTextDeltas(this.drawLines, this.padding, this.padding + this.img.h, this.drawTextWidth);
    }
  }

  draw() {
    this.parseDeltas();
    if (!(this.img && this.paragraphs)) return;
    if (this.mode == "south" || this.mode == "north") {
      this.drawVertical();
    } else if (this.mode == "east" || this.mode == "west") {
      this.drawHorizontal();
    }
  }


  drawHorizontal() {
    const paragraphs = this.paragraphs;
    const neededWidth = this.calculateWidthNeeded(paragraphs, this.maxWordWidth);
    //console.log(neededWidth);
    let lines = [];
    let rHeight = 0;
    for(let paragraph of paragraphs){
      let tLines = this.calculateLinesDeltas(paragraph, neededWidth);
      lines = lines.concat(tLines.lines);
      rHeight += tLines.height;
    }
    /* Visual Balance */
    let height = 2 * this.padding + rHeight - this.fontSize * 0.3;
    //let height = (lines.length - 0.18) * this.lineH + 2 * this.padding;
    if (this.adjustImageSize && this.height / height < 1.1) {
      this.resizeCanvas(
        this.img.w + 2 * this.padding + neededWidth,
        height
      );
    } else {
      this.resizeCanvas(
        this.img.w + 2 * this.padding + neededWidth,
        this.height
      );
    }
    this.drawLines = lines;
    this.drawTextWidth = neededWidth;

    this.ctx.fillStyle = this.bgCol;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    if (this.mode == "east") {
      this.ctx.drawImage(
        this.img,
        this.cropData.x,
        this.cropData.y,
        this.cropData.width,
        this.cropData.height,
        0,
        0,
        this.img.w,
        this.img.h
      );
      this.drawTextDeltas(lines, this.img.w + this.padding, this.padding, neededWidth);
    } else if (this.mode == "west") {
      this.ctx.drawImage(
        this.img,
        this.cropData.x,
        this.cropData.y,
        this.cropData.width,
        this.cropData.height,
        neededWidth + 2 * this.padding,
        0,
        this.img.w,
        this.img.h
      );
      this.drawTextDeltas(lines, this.padding, this.padding, neededWidth);
    }

  }

  drawVertical() {
    const paragraphs = this.paragraphs;
    let lines = [];
    const width = this.img.w - 2 * this.padding;
    if(this.img.w < this.maxWordWidth){
      //return;
    }
    for(let paragraph of paragraphs){
      let tLines = this.calculateLinesDeltas(paragraph, width);
      lines = lines.concat(tLines.lines);
    }
    let height = (lines.length) * this.lineH + 2 * this.padding;
    //2console.log(this.line);
    console.log(height, this.height);
    this.resizeCanvas(
      this.img.w,
      this.img.h + height
    );


    const textWidth = this.width - 2 * this.padding;

    this.drawLines = lines;
    this.drawTextWidth = textWidth;
    
    this.ctx.fillStyle = this.bgCol;
    this.ctx.fillRect(0, 0, this.width, this.height);
    if (this.mode == "north") {
      this.ctx.drawImage(
        this.img,
        this.cropData.x,
        this.cropData.y,
        this.cropData.width,
        this.cropData.height,
        0,
        height,
        this.img.w,
        this.img.h
      );
      this.drawTextDeltas(lines, this.padding, this.padding, textWidth);
    } else if (this.mode == "south") {
      this.ctx.drawImage(
        this.img,
        this.cropData.x,
        this.cropData.y,
        this.cropData.width,
        this.cropData.height,
        0,
        0,
        this.img.w,
        this.img.h
      );
      this.drawTextDeltas(lines, this.padding, this.padding + this.img.h, textWidth);
    }

  }

  getTextHeight(font, size) {
    return this.lineFactor * this.fontSize;
    //For better support which I currently don't have
    if(!this.lineHeights[font + ";" + size]){
      var dummy = document.createElement('div');

      var dummyText = document.createTextNode('M');
      dummy.appendChild(dummyText);
      //var fontStyle = `font-size: 100px; font-family: "${font}"`;
      var fontStyle = `font-size: ${size}px; font-family: "${font}";position:absolute;top:0;left:0`;
      dummy.setAttribute('style', fontStyle);
      
      document.body.appendChild(dummy);


      dummy.style.verticalAlign = "baseline";
      //console.log(dummy.offsetHeight);
      //console.log(dummy.getBoundingClientRect());
      dummy.style.verticalAlign = "bottom";
      //onsole.log(dummy.offsetHeight);
      //console.log(dummy.getBoundingClientRect());
      var result = dummy.offsetHeight;
      document.body.removeChild(dummy);
      this.lineHeights[font + ";" + size] = result;
      //return result;
    }
    return this.lineHeights[font + ";" + size];
  }

  drawTextDeltas(lines, x, y, width) {
    this.ctx.textBaseline = "top";
    let cy = y;
    for(let i = 0; i < lines.length; i++){
      let line = lines[i];
      
      let cx = x;
      let spacing = this.spaceW;
      if(line.attributes.align){
        let align = line.attributes.align;
        if(align === "center"){
          cx += (width - line.width) / 2;
        }else if(align === "right"){
          cx += (width - line.width);
        }else if(align === "justify"){
          spacing = (width - line.width + ((line.words.length - 1) * this.spaceW)) / (line.words.length - 1);
        }
      }
      for(let word of line.words){
        for(let part of word.parts){
          this.setFontStyle(part.attributes);
          if(part.attributes.script){
            if(part.attributes.script === "sub"){
              this.ctx.textBaseline = "bottom";
              this.ctx.fillText(part.text, cx, cy + (part.height * 0.9));
            }else{
              this.ctx.fillText(part.text, cx, cy - (part.height * 0.15));
            }
            this.ctx.textBaseline = "top";
          }else{
            this.ctx.fillText(part.text, cx, cy);
          }
          if(part.attributes.strike){
            this.ctx.lineWidth = Math.ceil(this.fontSize / 16);
            this.ctx.strokeStyle = this.textCol;
            this.ctx.moveTo(cx, cy + (part.attributes.size || this.fontSize) / 2);
            this.ctx.lineTo(cx + part.width, cy + (part.attributes.size || this.fontSize) / 2);
            this.ctx.stroke();
          }
          if(part.attributes.underline){
            this.ctx.lineWidth = Math.ceil(this.fontSize / 16);
            this.ctx.strokeStyle = this.textCol;
            this.ctx.moveTo(cx, cy + (part.attributes.size || this.fontSize) * 0.9);
            this.ctx.lineTo(cx + part.width, cy + (part.attributes.size || this.fontSize) * 0.9);
            this.ctx.stroke();
          }
          cx += part.width;
        }
        cx += spacing;
      }
      cy += line.height;
    }
  }

  getDataURL() {
    return this.canv.toDataURL();
  }

  setFontStyle(options) {
    const font = [];
    //Font style
    if(options.italic) font.push("italic")
    //Font weight
    if(options.bold) font.push("bold");
    if(options.color) {
      this.ctx.fillStyle = options.color;
    }else {
      this.ctx.fillStyle = this.textCol;
    }
    //Font size
    if(options.size && false){
      font.push(`${options.size}px`);
    }else if(options.script){
      font.push(`${this.fontSize * 0.9}px`);
    }else{
      font.push(`${this.fontSize}px`);
    }
    //Font Family
    if(options.font){
      let fam = options.font.replace(/\-/g, " ");
      font.push(`"${fam}"`);
    }else if(this.fontFamily){
      font.push(this.fontFamily);
    }else {
      font.push("sans-serif");
    }
    this.ctx.font = font.join(" ");
  }

  parseDeltas() {
    const pre = [];
    let current = {contents: [], attributes: {}};
    let deltas = this.deltas;
    
    for(let op of deltas.ops){
      if(!op.insert)continue;
      var split = op.insert.split("\n");
      let lastIndex = pre.length;
      for(let i = 0; i < split.length; i++){
        let line = split[i];
        let push = {
          text: line,
          attributes: op.attributes ? Object.assign({}, op.attributes) : false
        };
        if(push.attributes.size && push.attributes.size.endsWith && push.attributes.size.endsWith("px")){
          push.attributes.size = parseInt(push.attributes.size.substr(0, push.attributes.size.length - 2));
        }
        current.contents.push(push);
        if(i !== (split.length - 1)){
          pre.push(current);
          current = {contents: [], attributes: {}};
        }else{
          if(op.attributes && op.attributes.align){
            for(let k = lastIndex; k < pre.length; k++){
              pre[k].attributes.align = op.attributes.align;
            }
          };
        }
      }
    }
    const parsed = [];
    let maxWordWidth = 0;
    
    for(let oline of pre){
      let line = {words: [], attributes: oline.attributes};
      let running = [];
      let runningWidth = 0;
      let height = 0;
      for(let part of oline.contents){
        let split = part.text.split(/\s/);
        //At least one space
        for(let i = 0; i < split.length; i++){
          let word = split[i];
          let push = {
            text: word,
            attributes: false,
            height: this.getTextHeight(this.fontFamily, this.fontSize)
          };
          //Copy Attributes
          if(part.attributes){
            push.attributes = Object.assign({}, part.attributes);
            if(push.attributes.size){
              let font = push.attributes.font || this.fontFamily;
              push.height = this.getTextHeight(font, push.attributes.size);
            }
          }
          height = Math.max(height, push.height);
          //Measure width
          this.setFontStyle(part.attributes);
          push.width = this.ctx.measureText(word).width;
          runningWidth += push.width;

          running.push(push);
          //Don't set word boundary on the end of a word
          if(i !== (split.length - 1)){
            line.words.push({
              width: runningWidth,
              parts: running,
              height: height
            });
            maxWordWidth = Math.max(maxWordWidth, runningWidth);
            running = [];
            runningWidth = 0;
          }
        }
      }
      if(running.length > 0){
        line.words.push({
          width: runningWidth,
          parts: running,
          height: height
        });
        maxWordWidth = Math.max(maxWordWidth, runningWidth);
      }
      parsed.push(line);
    }
    this.paragraphs = parsed;
    this.maxWordWidth = maxWordWidth;
    //console.log(parsed);
    return {paragraphs: parsed, maxWordWidth};
    //console.log(parsed);
  }
}