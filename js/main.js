(function() {
  var Boid, City,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    var requestAnimationFrame;
    requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    return window.requestAnimationFrame = requestAnimationFrame;
  })();

  City = (function() {
    function City() {
      this.update = __bind(this.update, this);
      this.canvas = document.createElement('canvas');
      this.colors = ['#005F6B', '#008C9E', '#00B4CC', '#00DFFC'];
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      this.audioContext = new (typeof AudioContext !== "undefined" && AudioContext !== null ? AudioContext : webkitAudioContext);
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.scissor = new Scissor(this.audioContext);
      this.scissor.connect(this.masterGain);
      this.scissor.detune = 1;
      this.scissor.numSaws = 10;
      this.notes = [];
      this.maxNotes = 50;
      this.minNote = 48;
      this.masterGain.gain.value = 1 / this.maxNotes;
      this.skip = 100;
      this.currSkip = 0;
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
      this.currSkip += 1;
      if (this.currSkip < this.skip) {
        return;
      }
      this.currSkip = 0;
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
        } else if (this.active < this.maxNotes) {
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
      this.playNote();
      this.angle = Math.pow(Math.random(), 20) + angle;
      this.dx = Math.cos(this.angle);
      this.dy = Math.sin(this.angle);
      this.life = Math.random() * 200 + 40;
      this.dead = false;
      this.width = 2 * Math.random();
      this.dr = 0;
      r = Math.random();
      if (r < 0.5) {
        this.dr = (Math.random() > 0.5 ? r : -r) * 0.1;
        this.life += (this.city.width / 2) * Math.random();
      }
    }

    Boid.prototype.playNote = function() {
      if (this.city.notes.length > this.city.maxNotes) {
        this.oldestNote = this.city.notes.shift();
        this.city.scissor.noteOff(this.oldestNote);
      }
      this.note = this.city.scissor.noteOn(109 + (Math.random() * 2));
      return this.city.notes.push(this.note);
    };

    Boid.prototype.stopNote = function() {
      return this.city.scissor.noteOff(this.note);
    };

    Boid.prototype.update = function() {
      var dir, index, step, width;
      this.city.ctx.strokeStyle = this.color;
      this.city.ctx.beginPath();
      this.city.ctx.moveTo(this.x, this.y);
      if (this.dr !== 0) {
        this.angle += this.dr;
        this.dx = Math.cos(this.angle);
        this.dy = Math.sin(this.angle);
      }
      step = 1.5;
      this.x += this.dx * step;
      this.y += this.dy * step;
      this.life -= step;
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
      this.stopNote();
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

(function() {
  var ScissorVoice, noteToFrequency;

  this.Scissor = (function() {
    function Scissor(context) {
      this.context = context;
      this.output = this.context.createGain();
      this.numSaws = 3;
      this.detune = 12;
    }

    Scissor.prototype.noteOn = function(freq, time) {
      var voice;
      if (time == null) {
        time = this.context.currentTime;
      }
      voice = new ScissorVoice(this.context, freq, this.numSaws, this.detune);
      voice.connect(this.output);
      voice.start(time);
      return voice;
    };

    Scissor.prototype.noteOff = function(voice, time) {
      if (time == null) {
        time = this.context.currentTime;
      }
      return voice.stop(time);
    };

    Scissor.prototype.connect = function(target) {
      return this.output.connect(target);
    };

    return Scissor;

  })();

  ScissorVoice = (function() {
    function ScissorVoice(context, frequency, numSaws, detune) {
      var i, saw, _i, _ref;
      this.context = context;
      this.frequency = frequency;
      this.numSaws = numSaws;
      this.detune = detune;
      this.output = this.context.createGain();
      this.maxGain = 1 / this.numSaws;
      this.saws = [];
      for (i = _i = 0, _ref = this.numSaws; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        saw = this.context.createOscillator();
        saw.type = saw.SAWTOOTH;
        saw.frequency.value = this.frequency;
        saw.detune.value = -this.detune + i * 2 * this.detune / (this.numSaws - 1);
        saw.start(this.context.currentTime);
        saw.connect(this.output);
        this.saws.push(saw);
      }
    }

    ScissorVoice.prototype.start = function(time) {
      return this.output.gain.setValueAtTime(this.maxGain, time);
    };

    ScissorVoice.prototype.stop = function(time) {
      var _this = this;
      this.output.gain.setValueAtTime(0, time);
      return setTimeout((function() {
        return _this.saws.forEach(function(saw) {
          return saw.disconnect();
        });
      }), Math.floor((time - this.context.currentTime) * 1000));
    };

    ScissorVoice.prototype.connect = function(target) {
      return this.output.connect(target);
    };

    return ScissorVoice;

  })();

  noteToFrequency = function(note) {
    return Math.pow(2, (note - 69) / 12) * 440.0;
  };

}).call(this);
