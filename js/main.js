var formElements;
var Caps;

var imgsize, test, canv, imgtest;

var options = {
  background_color: "#fff",
  text_color: "#000",
  scale: 1,
  adjust: true,
  fontIndex: 1,
  fontSize: 20,
  mode: "east",
  padding: 10,
  fixedWithEnabled: false,
  fixedWidth: 1000,
  cropData: {
    x: 0,
    y: 0
  },
  deltas: {
    ops: []
  }
};

function createColorTable(){
  var colors = [];
  var coltable = document.getElementById("colors");
  var lightnesses = [0.3, 0.5, 0.8];
  for (let ltns of lightnesses) {
    let sat = 1;
    let div = 18;
    let cur = [];
    for (let i = 0; i < div; i++) {
      let hue = i * (360 / div);
      var color = chroma.hsv(hue, sat, ltns);
      cur.push(color.hex());
    }
    colors.push(cur);
  }
  //let other = "";
  for (let tab of colors) {
    var run = '<div class="table">';
    for (let pal of tab) {
      //other += `<option value="${pal}"></option>`;
      run +=
        '<div class="cell" data-col="' +
        pal +
        '" style="background-color: ' +
        pal +
        '">' +
        "</div>";
    }
    run += "</div>";
    coltable.innerHTML += run;
    coltable.addEventListener("click", function(e){
      let col = e.target.getAttribute("data-col");
      if(col){
        formElements.bgColor.picker.setColor(col);
      }
    });
  }
  //console.log(other)
}
function init(){

  imgsize = document.getElementById("imgsize");
  canv = document.getElementById("edimg");
  
  imgtest = new Image();
  imgtest.onload = function() {
    imgsize.innerHTML = imgtest.naturalHeight + "x" + imgtest.naturalWidth;
  };

  formElements = {
    fontSize: {
      el: document.getElementById("font-size")
    },
    scale: {
      el: document.getElementById("scale")
    },
    padding: {
      el: document.getElementById("padding")
    },
    compass: {
      el: document.getElementById("position-compass")
    },
    textColor: {
      el: document.getElementById("textcol")
    },
    bgColor: {
      el: document.getElementById("bgcol"),
      eyedropper: {
        el: document.getElementById("bgcoleye")
      }
    },
    fontFamily: {
      el: document.getElementById("font-select")
    },
    image: {
      el: document.getElementById("image-sel")
    },
    text: {
      el: document.getElementById("text")
    },
    adjustImage: {
      el: document.getElementById("adjust")
    },
    fixedWidth: {
      toggleEl: document.getElementById("fixed-width-toggle"),
      el: document.getElementById("fixed-width"),
      wrapper: document.getElementById("fixed-width-wrapper")
    },
    submitButton: {
      el: document.getElementById("getresult")
    },
    cropper: {
      el: document.getElementById("crop"),
      options: {
        movable: false,
        rotateable: false,
        scalable: false,
        zoomable: false,
        viewMode: 2,
        cropend(event) {
          //console.log(event.detail);
          options.cropData = formElements.cropper.instance.getData(true);
          updateOptions();
        }
      }
    }
  };

  Caps = new Captioneer(canv);

  formElements.textColor.picker = new Picker({ parent: formElements.textColor.el });
  formElements.bgColor.picker = new Picker({ parent: formElements.bgColor.el });

  var Font = Quill.import('formats/font');
  var SizeStyle = Quill.import('attributors/style/size');
  SizeStyle.whitelist = null;

  Font.whitelist = [false, 'Arial', 'Roboto-Slab', 'Roboto', 'Open-Sans', 'Thasadith', 'Oswald', 'Source-Sans-Pro', 'Indie-Flower', 'Shadows-into-Light'];
  Quill.register(Font, true);
  Quill.register(SizeStyle, true);


  formElements.text.quill = new Quill(formElements.text.el, {
    placeholder: "Enter text here...",
    formats: ["bold", "italic", "underline", "strike", "script", "font", "color", "align", "size", "font-size"],
    theme: "snow",
    modules: {
      toolbar: {
        container: '#text-toolbar'
      }
    }
  });
  console.log(Caps);
  loadValues();
  addListeners();
}

