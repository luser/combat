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

function Canvas2DRenderer(b2world, width, height) {
  this.width = width;
  this.height = height;
  var d = document.getElementById("playfield");
  d.innerHTML = '<canvas width="'+width+'" height="'+height+'" style="background-color:#FFFFFF;"></canvas>';
  this.canvas = d.firstChild;
  this.ctx = this.canvas.getContext("2d");
}

Canvas2DRenderer.prototype = {
  render: function(game) {
    this.ctx.clearRect(0, 0, this.width, this.height);
    // Draw walls
    this.ctx.strokeRect(0, 0, this.width, this.height);

    // Draw blocks
    for (var i = 0; i < game.blocks.length; i++) {
      var b = game.blocks[i];
      this.ctx.fillStyle = b.color;
      this.ctx.fillRect(b.x, b.y, b.width, b.height);
    }

    // Draw players
    for (i = 0; i < game.players.length; i++) {
      var p = game.players[i];
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

    // Draw bullets
    for (i = 0; i < game.bullets.length; i++) {
      var b = game.bullets[i];
      this.ctx.fillStyle = "black";
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
};