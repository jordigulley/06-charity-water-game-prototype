const CHARITY_WATER_COLOR = "#ffC907";
const CHARITY_WATER_BLUE = "#2E9DF7";
const MOVEMENT_SPEED = 1.25;
// Allow for more wiggle room for intersections
const INTERSECTION_PADDING = 20;
class WateringCan extends Entity {
  width;
  height;
  img;
  constructor(engine) {
    super(engine);
    this.img = new Image();
    this.img.src = "./img/water-can-transparent.png";
    this.width = 90;
    this.height = 90;
    this.position = new Position(
      engine.canvas.width / 2,
      engine.canvas.height - this.height * 1.25,
    );
  }

  intersects(x, y, width, height) {
    if (
      x + width + INTERSECTION_PADDING < this.position.x ||
      y + height + INTERSECTION_PADDING < this.position.y
    ) {
      return false;
    }
    if (
      x > this.position.x + this.width + INTERSECTION_PADDING ||
      y > this.position.y + this.height + INTERSECTION_PADDING
    ) {
      return false;
    }
    return true;
  }

  update(delta) {
    if (engine.keys_down.has("ArrowLeft")) {
      this.position.x -= MOVEMENT_SPEED * delta;
    }
    if (engine.keys_down.has("ArrowRight")) {
      this.position.x += MOVEMENT_SPEED * delta;
    }
    this.position.x = Math.min(
      Math.max(this.position.x, 0),
      engine.canvas.width - this.width,
    );
  }

  draw(canvas_ctx) {
    if (!this.img.complete) {
      return;
    }
    const ACTUAL_IMG_SIZE_RATIO = 0.8;
    // canvas_ctx.fillStyle = CHARITY_WATER_COLOR;
    canvas_ctx.drawImage(
      this.img,
      this.position.x,
      this.position.y,
      this.width,
      this.height,
    );
    canvas_ctx.fillStyle = CHARITY_WATER_BLUE;
    let fill_amount =
      this.height * 0.8 * ACTUAL_IMG_SIZE_RATIO * (score / WIN_AMOUNT);
    canvas_ctx.fillRect(
      this.position.x + 10,
      this.position.y + this.height * ACTUAL_IMG_SIZE_RATIO - fill_amount,
      5,
      fill_amount,
    );
  }
}

class FallingParticle extends Entity {
  gravity_mult = 1;
  update(delta) {
    this.position.y += WATER_GRAVITY_SPEED * delta * this.gravity_mult;
    if (this.position.y > engine.canvas.height) {
      engine.remove_entity(this);
      return;
    }
  }
  static spawn(engine) {
    let wd = new this(engine);
    wd.position.x = Math.random() * engine.canvas.width;
    wd.position.y = -30;
    return wd;
  }
}

const CONFETTI_COLORS = [
  "#8BD1CB",
  "#4FCB53",
  "#FF902A",
  "#F5402C",
  "#159A48",
  "#F16061",
];
class Confetti extends FallingParticle {
  col;
  constructor(engine) {
    super(engine);
    this.col =
      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length + 1)];
    this.gravity_mult = 2;
  }
  draw(canvas_ctx) {
    canvas_ctx.fillStyle = this.col;
    canvas_ctx.fillRect(this.position.x, this.position.y, 20, 20);
  }
}

const WIN_AMOUNT = 12;
const WATER_GRAVITY_SPEED = 0.75;
class WaterDrop extends FallingParticle {
  is_dirty;
  constructor(engine) {
    super(engine);
    this.is_dirty =
      Math.round(
        Math.random() + SPAWNER_DIRT_DIFFICULTY_MULT.get(get_difficulty()),
      ) == 1;
  }
  update(delta) {
    super.update(this.is_dirty ? delta * 0.5 : delta);
    if (score >= WIN_AMOUNT) {
      return;
    }
    if (!can.intersects(this.position.x, this.position.y, 20, 20)) {
      return;
    }
    engine.remove_entity(this);
    score = Math.max(this.is_dirty ? score - 1 : score + 1, 0);

    const m = MILESTONES.get(score);
    if (m != undefined) {
      document.getElementById("milestone").textContent = m;
    }
    play_sound(this.is_dirty ? "err" : "good");
    if (score >= WIN_AMOUNT) {
      play_sound("win");
      // engine.clear_color = "#F16061";
      window.clearInterval(spawner_interval_id);
      spawner_interval_id = window.setInterval(
        () => Confetti.spawn(engine),
        SPAWN_MS * 0.1,
      );
      // new TextEntity(engine, "CAN FILLED", CHARITY_WATER_BLUE);
      // win_condition.value = "CAN FILLED";
      // win_condition.color = CHARITY_WATER_BLUE;
      let n = new Set();
      engine.entities.forEach((e) => {
        if (e instanceof WaterDrop) {
          return;
        }
        n.add(e);
      });
      engine.entities = n;
    }
  }

