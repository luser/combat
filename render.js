function DebugRenderer(b2world, width, height) {
  var d = document.getElementById("playfield");
  d.innerHTML = '<canvas width="'+width+'" height="'+height+'" style="background-color:#333333;"></canvas>';
  this.canvas = d.firstChild;
  this.b2world = b2world;

  var debugDraw = new b2DebugDraw();
  debugDraw.SetSprite(this.canvas.getContext("2d"));
  debugDraw.SetDrawScale(30);
  debugDraw.SetFillAlpha(0.3);
  debugDraw.SetLineThickness(1.0);
  debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
  b2world.SetDebugDraw(debugDraw);
}

DebugRenderer.prototype = {
  render: function(game) {
    this.b2world.DrawDebugData();
  }
};

const BLINK_TIME = 2000;
const BLINK_RATE = 100;
const FLASH_RATE = 30;
function Canvas2DRenderer(b2world, width, height, background) {
  this.width = width;
  this.height = height;
  var d = document.getElementById("playfield");
  d.innerHTML = '<canvas width="'+width+'" height="'+height+'" style="background-color:"' + background + '";"></canvas>';
  this.background = background;
  this.bulletColor = background == 'rgb(255,255,255)' ? 'black' : 'white';
  this.canvas = d.firstChild;
  this.ctx = this.canvas.getContext("2d");
  this.ctx.font = "18px 'SilkscreenNormal', Arial, sans-serif";
  this.ctx.textBaseline = "alphabetic";
  this.ctx.textAlign = "center";
}

Canvas2DRenderer.prototype = {
  render: function(game) {
    var now = Date.now();
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    // Draw walls
    this.ctx.strokeRect(0, 0, this.width, this.height);

    if (game.players.length == 0) {
      this.ctx.font = "32px 'SilkscreenNormal', Arial, sans-serif";
      this.ctx.fillStyle = '#404040';
      this.ctx.fillText("PRESS A GAMEPAD BUTTON", this.width/2, this.height/2 - 20);
      this.ctx.fillText("OR SPACE TO START", this.width/2, this.height/2 + 20);
      return;
    }

    // Draw blocks
    for (var i = 0; i < game.blocks.length; i++) {
      var b = game.blocks[i];
      this.ctx.fillStyle = b.color;
      this.ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    // Draw players
    for (i = 0; i < game.players.length; i++) {
      var p = game.players[i];
      var fresh = p.added + BLINK_TIME > now;
      var blink = (Math.floor((now - p.added)/BLINK_RATE)%2) == 0;
      if (!fresh || blink) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.body.GetAngle());
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-5, -15, 10, 30);
        this.ctx.fillRect(-15, -15, 30, 10);
        this.ctx.fillRect(-15, 5, 30, 10);
        this.ctx.fillRect(0, -1, 18, 2);
        this.ctx.restore();
      }
      if (fresh) {
        var flash = (Math.floor((now - p.added)/FLASH_RATE)%2) == 0;
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.beginPath();
        var y = -1 * p.body.GetFixtureList().GetShape().GetRadius() * SCALE - 10;
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(10, y - 10);
        this.ctx.lineTo(-10, y - 10);
        this.ctx.closePath();
        this.ctx.fillStyle = flash ? "yellow" : p.color;
        this.ctx.fill();
        this.ctx.font = "18px 'SilkscreenNormal', Arial, sans-serif";
        this.ctx.fillText(p.input.name, 0, y - 20);
        this.ctx.restore();
      }

      /*
      if (p.input.id == "AI") {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        var ctx = this.ctx;
        function drawAngle(angle, c) {
          ctx.save();
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.strokeStyle = c;
          ctx.lineTo(SCALE, 0);
          ctx.stroke();
          ctx.restore();
        }
        if (p.input.myAngle) {
          drawAngle(p.input.myAngle, "red");
        }
        if (p.input.targetAngle) {
          drawAngle(p.input.targetAngle, "green");
        }
        this.ctx.restore();
      }
       */
    }

    // Draw bullets
    for (i = 0; i < game.bullets.length; i++) {
      b = game.bullets[i];
      this.ctx.fillStyle = this.bulletColor;
      this.ctx.fillRect(b.x-3, b.y-3, 6, 6);
    }
  }
};