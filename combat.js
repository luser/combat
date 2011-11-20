window.requestAnimFrame = (function(){
          return  window.requestAnimationFrame       || 
                  window.webkitRequestAnimationFrame || 
                  window.mozRequestAnimationFrame    || 
                  window.oRequestAnimationFrame      || 
                  window.msRequestAnimationFrame     || 
                  function(/* function */ callback, /* DOMElement */ element){
                    window.setTimeout(callback, 1000 / 60);
                  };
    })();

// box2d world state
var world;
// game state
var game;
// rendering backend
var renderer;
var players = [];
var SCALE = 30;
var WORLD_WIDTH = 640;
var WORLD_HEIGHT = 480;

var   b2Vec2 = Box2D.Common.Math.b2Vec2
,  b2AABB = Box2D.Collision.b2AABB
,	b2BodyDef = Box2D.Dynamics.b2BodyDef
,	b2Body = Box2D.Dynamics.b2Body
,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
,	b2Fixture = Box2D.Dynamics.b2Fixture
,	b2World = Box2D.Dynamics.b2World
,	b2MassData = Box2D.Collision.Shapes.b2MassData
,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
,	b2EdgeChainDef = Box2D.Collision.Shapes.b2EdgeChainDef
,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
,  b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
;

function Game(world, width, height) {
  this.world = world;
  this.width = width;
  this.height = height;
  this.players = [];
  this.blocks = [];
  this.bullets = [];
  var listener = new Box2D.Dynamics.b2ContactListener;
  var self = this;
  listener.BeginContact = function(contact) {
    self.beginContact(contact.GetFixtureA().GetBody().GetUserData(),
                      contact.GetFixtureB().GetBody().GetUserData());
  };
  this.world.SetContactListener(listener);
}

Game.prototype = {
  addStaticBox: function addStaticBox(opts) {
    var fixDef = new b2FixtureDef;
    fixDef.density = 1.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;

    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_staticBody;

    var x = opts.x || 0;
    var y = opts.y || 0;
    var width = opts.width || 10;
    var height = opts.height || 10;
    // positions the center of the object (not upper left!)
    bodyDef.position.x = (x + width/2) / SCALE;
    bodyDef.position.y = (y + height/2) / SCALE;

    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox((width/2) / SCALE, (height/2) / SCALE);
    this.world.CreateBody(bodyDef).CreateFixture(fixDef);
    this.blocks.push(new Block(x, y, width, height));
  },

  addWalls: function addWalls() {
    var fixDef = new b2FixtureDef;
    fixDef.density = 1.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;

    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.position.x = 0;
    bodyDef.position.y = 0;
    var body = world.CreateBody(bodyDef);

    var wallShape = new b2PolygonShape();
    fixDef.shape = wallShape;
    // top
    wallShape.SetAsEdge(new b2Vec2(0, this.height/SCALE), new b2Vec2(this.width/SCALE, this.height/SCALE));
    body.CreateFixture(fixDef);
    // bottom
    wallShape.SetAsEdge(new b2Vec2(0, 0), new b2Vec2(this.width/SCALE, 0));
    body.CreateFixture(fixDef);
    // left
    wallShape.SetAsEdge(new b2Vec2(0, 0), new b2Vec2(0, this.height/SCALE));
    body.CreateFixture(fixDef);
    // right
    wallShape.SetAsEdge(new b2Vec2(this.width/SCALE, 0), new b2Vec2(this.width/SCALE, this.height/SCALE));
    body.CreateFixture(fixDef);
  },

  addPlayer: function addPlayer(input) {
    var fixDef = new b2FixtureDef;
    fixDef.density = 1.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;

    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_dynamicBody;
    var radius = 0.5;
    fixDef.shape = new b2CircleShape(radius);
    bodyDef.position = this.getRandomPosition();
    bodyDef.linearDamping = 10.0;
    bodyDef.angularDamping = Infinity;
    var body = world.CreateBody(bodyDef);
    var player = new Player(body, radius*SCALE, input);
    player.id = Player.nextID++;
    body.CreateFixture(fixDef);
    body.SetUserData(player);
    this.players.push(player);
    addToScoreboard(player);
    return player;
  },

  getRandomPosition: function getRandomPosition() {
    return new b2Vec2((Math.random() * this.width) / SCALE,
                      (Math.random() * this.height) / SCALE);
  },

  removePlayer: function removePlayer(index) {
    this.world.DestroyBody(this.players[index].body);
    this.players.splice(index, 1);
  },

  run: function run() {
    for (var i = 0; i < this.players.length; i++) {
      this.players[i].checkInput();
      this.players[i].applyInput();
    }
    this.world.Step(
      1 / 60   //frame-rate
      ,  10       //velocity iterations
      ,  10       //position iterations
    );
    this.world.ClearForces();

    for (i = 0; i < this.players.length; i++) {
      var p = this.players[i];
      p.syncPosition();
      p.checkSpin();
    }

    for (i = this.bullets.length - 1; i >= 0; i--) {
      if (this.bullets[i].dead) {
        this.world.DestroyBody(this.bullets[i].body);
        this.bullets[i].owner.numShots--;
        this.bullets.splice(i, 1);
        continue;
      }
      this.bullets[i].syncPosition();
    }
  },

  keyInput: function keyInput(inputName, pressed) {
    for (var i = 0; i < this.players.length; i++) {
      if (this.players[i].input == 'key') {
        this.players[i].keyState[inputName] = pressed;
        break;
      }
    }
  },

  beginContact: function beginContact(a, b) {
    if (a instanceof Bullet) {
      a.hits++;
      if (a.hits == Bullet.MAX_RICOCHET + 1) {
        a.dead = true;
      }
      if (b instanceof Player) {
        a.dead = true;
        b.hit(a.owner);
      }
    }
    if (b instanceof Bullet) {
      b.hits++;
      if (b.hits == Bullet.MAX_RICOCHET + 1) {
        b.dead = true;
      }
      if (a instanceof Player) {
        b.dead = true;
        a.hit(b.owner);
      }
    }
  }
};