  draw(canvas_ctx) {
    canvas_ctx.fillStyle = this.is_dirty ? "#a46103ff" : CHARITY_WATER_BLUE;
    canvas_ctx.fillRect(this.position.x, this.position.y, 20, 20);
  }
}

class TextEntity extends Entity {
  value;
  color;
  font = "12px Georgia";
  constructor(engine, value = "Text", color = "#ffffff") {
    super(engine);
    this.value = value;
    this.color = color;
  }
  draw(canvas_ctx) {
    canvas_ctx.font = this.font;
    canvas_ctx.fillStyle = this.color;
    canvas_ctx.fillText(this.value, this.position.x, this.position.y);
  }
}

class ScoreTxt extends TextEntity {
  constructor(engine) {
    super(engine, "" + score, CHARITY_WATER_BLUE);
    this.font = "64px bold Georgia";
  }
  update(delta) {
    this.value = "" + score;
    this.position.x = engine.canvas.width / 2;
    if (score >= WIN_AMOUNT) {
      this.value = "YOU WIN!";
      this.color = CHARITY_WATER_COLOR;
    }
  }
}

const DIFFICULTY_NORMAL = 0;
const DIFFICULTY_EASY = 1;
const DIFFICULTY_HARD = 2;
const DIFFICULTIES = [DIFFICULTY_NORMAL, DIFFICULTY_EASY, DIFFICULTY_HARD];
let current_difficulty_index = 0;

function get_difficulty() {
  return DIFFICULTIES[current_difficulty_index];
}

function difficulty_to_str() {
  switch (DIFFICULTIES[current_difficulty_index]) {
    case DIFFICULTY_NORMAL:
      return "Normal";
      break;
    case DIFFICULTY_EASY:
      return "Easy";
      break;
    case DIFFICULTY_HARD:
      return "Hard";
      break;
  }
}

const SPAWN_MS = 500;
const SPAWNER_DIFFICULTY_MULT = new Map([
  [DIFFICULTY_EASY, 3],
  [DIFFICULTY_HARD, 2],
  [DIFFICULTY_NORMAL, 1],
]);
const SPAWNER_DIRT_DIFFICULTY_MULT = new Map([
  [DIFFICULTY_EASY, -0.3],
  [DIFFICULTY_NORMAL, 0],
  [DIFFICULTY_HARD, 0.3],
]);
let score = 0;
let engine = new Engine();
let can;
let scoretxt;
let spawner_interval_id;
// let win_condition;
let btn_click_snd;
let win_snd;
let err_snd;
let bad_snd;
let sounds = new Map([
  ["click", "./sfx/Button 3.m4a"],
  ["win", "./sfx/Notification 8.m4a"],
  ["err", "./sfx/Error 2.m4a"],
  ["good", "./sfx/Complete 2.m4a"],
]);
let loaded_snds = new Map();
function load_sounds() {
  sounds.forEach((val, key) => {
    loaded_snds.set(key, new Audio(val));
  });
}

function play_sound(key) {
  let a = loaded_snds.get(key);
  a.currentTime = 0;
  a.play();
}

const MILESTONES = new Map([
  [3, "Getting there!"],
  [6, "Halfway there!"],
  [8, "Cross the finish line!"],
  [12, "Great work!"],
]);

function init() {
  if (engine.running) {
    engine.restart();
  } else {
    engine.start();
  }
  score = 0;
  if (spawner_interval_id != undefined) {
    window.clearInterval(spawner_interval_id);
  }
  spawner_interval_id = window.setInterval(
    () => WaterDrop.spawn(engine),
    SPAWN_MS / SPAWNER_DIFFICULTY_MULT.get(get_difficulty()),
  );
  can = new WateringCan(engine);
  scoretxt = new ScoreTxt(engine);
  scoretxt.position.y = 70;
  // win_condition = new TextEntity(
  //   engine,
  //   "" + WIN_AMOUNT + " drops to win!",
  //   CHARITY_WATER_COLOR,
  // );
  // win_condition.position = new Position(40, 70);
  // let dirty = new TextEntity(engine, "Avoid dirty water!", "#a46103ff");
  // dirty.position = new Position(40, 90);
  document.getElementById("difficulty").textContent =
    "Difficulty: " + difficulty_to_str();
  // let reset_btn = new TextEntity(engine, "'R' to reset.", "#F5402C");
  // reset_btn.position.x = 12;
  // reset_btn.position.y = 72;
}

window.onload = init;

function change_difficulty() {
  current_difficulty_index++;
  if (current_difficulty_index > DIFFICULTIES.length - 1) {
    current_difficulty_index = 0;
  }
  init();
}
document.getElementById("change").addEventListener("click", (ev) => {
  change_difficulty();
  play_sound("click");
});
document.getElementById("reset").addEventListener("click", (ev) => {
  init();
  play_sound("click");
  play_sound("err");
});
load_sounds();
