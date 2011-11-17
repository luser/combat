function DebugRenderer(b2world, width, height) {
  var d = document.createElement("div");
  d.innerHTML = '<canvas width="'+width+'" height="'+height+'" style="background-color:#333333;"></canvas>';
  this.canvas = d.firstChild;
  document.body.appendChild(d);
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
  var d = document.createElement("div");
  d.innerHTML = '<canvas width="'+width+'" height="'+height+'" style="background-color:#FFFFFF;"></canvas>';
  this.canvas = d.firstChild;
  this.ctx = this.canvas.getContext("2d");
  //this.ctx.translate(0, this.height);
  //this.ctx.scale(1.0, -1.0);
  document.body.appendChild(d);
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
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.moveTo(p.x, p.y);
      var v = p.getAngleVec(p.radius + 2);
      this.ctx.lineTo(p.x + v.x, p.y + v.y);
      this.ctx.stroke();
    }
  }
};