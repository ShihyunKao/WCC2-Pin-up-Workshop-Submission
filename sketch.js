let particles = [];
let synth, reverb;
let currentInput = ""; 
let audioStarted = false;
let bgLayer; 
let textShakeAmt = 0; 

// Four-season theme configuration: defining colors, gravity, resistance, flow field parameters, and shapes
const THEMES = [
  { 
    name: "Deep Ocean", 
    hMin: 180, hMax: 240, s: 70, b: 90, 
    gravity: -0.02, drag: 0.95, flowScale: 0.005, shape: 'circle'
  },
  { 
    name: "Sakura", 
    hMin: 330, hMax: 360, s: 40, b: 100, 
    gravity: 0.03, drag: 0.98, flowScale: 0.01, spin: true, shape: 'petal'
  },
  { 
    name: "Aurora", 
    hMin: 120, hMax: 170, s: 80, b: 90, 
    gravity: 0, drag: 0.92, flowScale: 0.003, shape: 'line'
  },
  { 
    name: "Sunset", 
    hMin: 10, hMax: 40, s: 80, b: 95, 
    gravity: -0.05, drag: 0.96, flowScale: 0.008, shape: 'shimmer'
  }
];

let currentThemeIndex = 0; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  
  // Initialize the off-screen buffer layer for drawing background trajectories
  bgLayer = createGraphics(width, height);
  bgLayer.colorMode(HSB, 360, 100, 100, 100);
  bgLayer.noStroke();
  
  // Audio system: synthesizer + reverb
  synth = new p5.PolySynth();
  reverb = new p5.Reverb();
  reverb.process(synth, 3, 2); 
  
  textFont('Georgia'); 
  textAlign(CENTER, CENTER);
  noCursor(); 
}

function draw() {
  // Dark transparent background, retaining the trajectory overlay effect
  background(230, 60, 5, 5); 
  
  // Show the background layer
  image(bgLayer, 0, 0);
  
  blendMode(ADD);

  // Randomly generate environmental particles
  if (frameCount % 5 === 0) spawnAmbientParticle();

  // Update all particles
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    p.display();
    if (p.isDead()) particles.splice(i, 1);
  }

  blendMode(BLEND); 
  drawCurrentText();
  drawUI();
}

function keyTyped() {
  // Initiate the audio context on first interaction
  if (!audioStarted) {
    userStartAudio();
    audioStarted = true;
  }
  
  if (key !== 'Enter') {
    currentInput += key;
    
    // Map keys to pentatonic scales
    let scale = [48, 50, 52, 55, 57, 60, 62, 64, 67, 69]; 
    let noteIndex = key.charCodeAt(0) % scale.length;
    let midiNote = scale[noteIndex] + (currentThemeIndex * 2);
    
    synth.play(midiToFreq(midiNote), 0.15, 0, 0.3);
    spawnSparkle(width/2 + textWidth(currentInput)/2, height/2);
    
    // Trigger text vibration
    textShakeAmt = 5; 
  }
}

function keyPressed() {
  if (keyCode === ENTER) {
    if (currentInput.length > 0) {
      explodeText(currentInput); // Text disintegration
      
      // Play the release sound effect
      synth.play(midiToFreq(48 + currentThemeIndex * 2), 0.4, 0, 2.0);
      synth.play(midiToFreq(55 + currentThemeIndex * 2), 0.4, 0.1, 2.0);
      
      currentInput = "";
      changeTheme(); // Switch themes
    }
  } else if (keyCode === BACKSPACE) {
    currentInput = currentInput.substring(0, currentInput.length - 1);
  }
}

function changeTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
}

function spawnAmbientParticle() {
  let theme = THEMES[currentThemeIndex];
  // Determine the generation position according to the direction of gravity
  let startY = (theme.gravity > 0) ? -10 : height + 10;
  if (theme.gravity === 0) startY = random(height);
  
  let p = new SeasonParticle(random(width), startY, theme);
  p.isAmbient = true; 
  particles.push(p);
}

function explodeText(txt) {
  let totalW = textWidth(txt);
  let startX = width/2 - totalW/2;
  let theme = THEMES[currentThemeIndex];
  
  // Traverse the text to generate particle clusters
  for (let i = 0; i < txt.length; i++) {
    let charW = textWidth(txt.charAt(i));
    let charX = startX + charW/2; 
    startX += charW;
    
    for (let j = 0; j < 35; j++) { 
      particles.push(new SeasonParticle(charX, height/2, theme));
    }
  }
}

