(function() {
  var Boid, City,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  City = (function() {
    function City() {
      this.update = __bind(this.update, this);
      this.canvas = document.createElement('canvas');
      this.colors = ['#005F6B', '#008C9E', '#00B4CC', '#00DFFC'];
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      this.active = this.count = 0;
      this.restarted = false;
      this.boids = {};
      this.update();
    }

    City.prototype.addBoid = function(boid) {
      this.boids[++this.count] = boid;
      return this.active++;
    };

    City.prototype.removeBoid = function(id) {
      delete this.boids[id];
      return this.active--;
    };

    City.prototype.resizeCanvas = function() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = this.width;
      return this.canvas.height = this.height;
    };

    City.prototype.update = function() {
      var boid, i, id, ids, restart, skip, _i, _ref, _results,
        _this = this;
      requestAnimationFrame(this.update);
      this.image = this.ctx.getImageData(0, 0, this.width, this.height);
      this.data = this.image.data;
      if (this.active === 0) {
        restart = function() {
          _this.restarted = false;
          _this.ctx.clearRect(0, 0, _this.width, _this.height);
          return _this.addBoid(new Boid(_this, _this.colors[Math.floor(Math.random() * _this.colors.length)], Math.floor(Math.random() * _this.width), Math.floor(Math.random() * _this.height), Math.random() * 360 * Math.PI / 180));
        };
        if (this.count === 0) {
          restart();
        } else if (!this.restarted) {
          this.restarted = true;
          setTimeout(restart, 5000);
        }
      }
      skip = 0;
      ids = Object.keys(this.boids);
      _results = [];
      for (i = _i = _ref = ids.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
        if (skip > 0) {
          skip -= 1;
          continue;
        }
        id = ids[i];
        boid = this.boids[id];
        boid.update();
        if (boid.dead) {
          skip = 1;
          _results.push(this.removeBoid(id));
        } else if (Math.random() > 0.5 && this.active < 500) {
          _results.push(this.addBoid(new Boid(this, this.colors[Math.floor(Math.random() * this.colors.length)], boid.x, boid.y, (Math.random() > 0.5 ? 90 : -90) * Math.PI / 180 + boid.angle)));
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
      var dir, index, width;
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
      width = 0.75 * this.width * (1 + 0.25 * Math.random());
      this.city.ctx.lineTo(this.x + Math.cos(this.angle + dir) * width, this.y + Math.sin(this.angle + dir) * width);
      this.city.ctx.stroke();
      index = (Math.floor(this.x) + this.city.width * Math.floor(this.y)) * 4;
      if (this.life <= 0) {
        this.kill();
      }
      if (this.city.data[index + 3] > 0) {
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
      return this.dead = true;
    };

    return Boid;

  })();

  window.onload = function() {
    return this.city = new City;
  };

  window.onresize = function() {
    return this.city.resizeCanvas();
  };

}).call(this);