function Player(body, radius, input) {
  this.body = body;
  this.radius = radius;
  this.input = input;
  this.score = 0;
  this.lastFire = 0;
  this.numShots = 0;
  this.health = Player.HEALTH;
  this.spinning = false;
  this.spinEnd = 0;
  this.keyState = {'forward': false,
                  'back': false,
                  'left': false,
                  'right': false,
                  'fire': false};
  this.color = Player.colors[Player.nextColor++];
  this.syncPosition();
}

// Statics
Player.ACCELERATION = 10;
Player.HEALTH = 1;
Player.MAX_SPEED = 5;
Player.MAX_SHOTS = 3; // number of shots in play per-player
Player.FIRE_COOLDOWN = 500; // milliseconds between shots
Player.SPIN_TIME = 1500;
Player.colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"];
Player.nextColor = 0;
Player.nextID = 0;

Player.prototype = {
  toString: function toString() {
    return "[Player]";
  },

  getSpeed: function getSpeed() {
    return this.body.GetLinearVelocity().Length();
  },

  getAngleVec: function getAngleVec(length) {
    var a = this.body.GetAngle();
    var v = new b2Vec2(Math.cos(a) * length,
                       Math.sin(a) * length);
    return v;
  },

  checkInput: function checkInput() {
    if (this.input == 'key')
      return;

    this.keyState['forward'] = (this.input.axes.Left_Stick_Y + 0.1) < 0 || this.input.buttons.Pad_Up;
    this.keyState['back'] = (this.input.axes.Left_Stick_Y - 0.1) > 0 || this.input.buttons.Pad_Down;
    this.keyState['left'] = (this.input.axes.Left_Stick_X + 0.1) < 0 || this.input.buttons.Pad_Left;
    this.keyState['right'] = (this.input.axes.Left_Stick_X - 0.1) > 0 || this.input.buttons.Pad_Right;
    this.keyState['fire'] = this.input.buttons.A_Button || this.input.buttons.Right_Trigger_1;
  },

  applyInput: function applyInput() {
    if (this.spinning) {
      return;
    }

    var speed = this.getSpeed();
    if (this.keyState['forward'] && speed < Player.MAX_SPEED) {
      this.body.ApplyForce(this.getAngleVec(Player.ACCELERATION),
                           this.body.GetWorldCenter());
    }
    else if (this.keyState['back'] && speed < Player.MAX_SPEED) {
      this.body.ApplyForce(this.getAngleVec(-1 * Player.ACCELERATION),
                           this.body.GetWorldCenter());
    }
    if (this.keyState['left']) {
      this.body.SetAngle(this.body.GetAngle() - Math.PI/360);
    }
    else if (this.keyState['right']) {
      this.body.SetAngle(this.body.GetAngle() + Math.PI/360);
    }

    if (this.keyState['fire']) {
      var now = Date.now();
      if (this.lastFire + Player.FIRE_COOLDOWN < now &&
          this.numShots < Player.MAX_SHOTS) {
        this.lastFire = now;
        this.fire();
      }
    }
  },

  syncPosition: function syncPosition() {
    var d = this.body.GetDefinition();
    this.x = d.position.x * SCALE;
    this.y = d.position.y * SCALE;
  },

  checkSpin: function checkSpin() {
    if (this.spinning) {
      if (this.spinEnd == 0) {
        this.spinEnd = Date.now() + Player.SPIN_TIME;
        // Start spinning
        this.body.SetAngularVelocity(Math.PI * 8);
        this.body.SetAngularDamping(0);
        // Respawn
        this.body.SetPosition(game.getRandomPosition());
      }
      else if (this.spinEnd < Date.now()) {
        this.spinning = false;
        this.spinEnd = 0;
        this.body.SetAngularDamping(Infinity);
        this.health = Player.HEALTH;
      }
    }
  },

  fire: function fire() {
    this.numShots++;
    spawnBullet(this);
  },

  hit: function hit(other) {
    if (this.spinning) {
      return;
    }
    if (other != this) {
      other.score++;
      updateScore(other);
    }
    this.health--;
    if (this.health == 0) {
      this.spinning = true;
    }
  }
};