function spawnSparkle(x, y) {
  let theme = THEMES[currentThemeIndex];
  for(let i=0; i<4; i++){
     particles.push(new SeasonParticle(x, y, theme, false, true)); 
  }
}

function drawCurrentText() {
  let theme = THEMES[currentThemeIndex];
  fill(theme.hMin, 20, 100, 100); 
  noStroke();
  textSize(60);
  textStyle(ITALIC); 
  
  // Text vibration effect
  let xOffset = random(-textShakeAmt, textShakeAmt);
  let yOffset = random(-textShakeAmt, textShakeAmt);
  text(currentInput, width/2 + xOffset, height/2 + yOffset);
  
  if (textShakeAmt > 0) textShakeAmt *= 0.9;
  
  // The cursor is blinking
  if (frameCount % 60 < 30) {
    let w = textWidth(currentInput);
    stroke(255, 100);
    strokeWeight(1);
    line(width/2 + w/2 + 10 + xOffset, height/2 - 20 + yOffset, width/2 + w/2 + 10 + xOffset, height/2 + 20 + yOffset);
  }
}

function drawUI() {
  fill(255, 60);
  noStroke();
  textSize(14);
  textStyle(NORMAL);
  textAlign(CENTER);
  if (!audioStarted) {
    text("Click anywhere to begin", width/2, height - 40);
  } else {
    let name = THEMES[currentThemeIndex].name.split('').join(' ');
    text(name.toUpperCase(), width/2, height - 40);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Reset the background layer and retain the original image
  let oldBg = bgLayer;
  bgLayer = createGraphics(windowWidth, windowHeight);
  bgLayer.colorMode(HSB, 360, 100, 100, 100);
  bgLayer.image(oldBg, 0, 0);
}


// SeasonParticle Class (Particle Class)

class SeasonParticle {
  constructor(x, y, theme, isAmbient = false, isSparkle = false) {
    this.pos = createVector(x, y);
    this.theme = theme;
    this.isAmbient = isAmbient;
    this.isSparkle = isSparkle;
    
    // Initial velocity and direction
    this.vel = p5.Vector.random2D().mult(random(0.5, 2.0));
    if (isAmbient) {
      this.vel.y = (theme.gravity > 0) ? random(1, 3) : random(-1, -3);
      this.vel.x = random(-1, 1);
    }
    this.acc = createVector(0, 0);
    
    this.hue = random(theme.hMin, theme.hMax);
    this.life = 255;
    
    // Set different life decay rates
    if (isSparkle) this.decay = random(5, 10);
    else if (isAmbient) this.decay = random(0.5, 1.2); 
    else this.decay = random(0.8, 2); 
    
    this.angle = random(TWO_PI);
    this.spinSpeed = (theme.spin) ? random(-0.1, 0.1) : 0;
    this.size = random(2, 5);
  }

  update() {
    // 1. Apply gravity
    this.acc.add(createVector(0, this.theme.gravity));
    
    // 2. Apply Berlin noise flow field
    let n = noise(this.pos.x * this.theme.flowScale, this.pos.y * this.theme.flowScale, frameCount * 0.002);
    let flowAngle = n * TWO_PI * 2;
    let flow = p5.Vector.fromAngle(flowAngle);
    flow.mult(0.05);
    this.acc.add(flow);
    
    // 3. Update location
    this.vel.add(this.acc);
    this.vel.mult(this.theme.drag); 
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    this.angle += this.spinSpeed;
    this.life -= this.decay;
    
    // 4. Draw the trajectory on the background layer (accumulation effect)
    if (!this.isSparkle && this.life < 200 && random() < 0.3) {
      bgLayer.noStroke();
      let alpha = this.isAmbient ? 2 : 4; 
      bgLayer.fill(this.hue, 60, 80, alpha);
      bgLayer.circle(this.pos.x, this.pos.y, 1.5);
    }
  }

  display() {
    noStroke();
    let alpha = map(this.life, 0, 255, 0, 100);
    fill(this.hue, 60, 100, alpha); 
    
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    
    // Draw different shapes according to the theme
    if (this.theme.shape === 'petal') {
      ellipse(0, 0, this.size, this.size * 1.5); 
    } else if (this.theme.shape === 'line') {
      rectMode(CENTER);
      rect(0, 0, this.size * 3, this.size * 0.5);
    } else {
      circle(0, 0, this.size);
    }
    pop();
  }

  isDead() {
    return this.life < 0 || this.pos.y < -50 || this.pos.y > height + 50;
  }
}