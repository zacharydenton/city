class @Scissor
  constructor: (@context) ->
    @output = @context.createGain()
    @numSaws = 9
    @spread = 1

  noteOn: (freq, time) ->
    time ?= @context.currentTime
    voice = new ScissorVoice(@context, freq, @numSaws, @spread)
    voice.connect @output
    voice.start time
    return voice

  noteOff: (voice, time) ->
    time ?= @context.currentTime
    voice.stop time

  connect: (target) ->
    @output.connect target

class ScissorVoice
  constructor: (@context, @frequency, @numSaws, @spread) ->
    @output = @context.createGain()
    @maxGain = 1 / @numSaws
    @saws = []
    for i in [0...@numSaws]
      saw = @context.createOscillator()
      saw.type = "sawtooth"
      saw.frequency.value = @frequency - @spread + (i * 2 * @spread / (@numSaws - 1))
      saw.start @context.currentTime
      saw.connect @output
      @saws.push saw

  start: (time) ->
    @output.gain.setValueAtTime @maxGain, time

  stop: (time) ->
    @output.gain.setValueAtTime 0, time
    setTimeout (=>
      # remove old saws
      @saws.forEach (saw) ->
        saw.disconnect()
    ), Math.floor((time - @context.currentTime) * 1000)

  connect: (target) ->
    @output.connect target

noteToFrequency = (note) ->
  Math.pow(2, (note - 69) / 12) * 440.0

