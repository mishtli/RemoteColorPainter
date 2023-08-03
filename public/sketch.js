// Create connection to Node.JS Server
const socket = io();
let rSlider, gSlider, bSlider, colorSwatch, sizeSlider;
let r = 255;
let g = 0;
let b = 100;
let bSize = 30;

let canvas;
let gui; 
let drawIsOn = false;

let recievedMouseX = 0;
let recievedMouseY = 0;

let button;

let colon;
let splat;
let splats = [];
let textos = {}; 
// textos es un objeto en lugar de un array 
// para asociar cada texto al ID de un socket
// y evitar un conflicto de sobreescritura por indice en el array
let textPos;
let texto = '';

function preload() {
  colon = loadImage('colon.jpeg');
  splat = loadImage('splat.png')
}

function setup() {
  //Currently we make other people's drawing fit into our canvas, so when on portrait resolutions vs landscape things will look a little different/distorted
  //ratio fix... but then need to make a bunch of other UX decisions like whether you zoom into the canvas or center it somehow
  // if(windowWidth > windowHeight){
  //   canvas = createCanvas(windowWidth, windowWidth);
  // }else{
  //   canvas = createCanvas(windowHeight, windowHeight);
  // }

  colon.loadPixels();
  splat.loadPixels();

  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-container"); 
  // Reemplzamos la funcion canvasMousePressed 
  // por una nueva function addSplat
  canvas.mousePressed(addSplat); 
  //canvas.mousePressed(canvasMousePressed); 
  canvas.touchStarted(addSplat);
  //canvas.touchStarted(canvasMousePressed); 

  //gui = select("#gui-container");
  //gui.addClass("open");//forcing it open at the start, remove if you want it closed

  /*
  colorSwatch = createDiv("");
  colorSwatch.parent(gui);
  colorSwatch.addClass("color-swatch");

  rSlider = createSlider(0, 255, r);
  rSlider.parent(gui);
  rSlider.addClass("slider");
  gSlider = createSlider(0, 255, g);
  gSlider.parent(gui);
  gSlider.addClass("slider");
  bSlider = createSlider(0, 255, b);
  bSlider.parent(gui);
  bSlider.addClass("slider");
  sizeSlider = createSlider(1,100, bSize);
  sizeSlider.parent(gui);
  sizeSlider.addClass("slider");


  rSlider.input(handleSliderInputChange);
  gSlider.input(handleSliderInputChange);
  bSlider.input(handleSliderInputChange);
  sizeSlider.input(handleSliderInputChange);
  
  //call this once at start so the color matches our mapping to slider width
  handleSliderInputChange();

  button = createButton(">");
  button.addClass("button");

  //Add the play button to the parent gui HTML element
  button.parent(gui);
  
  //Adding a mouse pressed event listener to the button 
  button.mousePressed(handleButtonPress); 
  */

  //background(255);
  noStroke();
}

function draw() {

  //image(colon, 0, 0)

  if(drawIsOn){
    fill(r,g,b);
    circle(mouseX,mouseY,bSize);
  }

  splats.forEach(data => {
    push()
    angleMode(DEGREES)
    translate(data.x + (data.w / 2), data.y + (data.h / 2))
    rotate(data.rotation)
    imageMode(CENTER);
    image(splat, 0, 0, data.w, data.h)
    pop()
  })

  for(socketId in textos) {
    push()
    fill(255)
    text(textos[socketId].texto, textos[socketId].x, textos[socketId].y)
    pop()
  }

}

function keyPressed() {
  //console.log(keyCode, key)
  //console.log(socket.id)
  
  var valid = 
        (keyCode > 47 && keyCode < 58)   || // number keys
        //keyCode == 32 || keyCode == 13   || // spacebar & return key(s) (if you want to allow carriage returns)
        keyCode ==32 ||
        (keyCode > 64 && keyCode < 91)   || // letter keys
        (keyCode > 95 && keyCode < 112)  || // numpad keys
        (keyCode > 185 && keyCode < 193) || // ;=,-./` (in order)
        (keyCode > 218 && keyCode < 223);

  if(valid) {
    texto += key
    textos[socket.id] = {
      texto: texto,
      x: textPos.x,
      y: textPos.y
    }
    
    socket.emit("texto", {
      textos: textos
    });
  }
}

