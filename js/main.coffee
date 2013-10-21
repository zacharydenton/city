# based on http://jsdo.it/mrdoob/xI3u

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

    @active = @count = 0
    @boids = {}
    init = Math.random() * 360
    for i in [1..4]
      @addBoid new Boid(this, @colors[0], @width / 2, @height / 2,
        (init + 90 * i) * Math.PI / 180)

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
    @image = @ctx.getImageData 0, 0, @width, @height
    @data = @image.data

    if @active == 0
      @addBoid new Boid(this,
        @colors[Math.floor(Math.random() * @colors.length)]
        Math.floor(Math.random() * @width),
        Math.floor(Math.random() * @height),
        Math.random() * 360 * Math.PI / 180)

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
      else if Math.random() > 0.5 and @active < 500
        @addBoid new Boid(this,
          @colors[Math.floor(Math.random() * @colors.length)]
          boid.x, boid.y,
          (if Math.random() > 0.5 then 90 else -90) *
          Math.PI / 180 + boid.angle)

class Boid
  constructor: (@city, @color, @x, @y, angle) ->
    @angle = Math.pow(Math.random(), 20) + angle
    @dx = Math.cos @angle
    @dy = Math.sin @angle
    @life = Math.random() * 90 + 50
    @dead = false
    @width = 2 * Math.random()
    @dr = 0
    r = Math.random()
    if r < 0.1
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

    @x += @dx * 2
    @y += @dy * 2
    @life -= 2

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
