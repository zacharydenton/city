(function() {
  var Boid, City,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    var requestAnimationFrame;
    requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    return window.requestAnimationFrame = requestAnimationFrame;
  })();

  Array.prototype.choice = function() {
    return this[Math.floor(Math.random() * this.length)];
  };

  City = (function() {
    function City() {
      this.update = __bind(this.update, this);
      this.canvas = document.createElement('canvas');
      this.schemes = [['#005F6B', '#008C9E', '#00B4CC', '#00DFFC'], ['#FFEAF2', '#FCD9E5', '#FBC5D8', '#F1396D'], ['#6DA67A', '#77B885', '#86C28B', '#859987'], ['#EBF7F8', '#D0E0EB', '#88ABC2', '#49708A'], ['#680E34', '#9A151A', '#C21B12', '#FC4B2A'], ['#1B676B', '#519548', '#88C425', '#BEF202', '#EAFDE6'], ['#6DA67A', '#99A66D', '#A9BD68', '#B5CC6A', '#C0DE5D'], ['#A6F6AF', '#66B6AB', '#5B7C8D', '#4F2958', '#FFFBB7'], ['#111625', '#341931', '#571B3C', '#7A1E48', '#9D2053'], ['#FFFF00', '#CCD91A', '#99B333', '#668C4D', '#336666'], ['#213435', '#46685B', '#648A64', '#A6B985', '#E1E3AC'], ['#001449', '#012677', '#005BC5', '#00B4FC', '#17F9FF'], ['#8D7966', '#A8A39D', '#D8C8B8', '#E2DDD9', '#F8F1E9'], ['#595B5A', '#14C3A2', '#0DE5A8', '#7CF49A', '#B8FD99'], ['#002E34', '#004443', '#00755C', '#00C16C', '#90FF17'], ['#FC580C', '#FC6B0A', '#F8872E', '#FFA927', '#FDCA49']];
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      this.audioContext = new (typeof AudioContext !== "undefined" && AudioContext !== null ? AudioContext : webkitAudioContext);
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.7;
      this.scissor = new Scissor(this.audioContext);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 128;
      this.analysis = new Uint8Array(this.analyser.fftSize);
      this.scissor.connect(this.analyser);
      this.scissor.connect(this.masterGain);
      this.scissor.numSaws = 90;
      this.scissor.spread = 1.618 / 4;
      this.scissor.noteOn(110);
      this.skip = 8;
      this.currSkip = 0;
      this.maxActive = 10000;
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
      var boid, i, id, ids, max, maxActive, restart, sample, skip, waveform, _i, _ref, _results,
        _this = this;
      requestAnimationFrame(this.update);
      this.currSkip += 1;
      if (this.currSkip < this.skip) {
        return;
      }
      this.currSkip = 0;
      this.image = this.ctx.getImageData(0, 0, this.width, this.height);
      this.data = this.image.data;
      this.analyser.getByteTimeDomainData(this.analysis);
      waveform = (function() {
        var _i, _ref, _results;
        _results = [];
        for (i = _i = 0, _ref = this.analysis.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
          _results.push((128 - this.analysis[i]) / 128);
        }
        return _results;
      }).call(this);
      max = Math.max.apply(null, (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = waveform.length; _i < _len; _i++) {
          sample = waveform[_i];
          _results.push(Math.abs(sample));
        }
        return _results;
      })());
      maxActive = this.maxActive * max;
      if (this.active === 0) {
        restart = function() {
          _this.colors = _this.schemes.choice();
          _this.restarted = false;
          _this.ctx.clearRect(0, 0, _this.width, _this.height);
          return _this.addBoid(new Boid(_this, _this.colors.choice(), Math.floor(Math.random() * _this.width), Math.floor(Math.random() * _this.height), Math.random() * 360 * Math.PI / 180));
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
        if (boid == null) {
          continue;
        }
        boid.update();
        if (boid.dead) {
          skip = 1;
          _results.push(this.removeBoid(id));
        } else if (this.active < maxActive) {
          _results.push(this.addBoid(new Boid(this, this.colors.choice(), boid.x, boid.y, (Math.random() > 0.5 ? 90 : -90) * Math.PI / 180 + boid.angle)));
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
      this.life = Math.random() * 100 + 40;
      this.dead = false;
      this.width = 2 * Math.random();
      this.dr = 0;
      r = Math.random();
      if (r < 0.2) {
        this.dr = (Math.random() > 0.5 ? r : -r) * 0.1;
        this.life += (this.city.width / 2) * Math.random();
      }
    }

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
      this.numSaws = 9;
      this.spread = 1;
    }

    Scissor.prototype.noteOn = function(freq, time) {
      var voice;
      if (time == null) {
        time = this.context.currentTime;
      }
      voice = new ScissorVoice(this.context, freq, this.numSaws, this.spread);
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
    function ScissorVoice(context, frequency, numSaws, spread) {
      var i, saw, _i, _ref;
      this.context = context;
      this.frequency = frequency;
      this.numSaws = numSaws;
      this.spread = spread;
      this.output = this.context.createGain();
      this.maxGain = 1 / this.numSaws;
      this.saws = [];
      for (i = _i = 0, _ref = this.numSaws; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        saw = this.context.createOscillator();
        saw.type = "sawtooth";
        saw.frequency.value = this.frequency - this.spread + (i * 2 * this.spread / (this.numSaws - 1));
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
