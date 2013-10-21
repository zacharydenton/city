(function() {
  var Boid, City,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  City = (function() {
    function City() {
      this.update = __bind(this.update, this);
      var i, init, _i;
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas = document.createElement('canvas');
      this.colors = ['#343838', '#005F6B', '#008C9E', '#00B4CC', '#00DFFC'];
      document.body.appendChild(this.canvas);
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.ctx = this.canvas.getContext('2d');
      this.ctx.fillStyle = this.colors[0];
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.boids = [];
      init = Math.random() * 360;
      for (i = _i = 1; _i <= 4; i = ++_i) {
        this.boids.push(new Boid(this, this.colors[1], this.width / 2, this.height / 2, (init + 90 * i) * Math.PI / 180));
      }
      this.update();
    }

    City.prototype.update = function() {
      var boid, _i, _len, _ref, _results;
      requestAnimationFrame(this.update);
      this.image = this.ctx.getImageData(0, 0, this.width, this.height);
      this.data = this.image.data;
      if (this.boids.length === 0) {
        this.boids.push(new Boid(this, this.colors[1 + Math.floor(Math.random() * (this.colors.length - 1))], Math.floor(Math.random() * this.width), Math.floor(Math.random() * this.height), Math.random() * 360 * Math.PI / 180));
      }
      _ref = this.boids;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        boid = _ref[_i];
        if (boid == null) {
          continue;
        }
        boid.update();
        if (!boid.dead && Math.random() > 0.5 && this.boids.length < 200) {
          _results.push(this.boids.push(new Boid(this, this.colors[1 + Math.floor(Math.random() * (this.colors.length - 1))], boid.x, boid.y, (Math.random() > 0.5 ? 90 : -90) * Math.PI / 180 + boid.angle)));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return City;

  })();

  Boid = (function() {
    function Boid(city, color, x, y, angle) {
      var r;
      this.city = city;
      this.color = color;
      this.x = x;
      this.y = y;
      this.angle = Math.pow(Math.random(), 20) + angle;
      this.dx = Math.cos(this.angle);
      this.dy = Math.sin(this.angle);
      this.life = Math.random() * 90 + 50;
      this.dead = false;
      this.width = 2 * Math.random();
      this.dr = 0;
      r = Math.random();
      if (r < 0.1) {
        this.dr = (Math.random() > 0.5 ? r : -r) * 0.1;
        this.life += (this.city.width / 2) * Math.random();
      }
    }

    Boid.prototype.update = function() {
      var dir, index;
      this.city.ctx.strokeStyle = this.color;
      this.city.ctx.beginPath();
      this.city.ctx.moveTo(this.x, this.y);
      if (this.dr !== 0) {
        this.angle += this.dr;
        this.dx = Math.cos(this.angle);
        this.dy = Math.sin(this.angle);
      }
      this.x += this.dx * 2;
      this.y += this.dy * 2;
      this.life -= 2;
      this.city.ctx.lineTo(this.x, this.y);
      dir = (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
      this.city.ctx.lineTo(this.x + Math.cos(this.angle + dir) * this.width * Math.random(), this.y + Math.sin(this.angle + dir) * this.width * Math.random());
      this.city.ctx.stroke();
      index = (Math.floor(this.x) + this.city.width * Math.floor(this.y)) * 4;
      if (this.life <= 0) {
        this.kill();
      }
      if (this.city.data[index] !== 52) {
        this.kill();
      }
      if (this.x < 0 || this.x > this.city.width) {
        this.kill();
      }
      if (this.y < 0 || this.y > this.city.height) {
        return this.kill();
      }
    };

    Boid.prototype.kill = function() {
      this.city.boids.splice(this.city.boids.indexOf(this), 1);
      return this.dead = true;
    };

    return Boid;

  })();

  window.onload = function() {
    return this.city = new City;
  };

}).call(this);
