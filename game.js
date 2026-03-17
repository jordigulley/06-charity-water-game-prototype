const CHARITY_WATER_COLOR = "#ffC907";
const CHARITY_WATER_BLUE = "#2E9DF7";
const MOVEMENT_SPEED = 1.25;
// Allow for more wiggle room for intersections
const INTERSECTION_PADDING = 20;
class WateringCan extends Entity {
    width
    height
    constructor(engine) {
        super(engine);
        this.width = 90;
        this.height = 50;
        this.position = new Position(engine.canvas.width / 2, engine.canvas.height - this.height * 1.25);
    }

    intersects(x, y, width, height) {
        if (x + width + INTERSECTION_PADDING < this.position.x || y + height + INTERSECTION_PADDING < this.position.y) {
            return false;
        }
        if (x > this.position.x + this.width + INTERSECTION_PADDING || y > this.position.y + this.height + INTERSECTION_PADDING) {
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
        this.position.x = Math.min(Math.max(this.position.x, 0), engine.canvas.width - this.width);
    }

    draw(canvas_ctx) {
        canvas_ctx.fillStyle = CHARITY_WATER_COLOR;
        canvas_ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        canvas_ctx.fillStyle = CHARITY_WATER_BLUE;
        let fill_amount = this.height * (score / WIN_AMOUNT);
        canvas_ctx.fillRect(this.position.x, this.position.y + this.height - fill_amount, this.width, fill_amount);
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

const CONFETTI_COLORS = ["#8BD1CB", "#4FCB53", "#FF902A", "#F5402C", "#159A48", "#F16061"];
class Confetti extends FallingParticle {
    col;
    constructor(engine) {
        super(engine);
        this.col = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length + 1)];;
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
        this.is_dirty = Math.round(Math.random()) == 1;
    }
    update(delta) {
        super.update(this.is_dirty ? delta * 0.5 : delta);
        if (score >= WIN_AMOUNT) {
            return;
        }
        if (can.intersects(this.position.x, this.position.y, 20, 20)) {
            engine.remove_entity(this);
            score = Math.max(this.is_dirty ? score - 1 : score + 1, 0);
            if (score >= WIN_AMOUNT ) {
                // engine.clear_color = "#F16061";
                window.clearInterval(spawner_interval_id);
                spawner_interval_id = window.setInterval(() => Confetti.spawn(engine), SPAWN_MS * 0.1);
                // new TextEntity(engine, "CAN FILLED", CHARITY_WATER_BLUE);
                win_condition.value = "CAN FILLED";
                win_condition.color = CHARITY_WATER_BLUE;
            }
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
    font = "12px sans-serif";
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
        this.font = "48px sans-serif";
    }
    update(delta) {
        this.value = "" + score;
        this.position.x = engine.canvas.width / 2;
        if (score >= WIN_AMOUNT) {
            this.value = "YOU WON!";
            this.color = CHARITY_WATER_COLOR;
        }
    }
}

const SPAWN_MS = 500;
let score = 0;
let engine = new Engine();
let can;
let scoretxt;
let spawner_interval_id;
let win_condition
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
    spawner_interval_id = window.setInterval(() => WaterDrop.spawn(engine), SPAWN_MS);
    can = new WateringCan(engine);
    scoretxt = new ScoreTxt(engine);
    scoretxt.position.y = 48;
    win_condition = new TextEntity(engine, "" + WIN_AMOUNT + " drops to win!", CHARITY_WATER_COLOR);
    win_condition.position = new Position(12, 24);
    let dirty = new TextEntity(engine, "Avoid dirty water!", "#a46103ff");
    dirty.position = new Position(12, 48);
    let reset_btn = new TextEntity(engine, "'R' to reset.", "#F5402C");
    reset_btn.position.x = 12;
    reset_btn.position.y = 72;
}
window.onload = init;
window.addEventListener("keypress", (ev) => {
    init();
});