# based on http://jsdo.it/mrdoob/xI3u

(->
  requestAnimationFrame = window.requestAnimationFrame or window.mozRequestAnimationFrame or window.webkitRequestAnimationFrame or window.msRequestAnimationFrame
  window.requestAnimationFrame = requestAnimationFrame
)()

class City
  constructor: ->
    @canvas = document.createElement 'canvas'
    @colors = [
      '#005F6B',
      '#008C9E',
      '#00B4CC',
      '#00DFFC'
    ]

    document.body.appendChild @canvas
    @ctx = @canvas.getContext '2d'
    @resizeCanvas()

    @audioContext = new (AudioContext ? webkitAudioContext)
    @masterGain = @audioContext.createGain()
    @masterGain.connect @audioContext.destination
    @scissor = new Scissor(@audioContext)
    @scissor.connect @masterGain
    @scissor.detune = 1
    @scissor.numSaws = 10
    @notes = []
    @maxNotes = 50
    @minNote = 48
    @masterGain.gain.value = (1 / @maxNotes)
    @skip = 100
    @currSkip = 0

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

    if @active == 0
      restart = =>
        @restarted = false
        @ctx.clearRect 0, 0, @width, @height
        @addBoid new Boid(this,
          @colors[Math.floor(Math.random() * @colors.length)]
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
      boid.update()
      if boid.dead
        skip = 1
        @removeBoid id
      else if @active < @maxNotes
        @addBoid new Boid(this,
          @colors[Math.floor(Math.random() * @colors.length)]
          boid.x, boid.y,
          (if Math.random() > 0.5 then 90 else -90) *
          Math.PI / 180 + boid.angle)

class Boid
  constructor: (@city, @color, @x, @y, angle) ->
    @playNote()
    @angle = Math.pow(Math.random(), 20) + angle
    @dx = Math.cos @angle
    @dy = Math.sin @angle
    @life = Math.random() * 200 + 40
    @dead = false
    @width = 2 * Math.random()
    @dr = 0
    r = Math.random()
    if r < 0.5
      @dr = (if Math.random() > 0.5 then r else -r) * 0.1
      @life += (@city.width / 2) * Math.random()

  playNote: ->
    if @city.notes.length > @city.maxNotes
      @oldestNote = @city.notes.shift()
      @city.scissor.noteOff @oldestNote

    @note = @city.scissor.noteOn(109 + (Math.random() * 2))
    @city.notes.push @note

  stopNote: ->
    @city.scissor.noteOff @note

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
    @stopNote()
    @dead = true

window.onload = ->
  @city = new City

window.onresize = ->
  @city.resizeCanvas()
