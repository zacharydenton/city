# based on http://jsdo.it/mrdoob/xI3u

(->
  requestAnimationFrame = window.requestAnimationFrame or window.mozRequestAnimationFrame or window.webkitRequestAnimationFrame or window.msRequestAnimationFrame
  window.requestAnimationFrame = requestAnimationFrame
)()

Array::choice = ->
  this[Math.floor(Math.random() * this.length)]

class City
  constructor: ->
    @canvas = document.createElement 'canvas'
    @schemes = [
      ['#005F6B', '#008C9E', '#00B4CC', '#00DFFC'],
      ['#FFEAF2', '#FCD9E5', '#FBC5D8', '#F1396D'],
      ['#6DA67A', '#77B885', '#86C28B', '#859987'],
      ['#EBF7F8', '#D0E0EB', '#88ABC2', '#49708A'],
      ['#680E34', '#9A151A', '#C21B12', '#FC4B2A'],
      ['#1B676B', '#519548', '#88C425', '#BEF202', '#EAFDE6'],
      ['#6DA67A', '#99A66D', '#A9BD68', '#B5CC6A', '#C0DE5D'],
      ['#A6F6AF', '#66B6AB', '#5B7C8D', '#4F2958', '#FFFBB7'],
      ['#111625', '#341931', '#571B3C', '#7A1E48', '#9D2053'],
      ['#FFFF00', '#CCD91A', '#99B333', '#668C4D', '#336666'],
      ['#213435', '#46685B', '#648A64', '#A6B985', '#E1E3AC'],
      ['#001449', '#012677', '#005BC5', '#00B4FC', '#17F9FF'],
      ['#8D7966', '#A8A39D', '#D8C8B8', '#E2DDD9', '#F8F1E9'],
      ['#595B5A', '#14C3A2', '#0DE5A8', '#7CF49A', '#B8FD99'],
      ['#002E34', '#004443', '#00755C', '#00C16C', '#90FF17'],
      ['#FC580C', '#FC6B0A', '#F8872E', '#FFA927', '#FDCA49'],
    ]

    document.body.appendChild @canvas
    @ctx = @canvas.getContext '2d'
    @resizeCanvas()

    @audioContext = new (AudioContext ? webkitAudioContext)
    @masterGain = @audioContext.createGain()
    @masterGain.connect @audioContext.destination
    @masterGain.gain.value = 0.7
    @scissor = new Scissor(@audioContext)
    @analyser = @audioContext.createAnalyser()
    @analyser.fftSize = 128
    @analysis = new Uint8Array(@analyser.fftSize)
    @scissor.connect @analyser
    @scissor.connect @masterGain
    @scissor.numSaws = 90
    @scissor.spread = 1.618/4
    @scissor.noteOn(110)

    @skip = 8
    @currSkip = 0

    @maxActive = 10000
    @active = @count = 0
    @restarted = false
    @boids = {}
    @update()

  addBoid: (boid) ->
    @boids[++@count] = boid
    @active++

  removeBoid: (id) ->
    delete @boids[id]
    @active--

  resizeCanvas: ->
    @width = window.innerWidth
    @height = window.innerHeight
    @canvas.width = @width
    @canvas.height = @height

  update: =>
    requestAnimationFrame @update
    @currSkip += 1
    return if @currSkip < @skip
    @currSkip = 0
    @image = @ctx.getImageData 0, 0, @width, @height
    @data = @image.data
    @analyser.getByteTimeDomainData(@analysis)
    waveform = ((128 - @analysis[i]) / 128 for i in [0...@analysis.length])
    max = Math.max.apply(null, (Math.abs(sample) for sample in waveform))
    maxActive = @maxActive * max

    if @active == 0
      restart = =>
        @colors = @schemes.choice()
        @restarted = false
        @ctx.clearRect 0, 0, @width, @height
        @addBoid new Boid(this,
          @colors.choice(),
          Math.floor(Math.random() * @width),
          Math.floor(Math.random() * @height),
          Math.random() * 360 * Math.PI / 180)
      if @count == 0
        restart()
      else if not @restarted
        @restarted = true
        setTimeout restart, 5000

    skip = 0
    ids = Object.keys(@boids)
    for i in [ids.length-1..0]
      if skip > 0
        skip -= 1
        continue
      id = ids[i]
      boid = @boids[id]
      continue unless boid?
      boid.update()
      if boid.dead
        skip = 1
        @removeBoid id
      else if @active < maxActive
        @addBoid new Boid(this,
          @colors.choice(),
          boid.x, boid.y,
          (if Math.random() > 0.5 then 90 else -90) *
          Math.PI / 180 + boid.angle)

class Boid
  constructor: (@city, @color, @x, @y, angle) ->
    @angle = Math.pow(Math.random(), 20) + angle
    @dx = Math.cos @angle
    @dy = Math.sin @angle
    @life = Math.random() * 100 + 40
    @dead = false
    @width = 2 * Math.random()
    @dr = 0
    r = Math.random()
    if r < 0.2
      @dr = (if Math.random() > 0.5 then r else -r) * 0.1
      @life += (@city.width / 2) * Math.random()

  update: ->
    @city.ctx.strokeStyle = @color
    @city.ctx.beginPath()
    @city.ctx.moveTo @x, @y
    if @dr != 0
      @angle += @dr
      @dx = Math.cos @angle
      @dy = Math.sin @angle

    step = 1.5
    @x += @dx * step
    @y += @dy * step
    @life -= step

    @city.ctx.lineTo @x, @y
    dir = (if Math.random() > 0.5 then Math.PI/2 else -Math.PI/2)
    width = 0.75 * @width * (1 + 0.25 * Math.random())
    @city.ctx.lineTo @x + Math.cos(@angle + dir) * width,
        @y + Math.sin(@angle + dir) * width
    @city.ctx.stroke()

    index = (Math.floor(@x) + @city.width * Math.floor(@y)) * 4

    if @life <= 0
      @kill()
    if @city.data[index + 3] > 0
      @kill()
    if @x < 0 or @x > @city.width
      @kill()
    if @y < 0 or @y > @city.height
      @kill()

  kill: ->
    @dead = true

window.onload = ->
  @city = new City

window.onresize = ->
  @city.resizeCanvas()