function loadValues(){
  localforage.getItem("options").then(function(val){
    if(!val)return;
    options = Object.assign(options, val);
    if(options.fixedWidthEnabled){
      formElements.fixedWidth.wrapper.style.display = options.fixedWidthEnabled ? 'initial' : 'none';
    }
    if(options.deltas){
      formElements.text.quill.setContents(options.deltas);
    }
    if(options.cropData){
      formElements.cropper.options.data = options.cropData;
    }
    formElements.scale.el.value = options.scale;
    formElements.fontFamily.el.selectedIndex = options.fontIndex;
    formElements.fixedWidth.el.value = options.fixedWidth;
    formElements.fontSize.el.value = options.fontSize;
    formElements.padding.el.value = options.padding;
    formElements.bgColor.picker.setColor(options.background_color);
    formElements.textColor.picker.setColor(options.text_color);

    setTimeout(function(){
      formElements.bgColor.picker.setColor(options.background_color);
      formElements.textColor.picker.setColor(options.text_color);
    },0);
    
    formElements.text.quill.container.style.fontFamily = formElements.fontFamily.el.value;
    
    let el = formElements.compass.el.querySelector('.cell[data-pos="' + options.mode + '"]');
    if (el) {
      el.classList.add("active");
      formElements.compass.lastActive = el;
    }
  }).catch(function (err){
    console.log(err);
  });

  localforage.getItem("img").then(function(src){
    if(!src)return;
    imgtest.src = src;
    formElements.cropper.el.src = src;
    formElements.cropper.instance = new Cropper(formElements.cropper.el,formElements.cropper.options);
    setTimeout(updateOptions, 100);
  }).catch(function (err){
    console.log(err);
  });

  /*
  if (localStorage.getItem("img")) {
    let src = localStorage.getItem("img");
    imgtest.src = src;
    formElements.cropper.el.src = src;
    formElements.cropper.instance = new Croppr(formElements.cropper.el,formElements.cropper.options);
    
    setTimeout(updateOptions, 100);
  }*/
  
  /*if (localStorage.getItem("options")) {
    options = JSON.parse(localStorage.getItem("options"));
    /*if(options.cropRaw && formElements.cropper.instance){
      console.log(options.cropRaw, "t");
     setTimeout(function(){
         formElements.cropper.instance.resizeTo(options.cropRaw.width, options.cropRaw.height);
     }, 220); 
    }
  }
  if(options.fixedWidthEnabled){
    formElements.fixedWidth.wrapper.style.display = options.fixedWidthEnabled ? 'initial' : 'none';
  }

 if(options.deltas){
    formElements.text.quill.setContents(options.deltas);
 }
  formElements.scale.el.value = options.scale;
  formElements.fontFamily.el.selectedIndex = options.fontIndex;
  formElements.fixedWidth.el.value = options.fixedWidth;
  formElements.fontSize.el.value = options.fontSize;
  formElements.padding.el.value = options.padding;
  formElements.bgColor.picker.setColor(options.background_color);
  formElements.textColor.picker.setColor(options.text_color);
  setTimeout(function(){
    formElements.bgColor.picker.setColor(options.background_color);
    formElements.textColor.picker.setColor(options.text_color);
  },0);
  
  formElements.text.quill.container.style.fontFamily = formElements.fontFamily.el.value;
  
  let el = formElements.compass.el.querySelector('.cell[data-pos="' + options.mode + '"]');
  if (el) {
    el.classList.add("active");
    formElements.compass.lastActive = el;
  }*/
}

