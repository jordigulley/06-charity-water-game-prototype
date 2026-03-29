class Position {
  x;
  y;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
class Entity {
  position;
  engine;
  constructor(engine) {
    engine.add_entity(this);
    this.engine = engine;
    this.position = new Position(0, 0);
  }

  update(delta) {}

  draw(canvas_ctx) {}
}

class Engine {
  running;
  canvas;
  canvas_ctx;
  entities;
  clear_color;
  last_update_timestamp = 0;
  keys_down;
  constructor() {
    this.running = false;
    this.canvas = document.getElementById("game");
    this.handle_resize();
    this.canvas_ctx = this.canvas.getContext("2d");
    this.entities = new Set();
    this.clear_color = "#1a1a1a";
    this.keys_down = new Set();
    window.addEventListener("keydown", this.handle_input.bind(this));
    window.addEventListener("keyup", this.unhandle_input.bind(this));
    window.addEventListener("resize", this.handle_resize.bind(this));
  }

  handle_resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  restart() {
    this.entities.clear();
    this.keys_down.clear();
  }

  handle_input(ev) {
    this.keys_down.add(ev.key);
  }

  unhandle_input(ev) {
    this.keys_down.delete(ev.key);
  }

  add_entity(entity) {
    this.entities.add(entity);
  }

  remove_entity(entity) {
    this.entities.delete(entity);
  }

  update(timestamp) {
    if (!this.running) {
      return;
    }
    let delta = timestamp - this.last_update_timestamp;
    this.last_update_timestamp = timestamp;
    this.canvas_ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas_ctx.fillStyle = this.clear_color;
    this.canvas_ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.entities.forEach((e) => e.update(delta));
    this.entities.forEach((e) => e.draw(this.canvas_ctx));
    window.requestAnimationFrame(this.update.bind(this));
  }

  start() {
    this.running = true;
    this.update(0);
  }
}
