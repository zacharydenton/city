# based on http://jsdo.it/mrdoob/xI3u

class City
  constructor: ->
    @width = window.innerWidth
    @height = window.innerHeight
    @canvas = document.createElement 'canvas'
    @colors = [
      '#343838',
      '#005F6B',
      '#008C9E',
      '#00B4CC',
      '#00DFFC'
    ]

    document.body.appendChild @canvas
    @canvas.width = @width
    @canvas.height = @height
    @ctx = @canvas.getContext '2d'
    @ctx.fillStyle = @colors[0]
    @ctx.fillRect 0, 0, @width, @height

    @boids = []
    init = Math.random() * 360
    for i in [1..4]
      @boids.push(new Boid(this, @colors[1], @width / 2, @height / 2,
        (init + 90 * i) * Math.PI / 180))

    @update()

  update: =>
    requestAnimationFrame @update
    @image = @ctx.getImageData 0, 0, @width, @height
    @data = @image.data

    if @boids.length == 0
      @boids.push(new Boid(this,
        @colors[1 + Math.floor(Math.random() * (@colors.length-1))]
        Math.floor(Math.random() * @width),
        Math.floor(Math.random() * @height),
        Math.random() * 360 * Math.PI / 180))

    for boid in @boids
      continue unless boid?
      boid.update()
      if not boid.dead and Math.random() > 0.5 and @boids.length < 200
        @boids.push(new Boid(this,
          @colors[1 + Math.floor(Math.random() * (@colors.length-1))],
          boid.x, boid.y,
          (if Math.random() > 0.5 then 90 else -90) *
          Math.PI / 180 + boid.angle))

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
    @city.ctx.lineTo @x + Math.cos(@angle + dir) * @width * Math.random(),
        @y + Math.sin(@angle + dir) * @width * Math.random()
    @city.ctx.stroke()

    index = (Math.floor(@x) + @city.width * Math.floor(@y)) * 4

    if @life <= 0
      @kill()
    if @city.data[index] != 52
      @kill()
    if @x < 0 or @x > @city.width
      @kill()
    if @y < 0 or @y > @city.height
      @kill()

  kill: ->
    @city.boids.splice @city.boids.indexOf(this), 1
    @dead = true

window.onload = ->
  @city = new City