function addListeners() {

  formElements.fixedWidth.toggleEl.addEventListener("input", function(e){
    options.fixedWidthEnabled = e.target.checked;
    formElements.fixedWidth.wrapper.style.display = options.fixedWidthEnabled ? 'inherit' : 'none';
    updateOptions();
  });
  formElements.fixedWidth.el.addEventListener("input", function(e){
    options.fixedWidth = e.target.value;
    updateOptions();
  });

  formElements.text.quill.on("text-change", function(){
    let quill = formElements.text.quill;
    //options.text = quill.getText();
    let contents = quill.getContents();
    //console.log(contents);
    options.deltas = contents;
    updateOptions();
  });
  
  formElements.textColor.picker.onChange = function(color) {
    localStorage.setItem("fontcol", color.rgbaString);
    options.text_color = color.rgbaString;
    formElements.textColor.el.previousElementSibling.style.background =
      color.rgbaString;
    formElements.text.quill.container.style.color = color.rgbaString;
    updateOptions();
  };

  formElements.bgColor.picker.onChange = function(color) {
    localStorage.setItem("bgcol", color.rgbaString);
    options.background_color = color.rgbaString;
    formElements.bgColor.el.previousElementSibling.style.background =
      color.rgbaString;
    formElements.text.quill.container.style.background = color.rgbaString;
    updateOptions();
  };

  formElements.bgColor.eyedropper.el.addEventListener("click", function(e) {
    if (!Caps.eyedropperEnabled) e.stopPropagation();
    Caps.eyedropperEnabled = true;
    Caps.eyedropperCallback = function(col) {
      formElements.bgColor.picker.setColor(Array.from(col));
    };
  });

  formElements.compass.el.addEventListener(
    "click",
    function(e) {
      var t = e.target;
      if (t.classList.contains("cell")) {
        t.classList.add("active");
        if (formElements.compass.lastActive) {
          formElements.compass.lastActive.classList.remove("active");
        }
        formElements.compass.lastActive = t;
        let val = t.getAttribute("data-pos");
        localStorage.setItem("mode", val);
        options.mode = val;
        updateOptions();
      }
    },
    false
  );

  formElements.padding.el.addEventListener(
    "input",
    function(e) {
      var val = parseFloat(e.target.value);
      if (isFinite(val)) {
        options.padding = val;
        localStorage.setItem("padding", val);
        updateOptions();
      } else {
        val = 1;
      }
    },
    false
  );

  formElements.scale.el.addEventListener(
    "input",
    function(e) {
      var val = parseFloat(e.target.value);
      if (isFinite(val)) {
        
        imgsize.innerHTML = imgtest.naturalWidth * val + "x" + imgtest.naturalHeight * val;
        options.scale = val;
        updateOptions();
      } else {
        val = 1;
      }
    },
    false
  );

  formElements.image.el.addEventListener(
    "change",
    function(e) {
      var reader = new FileReader();
      reader.onload = function(event) {
        let img = event.target.result;
        if (!formElements.cropper.instance) {
          formElements.cropper.el.src = img;
          formElements.cropper.instance = new Croppr(formElements.cropper.el, formElements.cropper.options);
        } else {
          formElements.cropper.instance.replace(img);
        }
        localforage.setItem("img", img);
        imgtest.src = img;
      };
      reader.readAsDataURL(e.target.files[0]);
    },
    false
  );

  formElements.adjustImage.el.addEventListener(
    "change",
    function(e) {
      options.adjust = e.target.checked ? true : false;
      updateOptions();
    },
    false
  );

  formElements.submitButton.el.addEventListener(
    "click",
    function() {
      //result.src = Caps.getDataURL();
      //result.classList.toggle("invisible");
      let uri = Caps.getDataURL();
      var win = window.open(uri, '_blank');
      win.focus();
      //Caps.canv.classList.toggle("invisible");
    },
    false
  );
  formElements.fontSize.el.addEventListener(
    "input",
    function(e) {
      options.fontSize = e.target.value;
      updateOptions();
    },
    false
  );

  formElements.fontFamily.el.addEventListener(
    "change",
    function(e) {
      options.fontIndex = e.target.selectedIndex;
      formElements.text.quill.container.style.fontFamily = formElements.fontFamily.el.value;
      
      updateOptions();
    },
    false
  );
  
}

function updateOptions(){
  localforage.setItem("options", options);
  
  if(formElements.cropper.instance){
    Caps
      .setDeltas(options.deltas)
      .setFixedWidth(options.fixedWidthEnabled, options.fixedWidth)
      .setImage(formElements.cropper.el, options.cropData, options.scale)
      .setFont(formElements.fontFamily.el.value, options.fontSize)
      .setPadding(options.padding)
      .setTextColor(options.text_color)
      .setAdjustImageSize(options.adjust)
      .setMode(options.mode)
      .setBackground(options.background_color)
      .draw();
  }
}

window.addEventListener("load", function(){
  createColorTable();
  init();
});