//we only want to draw if the click is on the canvas not on our GUI
/*
function canvasMousePressed(){
  drawIsOn = true;
}

function mouseReleased(){
  drawIsOn = false;
}

function mouseDragged() {

  //don't emit if we aren't drawing on the canvas
  if(!drawIsOn){
    return;
  }

  socket.emit("drawing", {
    xpos: mouseX / width,
    ypos: mouseY / height,
    userR: r,
    userG: g,
    userB: b,
    // userS: bSize / width //scaling brush size to user window
    userS: bSize 
  });

}
*/

//make it work on mobile
function canvasTouchStarted(){
  drawIsOn = true;
}

function touchEnded(){
  drawIsOn = false;
}

function touchMoved() {
  if(!drawIsOn){
    return;
  }
  
  socket.emit("drawing", {
    xpos: mouseX / width,
    ypos: mouseY / height,
    userR: r,
    userG: g,
    userB: b,
    // userS: bSize / width //scaling brush size to user window
    userS: bSize 
  });
  
}

// canvasMousePressed
/*
function onDrawingEvent(data){
  fill(data.userR,data.userG,data.userB);
  //circle(data.xpos * width,data.ypos * height,data.userS * width);//scaling brush size to user window
  circle(data.xpos * width,data.ypos * height,data.userS);//slightly nicer on mobile
}
*/

function onDrawingEvent(data) {
  splats = data.splats
}

function onTextEvent(data) {
  textos = data.textos
  console.log(textos)
}

function handleButtonPress()
{
  gui.toggleClass("open");
}

function handleSliderInputChange(){
  r = map(rSlider.value(),0,rSlider.width,0,255);
  g = map(gSlider.value(),0,gSlider.width,0,255);
  b = map(bSlider.value(),0,bSlider.width,0,255);
  bSize = sizeSlider.value();

  colorSwatch.style("background-color","rgb("+r+","+g+","+b+")");
}

// Nueva funcion addSplat
// dibuja una mancha con tamaño y rotación aleatoreas
// y la añade al array de manchas
function addSplat() {
  let variacion = random(0.8, 1.6) // definimos rango de variacion de tamaño
  // multiplicamos el tamaño por la variación
  let newW = 100 * variacion 
  let newH = 100 * variacion

  let newSplat = {
    x: mouseX - (newW / 2), 
    y: mouseY - (newH / 2),
    w: newW,
    h: newH,
    rotation: random(0, 360),
    //rotation: 0
  }
  //console.log(newSplat.rotation)
  splats.push(newSplat)
  socket.emit("drawing", {
    splats: splats
  });
}

//Events we are listening for
function windowResized() {

  //wipes out the history of drawing if resized, potential fix, draw to offscreen buffer
  //https://p5js.org/reference/#/p5/createGraphics
  // resizeCanvas(windowWidth, windowHeight);

  //ratio fix... but then need to make a bunch of other UX decisions like whether you zoom into the canvas or center it somehow
  // if(windowWidth > windowHeight){
  //   resizeCanvas(windowWidth, windowWidth);
  // }else{
  //   resizeCanvas(windowHeight, windowHeight);
  // }
}

// Connect to Node.JS Server
socket.on("connect", () => {
  console.log(socket.id);
  textPos = {
    x: random(windowWidth),
    y: random(windowHeight)
  }
  console.log(textPos)
});

// Callback function on the event we disconnect
socket.on("disconnect", () => {
  console.log(socket.id);
});

// Callback function to recieve message from Node.JS
socket.on("drawing", (data) => {
  console.log(data);

  onDrawingEvent(data);

});

socket.on("texto", (data) => {
  console.log(data);

  onTextEvent(data);

});