function Block(x, y, width, height, color) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.color = color || "#000000";
};

function Bullet(body, owner) {
  this.body = body;
  this.owner = owner;
  this.hits = 0;
  this.dead = false;
  this.syncPosition();
}

Bullet.MAX_RICOCHET = 1; // number of times shots can bounce

Bullet.prototype ={
  toString: function() {
    return "[Bullet]";
  },

  syncPosition: function syncPosition() {
    var d = this.body.GetDefinition();
    this.x = d.position.x * SCALE;
    this.y = d.position.y * SCALE;
  }
};

function spawnBullet(player) {
  var fixDef = new b2FixtureDef;
  fixDef.density = 100.0;
  fixDef.friction = 0.5;
  fixDef.restitution = 0.9;

  var bodyDef = new b2BodyDef;
  bodyDef.type = b2Body.b2_dynamicBody;
  bodyDef.bullet = true;
  fixDef.shape = new b2CircleShape(0.1);

  // Spawn just outside the player in the angle they're facing
  var pos = player.body.GetWorldCenter().Copy();
  var size = player.body.GetFixtureList().GetShape().GetRadius();
  var vec = player.getAngleVec(size + 0.2);
  pos.Add(vec);
  bodyDef.position.x = pos.x;
  bodyDef.position.y = pos.y;
  var body = world.CreateBody(bodyDef);
  body.CreateFixture(fixDef);
  body.SetLinearVelocity(player.getAngleVec(10));
  var bullet = new Bullet(body, player);
  body.SetUserData(bullet);
  game.bullets.push(bullet);
}

function init() {
  world = new b2World(new b2Vec2(0, 0),    // no gravity
                      true);                 //allow sleep
  game = new Game(world, WORLD_WIDTH, WORLD_HEIGHT);
  game.addWalls();

  // add some random boxes for variety
  for (var i = 0; i < 5; i++) {
    game.addStaticBox({width: 30, height: 30, x: Math.floor(Math.random()*(WORLD_WIDTH - 30)), y: Math.floor(Math.random()*(WORLD_HEIGHT - 30))});
  }

  renderer =
    //new DebugRenderer(world, WORLD_WIDTH, WORLD_HEIGHT);
    new Canvas2DRenderer(world, WORLD_WIDTH, WORLD_HEIGHT);

  requestAnimFrame(update);
}

function update() {
  game.run();
  renderer.render(game);
  requestAnimFrame(update);
}

function keyChange(ev) {
  var maps = {
    32: 'fire',
    37: 'left',
    38: 'forward',
    39: 'right',
    40: 'back'
  };
  if (ev.keyCode in maps) {
    game.keyInput(maps[ev.keyCode], ev.type == "keydown");
  }
}

function addKeyboardPlayer(ev) {
  window.addEventListener("keydown", keyChange, true);
  window.addEventListener("keyup", keyChange, true);
  game.addPlayer('key');
  document.body.removeChild(ev.target);
}

function addToScoreboard(player) {
  var s = document.createElement("span");
  s.setAttribute("id", "playerscore-" + player.id);
  s.setAttribute("class", "score");
  s.style.color = player.color;
  s.appendChild(document.createTextNode("0"));

  var scores = document.getElementById("scores");
  scores.appendChild(s);
}

function updateScore(player) {
  var s = document.getElementById("playerscore-" + player.id);
  s.firstChild.textContent = player.score;
}

function gamepadConnected(ev) {
  var gamepad;
  try {
    gamepad = new Input.Device(ev.gamepad);
    game.addPlayer(gamepad);
  } catch (ex) {
    console.error(ex);
  }
}

function gamepadDisconnected(ev) {
  for (var i = 0; i < game.players.length; i++) {
    if (game.players[i].input == ev.gamepad) {
      game.removePlayer(i);
      break;
    }
  }
}

window.addEventListener("load", init, true);
window.addEventListener("MozGamepadConnected", gamepadConnected, true);
window.addEventListener("MozGamepadDisconnected", gamepadDisconnected, true);
