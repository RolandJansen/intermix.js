(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.intermix = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

//intermix = require('./core.js');
var intermix = _dereq_('./core.js') || {};
intermix.events = _dereq_('./events.js');
intermix.SoundWave = _dereq_('./SoundWave.js');
intermix.Sound = _dereq_('./Sound.js');
intermix.Sequencer = _dereq_('./Sequencer.js');
intermix.Part = _dereq_('./Part.js');

module.exports = intermix;

},{"./Part.js":3,"./Sequencer.js":4,"./Sound.js":5,"./SoundWave.js":6,"./core.js":7,"./events.js":8}],2:[function(_dereq_,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn) {
    var keys = [];
    var wkey;
    var cacheKeys = Object.keys(cache);

    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        var exp = cache[key].exports;
        // Using babel as a transpiler to use esmodule, the export will always
        // be an object with the default export as a property of it. To ensure
        // the existing api and babel esmodule exports are both supported we
        // check for both
        if (exp === fn || exp.default === fn) {
            wkey = key;
            break;
        }
    }

    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            Function(['require','module','exports'], '(' + fn + ')(self)'),
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);

    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        Function(['require'], (
            // try to call default if defined to also support babel esmodule
            // exports
            'var f = require(' + stringify(wkey) + ');' +
            '(f.default ? f.default : f)(self);'
        )),
        scache
    ];

    var src = '(' + bundleFn + ')({'
        + Object.keys(sources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;

    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    return new Worker(URL.createObjectURL(
        new Blob([src], { type: 'text/javascript' })
    ));
};

},{}],3:[function(_dereq_,module,exports){
'use strict';

/**
 * Represents a part of a sequence. It can be
 * used in many ways:
 * <ul>
 * <li>A part of a track like in piano-roll sequencers</li>
 * <li>A pattern like in step sequencers, drum computers and trackers</li>
 * <li>A loop like in live sequencers</li>
 * </ul>
 * Technically it can store any type of event your system is capable of.
 * This means it is not limited to audio, midi, osc or dmx but can hold
 * any type of javascript object. A possible usecase would be to trigger
 * screen events with the draw function of the sequencer object.
 * @example
 * var sound = new intermix.Sound(soundWaveObject);
 * var seq = new intermix.Sequencer();
 * var part = new intermix.Part();
 * var note = intermix.events.createAudioNote('a3', 1, 0, sound);
 * part.addEvent(note, 0);
 * part.addEvent(note, 4);
 * seq.addPart(part, 0);
 * @constructor
 * @param  {float}  length       Length of the part in 64th notes (default: 64)
 */
var Part = function(length) {

  this.resolution = 16; // (resolution * multiply) should alwasy be 64
  this.multiply = 4;    // resolution multiplier
  this.length = 64;     // length of the pattern in 64th notes
  this.name = 'Part';   // name of this part
  this.pattern = [];    // the actual pattern with notes etc.

  if (length) {
    this.length = length;
  }

  this.pattern = this.initPattern(this.length);
};

/**
 * Initialize an empty pattern for the part.
 * @private
 * @param  {float}  length  Length of the pattern mesured in bars (4 beats = 1 bar)
 * @return {Object} The current context to make the function chainable.
 */
Part.prototype.initPattern = function(length) {
  var pattern = [];
  for (var i = 0; i < (length); i++) {
    pattern[i] = [];
  }
  return pattern;
};

/**
 * Adds an event to the pattern at a given position
 * @param  {Object} seqEvent  The event (note, controller, whatever)
 * @param  {Int}    position  Position in the pattern
 * @return {Object} The current context to make the function chainable.
 */
Part.prototype.addEvent = function(seqEvent, position) {
  if (position <= this.resolution) {
    var pos = (position) * this.multiply;
    this.pattern[pos].push(seqEvent);
  } else {
    throw new Error('Position out of pattern bounds.');
  }
  return this;
};

/**
 * Removes an event at a given position
 * @param  {Object} seqEvent  The event (note, controller, whatever)
 * @param  {Int}    position  Position in the pattern
 * @return {Void}
 */
Part.prototype.removeEvent = function(seqEvent, position) {
  var pos = (position) * this.multiply;
  var index = this.pattern[pos].indexOf(seqEvent);
  this.pattern[pos].splice(index, 1);
};

/**
 * Get the length of the pattern in 64th notes
 * @return {Int}    Length of the pattern
 */
Part.prototype.getLength = function() {
  return this.pattern.length;
};

/**
 * Get all positions that contain at least one event.
 * Can be handy to draw events on the screen.
 * @example <caption>from {@tutorial Stepsequencer}</caption>
 * bdSteps = bdPart.getNotePositions();
 * bdSteps.forEach(function(pos) {
 *   document.getElementById('bd' + pos).style.backgroundColor = 'red';
 * });
 * @return {Array}  List with all non-empty pattern entries
 */
Part.prototype.getNotePositions = function() {
  var positions = [];
  this.pattern.forEach(function(el, index) {
    if (el.length > 0) {
      positions.push(index / this.multiply);
    }
  }, this);
  return positions;
};

/**
 * Extends a part at the top/start.
 * @param  {float}  extLength Length in 64th notes
 * @return {Void}
 */
Part.prototype.extendOnTop = function(extLength) {
  var extension = this.initPattern(extLength);
  this.pattern = extension.concat(this.pattern);
};

/**
 * Extends a part at the end
 * @param  {float}  extLength Length in 64th notes
 * @return {Void}
 */
Part.prototype.extendOnEnd = function(extLength) {
  var extension = this.initPattern(extLength);
  this.pattern = this.pattern.concat(extension);
};

module.exports = Part;

},{}],4:[function(_dereq_,module,exports){
'use strict';

var work = _dereq_('webworkify');   //prepares the worker for browserify
var core = _dereq_('./core.js');
var worker = _dereq_('./scheduleWorker.js');

/**
 * The main class of the sequencer. It does the queuing of
 * parts and events and runs the schedulers that fire events
 * and draws to the screen.
 * @example
 * var part = new intermix.Part();
 * var seq = new intermix.Sequencer();
 * part.addEvent(someNote, 0);
 * seq.addPart(part, 0);
 * seq.start();
 * @constructor
 */
var Sequencer = function() {

  var self = this;
  this.ac = core;             //currently just used for tests
  this.bpm = 120;             //beats per minute
  this.resolution = 64;       //shortest possible note. You normally don't want to touch this.
  this.interval = 100;        //the interval in miliseconds the scheduler gets invoked.
  this.lookahead = 0.3;       //time in seconds the scheduler looks ahead.
                              //should be longer than interval.
  this.queue = [];            //List with all parts of the score
  this.runqueue = [];         //list with parts that are playing or will be played shortly

  this.timePerStep;           //period of time between two steps
  this.nextStepTime = 0;      //time in seconds when the next step will be triggered
  this.nextStep = 0;          //position in the queue that will get triggered next
  this.lastPlayedStep = 0;    //step in queue that was played (not triggered) recently (used for drawing).
  this.loop = false;          //play a section of the queue in a loop
  this.loopStart;             //first step of the loop
  this.loopEnd;               //last step of the loop
  this.isRunning = false;     //true if sequencer is running, otherwise false
  this.animationFrame;        //has to be overridden with a function. Will be called in the
                              //draw function with the lastPlayedStep int as parameter.

  // set time per setTimePerStep
  this.timePerStep = this.setTimePerStep(this.bpm, this.resolution);

  // Initialize the scheduler-timer
  this.scheduleWorker = work(worker);

  /*eslint-enable */

  this.scheduleWorker.onmessage = function(e) {
    if (e.data === 'tick') {
      self.scheduler();
    }
  };

  this.scheduleWorker.postMessage({'interval': this.interval});
};

/**
 * Reads events from the master queue and fires them.
 * It gets called at a constant rate, looks ahead in
 * the queue and fires all events in the near future
 * with a delay computed from the current bpm value.
 * @private
 * @return {Void}
 */
Sequencer.prototype.scheduler = function() {
  var limit = core.currentTime + this.lookahead;
  // if invoked for the first time or previously stopped
  if (this.nextStepTime === 0) {
    this.nextStepTime = core.currentTime;
  }

  while (this.nextStepTime < limit) {
    this.addPartsToRunqueue();
    this.fireEvents();
    this.nextStepTime += this.timePerStep;

    this.setQueuePointer();
  }
};

/**
 * Looks in the master queue for parts and adds
 * copies of them to the runqueue.
 * @private
 * @return {Void}
 */
Sequencer.prototype.addPartsToRunqueue = function() {
  if (this.queue[this.nextStep]) {
    if (this.queue[this.nextStep].length === 1) {
      var part = this.queue[this.nextStep][0];
      part.pointer = 0;
      this.runqueue.push(part);
    } else {
      this.queue[this.nextStep].forEach(function(part) {
        part.pointer = 0;
        this.runqueue.push(part);
      }, this);
    }
  }
};

/**
 * Deletes parts from runqueue. It is important, that the indices
 * of the parts are sorted from max to min. Otherwise the forEach
 * loop won't work.
 * @private
 * @param  {Array} indices  Indices of the parts in the runqueue
 * @return {Void}
 */
Sequencer.prototype.deletePartsFromRunqueue = function(indices) {
  if (indices.length > 0) {
    indices.forEach(function(id) {
      delete this.runqueue[id].pointer;
      this.runqueue.splice(id, 1);
    }, this);
  }
};

/**
 * Fires all events for the upcomming step.
 * @private
 * @return {Void}
 */
Sequencer.prototype.fireEvents = function() {
  var markForDelete = [];
  this.runqueue.forEach(function(part, index) {
    if (part.pointer === part.length - 1) {
      markForDelete.unshift(index);
    } else {
      var seqEvents = part.pattern[part.pointer];
      if (seqEvents && seqEvents.length > 1) {
        seqEvents.forEach(function(seqEvent) {
          this.processSeqEvent(seqEvent, this.nextStepTime);
        }, this);
      } else if (seqEvents && seqEvents.length === 1) {
        this.processSeqEvent(seqEvents[0], this.nextStepTime);
      }
    }
    part.pointer++;
  }, this);
  this.deletePartsFromRunqueue(markForDelete);
};

/**
 * Invokes the appropriate subsystem to process the event
 * @private
 * @param  {Object} seqEvent  The event to process
 * @param  {float}  delay     time in seconds when the event should start
 * @return {Void}
 */
Sequencer.prototype.processSeqEvent = function(seqEvent, delay) {
  if (delay) {
    seqEvent.props['delay'] = delay;
  }
  seqEvent.props.instrument.processSeqEvent(seqEvent);
};

/**
 * Sets the pointer to the next step that should be played
 * in the master queue. If we're playing in loop mode,
 * jump back to loopstart when end of loop is reached.
 * @private
 * @param   {Int}   position  New position in the master queue
 * @return  {Void}
 */
Sequencer.prototype.setQueuePointer = function(position) {
  if (this.loop) {
    if (this.nextStep >= this.loopEnd) {
      this.nextStep = this.loopStart;
      this.runQueue = [];
    } else {
      this.nextStep++;
    }
  } else if (position) {
    this.nextStep = position;
  } else {
    this.nextStep++;
  }
  // console.log('next step: ' + this.nextStep);
};

/**
 * Starts the sequencer
 * @return {Void}
 */
Sequencer.prototype.start = function() {
  if (!this.isRunning) {
    this.scheduleWorker.postMessage('start');
    this.isRunning = true;
    window.requestAnimationFrame(this.draw.bind(this));
  }
};

/**
 * Stops the sequencer (halts at the current position)
 * @return {Void}
 */
Sequencer.prototype.stop = function() {
  this.scheduleWorker.postMessage('stop');
  //this.runQueue = [];
  this.nextStepTime = 0;
  this.isRunning = false;
};

/**
 * Scheduler that runs a drawing function every time
 * the screen refreshes. The function Sequencer.animationFrame()
 * has to be overridden by the application with stuff to be drawn on the screen.
 * It calls itself recursively on every frame as long as the sequencer is running.
 * @private
 * @return {Void}
 */
Sequencer.prototype.draw = function() {
  // first we'll have to find out, what step was played recently.
  // this is somehow clumsy because the sequencer doesn't keep track of that.
  var lookAheadDelta = this.nextStepTime - core.currentTime;
  if (lookAheadDelta >= 0) {
    var stepsAhead = Math.round(lookAheadDelta / this.timePerStep);

    if (this.nextStep < stepsAhead) {
      // we just jumped to the start of a loop
      this.lastPlayedStep = this.loopEnd + this.nextStep - stepsAhead;
    } else {
      this.lastPlayedStep = this.nextStep - stepsAhead;
    }

    this.updateFrame(this.lastPlayedStep);
  }

  if (this.isRunning) {
    window.requestAnimationFrame(this.draw.bind(this));
  }
};

/**
 * Runs between screen refresh. Has to be overridden by the
 * app to render to the screen.
 * @param  {Int}  lastPlayedStep  The 64th step that was played recently
 * @return {Void}
 */
Sequencer.prototype.updateFrame = function(lastPlayedStep) {
  console.log(lastPlayedStep);
};

/**
 * Adds a part to the master queue.
 * @param  {Object} part      An instance of Part
 * @param  {Int}    position  Position in the master queue
 * @return {Void}
 */
Sequencer.prototype.addPart = function(part, position) {
  if (part.length && part.pattern) {
    if (!this.queue[position]) {
      this.queue[position] = [];
    }
    this.queue[position].push(part);
  } else {
    throw new Error('Given parameter doesn\'t seem to be a part object');
  }
};

/**
 * Removes a part object from the master queue
 * @param  {Object} part     Part instance to be removed
 * @param  {Int}    position Position in the master queue
 * @return {Void}
 */
Sequencer.prototype.removePart = function(part, position) {
  if (this.queue[position] instanceof Array &&
    this.queue[position].length > 0) {
    var index = this.queue[position].indexOf(part);
    this.queue[position].splice(index, 1);
  } else {
    throw new Error('Part not found at position ' + position + '.');
  }
};

/**
 * Set beats per minute
 * @param  {Int}   bpm beats per minute
 * @return {Void}
 */
Sequencer.prototype.setBpm = function(bpm) {
  this.bpm = bpm;
  this.timePerStep = this.setTimePerStep(bpm, this.resolution);
};

/**
 * Computes the time in seconds as float value
 * between one shortest posssible note
 * (64th by default) and the next.
 * @private
 * @param  {float}  bpm        beats per minute
 * @param  {Int}    resolution shortest possible note value
 * @return {float}             time in seconds
 */
Sequencer.prototype.setTimePerStep = function(bpm, resolution) {
  return (60 * 4) / (bpm * resolution);
};

Sequencer.prototype.getLastPlayedStep = function() {

};

/**
 * Makes a copy of a flat array.
 * Uses a pre-allocated while-loop
 * which seems to be the fasted way
 * (by far) of doing this:
 * http://jsperf.com/new-array-vs-splice-vs-slice/113
 * @private
 * @param  {Array} sourceArray Array that should be copied.
 * @return {Array}             Copy of the source array.
 */
Sequencer.prototype.copyArray = function(sourceArray) {
  var destArray = new Array(sourceArray.length);
  var i = sourceArray.length;
  while (i--) {
    destArray[i] = sourceArray[i];
  }
  return destArray;
};

module.exports = Sequencer;

},{"./core.js":7,"./scheduleWorker.js":9,"webworkify":2}],5:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('./core.js');

/**
 * <p>
 * Play a sound that can be looped. Pause/Start works sample-accurate
 * at any rate. Hit the start button multiple times to have multiple
 * sounds played. All parameters are adjustable in realtime.
 * </p>
 *
 * @example
 * var soundWave = new intermix.SoundWave('audiofile.wav');
 * var sound = new intermix.Sound(soundWave);
 * sound.start();
 * @tutorial Sound
 * @constructor
 * @param  {Object} soundWave SoundWave object including the buffer with audio data to be played
 */
var Sound = function(soundWave) {

  this.wave = null;
  this.ac = core;           //currently just used for tests
  this.queue = [];          //all currently active streams
  this.loop = false;
  this.gainNode = null;
  this.pannerNode = null;

  this.soundLength = 0;
  this.isPaused = false;
  this.startOffset = 0;
  this.startOffsets = [];   //holds start offsets if paused
  this.startTime = 0;       //when the sound starts to play
  this.loopStart = 0;
  this.loopEnd = null;
  this.playbackRate = 1;
  this.detune = 0;

  if (soundWave) {
    this.wave = soundWave;
    this.buffer = soundWave.buffer;
    this.soundLength = this.loopEnd = this.buffer.duration;
    this.setupAudioChain();
  } else {
    throw new Error('Error initialising Sound object: parameter missing.');
  }
};

/**
 * Creates a gain and stereo-panner node, connects them
 * (gain -> panner) and sets gain to 1 (max value).
 * @private
 * @return {Void}
 */
Sound.prototype.setupAudioChain = function() {
  this.gainNode = core.createGain();
  this.pannerNode = core.createStereoPanner();
  this.gainNode.connect(this.pannerNode);
  this.pannerNode.connect(core.destination);
  this.gainNode.gain.value = 1;
};

/**
 * Creates and configures a BufferSourceNode
 * that can be played once and then destroys itself.
 * @private
 * @return {BufferSourceNode} The BufferSourceNode
 */
Sound.prototype.createBufferSource = function() {
  var self = this;
  var bufferSource = core.createBufferSource();
  bufferSource.buffer = this.buffer;
  bufferSource.connect(this.gainNode);
  bufferSource.onended = function() {
    //console.log('onended fired');
    self.destroyBufferSource(bufferSource);
  };
  return bufferSource;
};

/**
 * Destroyes a given AudioBufferSourceNode and deletes it
 * from the sourceNode queue. This is used in the onended
 * callback of all BufferSourceNodes to avoid dead references.
 * @private
 * @param  {bsNode} bsNode the bufferSource to be destroyed.
 */
Sound.prototype.destroyBufferSource = function(bsNode) {
  bsNode.disconnect();
  this.queue.forEach(function(node, index) {
    if (node === bsNode) {
      this.queue.splice(index, 1);
    }
  }, this);
};

/**
 * Starts a sound (AudioBufferSourceNode) and stores a references
 * in a queue. This enables you to play multiple sounds at once
 * and even stop them all at a given time.
 * @param  {Boolean} playLooped Whether the sound should be looped or not
 * @param  {float}   delay      Time in seconds the sound pauses before the stream starts
 * @param  {float}   duration   Time preriod after the stream should end
 * @return {Void}
 */
Sound.prototype.start = function(playLooped, delay, duration) {
  if (this.isPaused && this.queue.length > 0) {
    this.resume();
  } else {
    var startTime = 0;

    if (delay) {
      startTime = delay;
    } else {
      startTime = core.currentTime;
    }
    var bs = this.createBufferSource();

    if (playLooped) {
      bs.loop = playLooped;
      bs.loopStart = this.loopStart;
      bs.loopEnd = this.loopEnd;
    }
    bs.playbackRate.value = bs.tmpPlaybackRate = this.playbackRate;
    bs.detune.value = this.detune;
    bs.startTime = startTime;   // extend node with a starttime property

    this.queue.push(bs);
    if (duration) {
      bs.start(startTime, this.startOffset, duration);
    } else {
      bs.start(startTime, this.startOffset);
    }

    this.startOffset = 0;
  }
};

/**
 * Stops all audio stream, even the ones that are just scheduled.
 * It also cleans the queue so that the sound object is ready for another round.
 * @return {Void}
 */
Sound.prototype.stop = function() {
  this.queue.forEach(function(node) {
    node.stop();
    node.disconnect();
  });
  this.queue = [];  //release all references
};

/**
 * Stops all audio streams of this sound temporarily.
 * This currently just works in Chrome 49+ only.
 * If you want a global, accurate pause function
 * use suspend/resume from the core module.
 * @return  {Void}
 */
Sound.prototype.pause = function() {
  if (!this.isPaused) {
    this.queue.forEach(function(node) {
      node.tmpPlaybackRate = node.playbackRate.value;
      node.playbackRate.value = 0.0;
    });
    this.isPaused = true;
  }
};

/**
 * Resumes all streams if they were paused.
 * @return {Void}
 */
Sound.prototype.resume = function() {
  this.queue.forEach(function(node) {
    node.playbackRate.value = node.tmpPlaybackRate;
    delete node.tmpPlaybackRate;
  });
  this.isPaused = false;
};

/**
 * Processes an event fired by the sequencer.
 * @param  {Object} seqEvent A sequencer event
 * @return {Void}
 */
Sound.prototype.processSeqEvent = function(seqEvent) {
  //this.setTone(seqEvent.props.tone);
  if (seqEvent.props.duration) {
    this.start(false,
      seqEvent.props.delay,
      seqEvent.props.duration);
  } else {
    this.start(false,
      seqEvent.props.delay);
  }
};

/**
 * Sets the startpoint of the loop
 * @param  {float} value  loop start in seconds
 * @return {Void}
 */
Sound.prototype.setLoopStart = function(value) {
  this.loopStart = value;
  this.queue.forEach(function(node) {
    node.loopStart = value;
  });
};

/**
 * Sets the endpoint of the loop
 * @param  {float} value  loop end in seconds
 * @return {Void}
 */
Sound.prototype.setLoopEnd = function(value) {
  this.loopEnd = value;
  this.queue.forEach(function(node) {
    node.loopEnd = value;
  });
};

/**
 * Releases the loop of all running nodes,
 * Nodes will run until end and stop.
 * @return {Void}
 */
Sound.prototype.releaseLoop = function() {
  this.queue.forEach(function(node) {
    node.loop = false;
  });
};

/**
 * Resets the start and endpoint to start end endpoint of the AudioBuffer
 * @return {Void}
 */
Sound.prototype.resetLoop = function() {
  this.loopStart = 0;
  this.loopEnd = this.soundLength;
};

/**
 * Set the playback rate of the sound in percentage
 * (1 = 100%, 2 = 200%)
 * @param  {float}  value   Rate in percentage
 * @return {Void}
 */
Sound.prototype.setPlaybackRate = function(value) {
  this.playbackRate = value;
  this.queue.forEach(function(node) {
    node.playbackRate.value = value;
  });
};

/**
 * Get the current playback rate
 * @return {float}  The playback rate in percentage (1.25 = 125%)
 */
Sound.prototype.getPlaybackRate = function() {
  return this.playbackRate;
};

/**
 * Set the tone within two octave (+/-12 tones)
 * @param  {Integer}  semi tone
 * @return {Void}
 */
Sound.prototype.setTone = function(semiTone) {
  if (semiTone >= -12 && semiTone <= 12) {
    this.detune = semiTone * 100;
  } else {
    throw new Error('Semi tone is ' + semiTone + '. Must be between +/-12.');
  }
};

/**
 * Get the last played semitone. This doesn't has to be an
 * integer between -/+12 as the sound can be detuned with
 * more precision.
 * @return {float}  Semitone between -/+12
 */
Sound.prototype.getTone = function() {
  return this.detune / 100;
};

/**
 * Detune the sound oscillation in cents (+/- 1200)
 * @param  {Integer}  value  detune in cents
 * @return {Void}
 */
Sound.prototype.setDetune = function(value) {
  if (value >= -1200 && value <= 1200) {
    this.detune = value;
  } else {
    throw new Error('Detune parameter is ' + value + '. Must be between +/-1200.');
  }
};

/**
 * get the current detune in cents (+/- 1200)
 * @return {Integer}  Detune in cents
 */
Sound.prototype.getDetune = function() {
  return this.detune;
};

/**
 * This is not in use and can probably be removed
 * @return {Int} Random number
 */
Sound.prototype.getUID = function() {
  return Math.random().toString().substr(2, 8);
};

module.exports = Sound;

},{"./core.js":7}],6:[function(_dereq_,module,exports){
'use strict';

var core = _dereq_('./core.js');

/**
 * <p>
 * Creates a wrapper in which an audio buffer lives.
 * A SoundWave object just holds audio data and does nothing else.
 * If you want to play the sound, you have to additionally create a
 * <a href="Sound.html">Sound</a> object.
 * It can handle one or more ArrayBuffers or filenames
 * (*.wav, *.mp3) as data sources.
 * </p><p>
 * Multiple sources will be concatenated into one audio buffer.
 * This is not the same as creating multiple SoundWave objects.
 * It's like a wavetable: All start/end positions will be saved so
 * you can trigger the original samples without using multiple buffers.
 * Possible usages are multisampled sounds, loops or wavesequences (kind of).
 * </p>
 *
 * @example <caption>Play a sound from an audio file:</caption>
 * var soundWave = new intermix.SoundWave('file.wav');
 * var sound = new intermix.Sound(soundWave);
 * sound.play;
 * @example <caption>Concatenate multiple source files into one buffer<br>
 * in the given order and play them (This is broken in v0.1. Don't use it!):</caption>
 * var soundWave = new intermix.SoundWave('file1.wav,file2.wav,file3.wav');
 * var sound = new intermix.Sound(soundWave);
 * sound.play;
 * @example <caption>
 * Using ArrayBuffers instead of filenames will come in handy if you want<br>
 * to have full control over XHR or use a preloader (here: preload.js):
 * </caption>
 * var queue = new createjs.LoadQueue();
 * queue.on('complete', handleComplete);
 * queue.loadManifest([
 *     {id: 'src1', src:'file1.wav', type:createjs.AbstractLoader.BINARY},
 *     {id: 'src2', src:'file2.wav', type:createjs.AbstractLoader.BINARY}
 * ]);
 *
 * function handleComplete() {
 *     var binData1 = queue.getResult('src1');
 *     var binData2 = queue.getResult('src2');
 *     var wave1 = new intermix.SoundWave(binData1);
 *     var wave2 = new intermix.SoundWave(binData2);
 *     var concatWave = new intermix.SoundWave([binData1, binData2]);
 * };
 * @constructor
 * @param  {(Object|Object[]|string)} audioSrc   One or more ArrayBuffers or filenames
 */
var SoundWave = function(audioSrc) {

  this.ac = core;       //currently just used for tests
  this.buffer = null;   //AudioBuffer
  this.metaData = [];   //start-/endpoints and length of single waves
  var self = this;

  if (audioSrc) {
    if (audioSrc instanceof ArrayBuffer) {
      //one audio buffer to decode
      this.decodeAudioData(audioSrc);
    } else if (audioSrc instanceof Array && audioSrc[0] instanceof ArrayBuffer) {
      //multiple audio buffers to decode and concatenate
      this.concatBinariesToAudioBuffer(audioSrc);
    } else if (typeof audioSrc === 'string' && audioSrc.indexOf(',') === -1) {
      //one file to load/decode
      this.loadFile(audioSrc, function(response) {
        self.buffer = self.decodeAudioData(response);
      });
    } else if (typeof audioSrc === 'string' && audioSrc.indexOf(',') > -1) {
      //multiple files to load/decode and cancatinate
      var binBuffers = this.loadFiles(audioSrc);
      this.buffer = this.concatBinariesToAudioBuffer(binBuffers, this.buffer);
    } else {
      throw new Error('Cannot create SoundWave object: Unsupported data format');
    }
  } else {
    //start the object with empty buffer. Usefull for testing and advanced usage.
  }

};

/**
 * Takes binary audio data, turns it into an audio buffer object and
 * stores it in this.buffer.
 * Basically a wrapper for the web-audio-api decodeAudioData function.
 * It uses the new promise syntax so it probably won't work in all browsers by now.
 * @private
 * @param  {ArrayBuffer}  rawAudioSrc Audio data in raw binary format
 * @return {Promise}                  Promise that indicates if operation was successfull.
 */
SoundWave.prototype.decodeAudioData = function(rawAudioSrc) {
  var self = this;
  return core.decodeAudioData(rawAudioSrc).then(function(decoded) {
    self.buffer = decoded;
  });
};

/**
 * Concatenates one or more ArrayBuffers to an AudioBuffer.
 * @private
 * @param  {Array} binaryBuffers  Array holding one or more ArrayBuffers
 * @param  {AudioBuffer} audioBuffer   An existing AudioBuffer object
 * @return {AudioBuffer}               The concatenated AudioBuffer
 */
SoundWave.prototype.concatBinariesToAudioBuffer = function(binaryBuffers, audioBuffer) {
  binaryBuffers.forEach(function(binBuffer) {
    var tmpAudioBuffer = this.decodeAudioData(binBuffer);
    this.metaData.push(this.addWaveMetaData(audioBuffer, tmpAudioBuffer));
    audioBuffer = this.appendAudioBuffer(audioBuffer, tmpAudioBuffer);
  }, this);

  return audioBuffer;
};

/**
 * Appends two audio buffers. Suggested by Chris Wilson:<br>
 * http://stackoverflow.com/questions/14143652/web-audio-api-append-concatenate-different-audiobuffers-and-play-them-as-one-son
 * @private
 * @param  {AudioBuffer} buffer1 The first audio buffer
 * @param  {AudioBuffer} buffer2 The second audio buffer
 * @return {AudioBuffer}         buffer1 + buffer2
 */
SoundWave.prototype.appendAudioBuffer = function(buffer1, buffer2) {
  var numberOfChannels = Math.min(buffer1.numberOfChannels, buffer2.numberOfChannels);
  var tmp = core.createBuffer(numberOfChannels,
    (buffer1.length + buffer2.length),
    buffer1.sampleRate);
  for (var i = 0; i < numberOfChannels; i++) {
    var channel = tmp.getChannelData(i);
    channel.set( buffer1.getChannelData(i), 0);
    channel.set( buffer2.getChannelData(i), buffer1.length);
  }
  return tmp;
};

/**
 * Creates a dictionary with start/stop points and length in sample-frames
 * of an appended waveform and adds it to the metaData array.
 * @private
 * @param  {AudioBuffer} existingBuffer The 'old' buffer that gets appended
 * @param  {AudioBuffer} newBuffer      The buffer that gets appended
 * @return {Object}                     Dictionary with start/stop/length data
 */
SoundWave.prototype.addWaveMetaData = function(existingBuffer, newBuffer) {
  return {
    start: existingBuffer.length + 1,
    end: existingBuffer.length + newBuffer.length,
    length: newBuffer.length
  };
};

/**
 * Loads a binary file and calls a function with the
 * returned ArrayBuffer as its argument when done.
 * @todo    Test in synchronous mode or remove it completely
 * @param  {string}   filename       The file to be loaded
 * @param  {function} onloadCallback The function to be called
 * @param  {boolean}  [async=true]   Asynchronous loading
 * @example
 * var arrayBuffer;
 * this.loadFile('file1.wav', function(response) {
 *   arrayBuffer = response;
 * });
 */
SoundWave.prototype.loadFile = function(filename, onloadCallback, async) {
  var self = this;
  var asynchronously = true;
  var request = new window.XMLHttpRequest();

  request.addEventListener('progress', self.updateProgress);
  request.addEventListener('load', self.transferComplete);
  request.addEventListener('error', self.transferFailed);
  request.addEventListener('abort', self.transferCanceled);

  if (async) {
    asynchronously = async;
  }

  request.open('GET', filename, asynchronously);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    onloadCallback(request.response);
  };

  request.send();
};

SoundWave.prototype.updateProgress = function() {};

SoundWave.prototype.transferComplete = function() {

};

SoundWave.prototype.transferFailed = function() {};

SoundWave.prototype.transferCanceled = function() {};

/**
 * Loads multiple binary files and returns an array
 * with the data from the files in the given order.
 * @param  {Array}  filenames List with filenames
 * @return {Array}            Array of ArrayBuffers
 */
SoundWave.prototype.loadFiles = function(filenames) {
  var self = this;
  var binBuffers = [];
  var names = filenames.split(',');
  names.forEach(function(name) {
    self.loadFile(name, function(response) {
      binBuffers[name] = response;
    });
  });

  return this.sortBinBuffers(names, binBuffers);
};

/**
 * Sort ArrayBuffers the same order, like the filename
 * parameters.
 * @private
 * @param  {Array}  filenames  Array with filenames
 * @param  {Array}  binBuffers Array with ArrayBuffer
 * @return {Array}             Array with sorted ArrayBuffers
 */
SoundWave.prototype.sortBinBuffers = function(filenames, binBuffers) {
  return filenames.map(function(el) {
    return binBuffers[el];
  });
};

module.exports = SoundWave;

},{"./core.js":7}],7:[function(_dereq_,module,exports){
/**
 * This is the foundation of the Intermix library.
 * It simply creates the audio context objects
 * and exports it so it can be easily consumed
 * from all classes of the library.
 *
 * @return {AudioContext} The AudioContext object
 *
 * @todo Should we do backwards-compatibility for older api-versions?
 * @todo Check for mobile/iOS compatibility.
 * @todo Check if we're running on node
 *
 * @example <caption>Suspend and resume the audio context to
 * create a pause button. This should be used with createAudioWorker
 * as an error will be thrown when suspend is called on an offline audio context.
 * You can also pause single sounds with <i>Sound.pause()</i>.
 * Please read <a href="https://developer.mozilla.org/de/docs/Web/API/AudioContext/suspend">the developer docs at MDN</a>
 * to get a better idea of this.</caption>
 * susresBtn.onclick = function() {
 *   if(Intermix.state === 'running') {
 *     Intermix.suspend().then(function() {
 *       susresBtn.textContent = 'Resume context';
 *     });
 *   } else if (Intermix.state === 'suspended') {
 *     Intermix.resume().then(function() {
 *       susresBtn.textContent = 'Suspend context';
 *     });
 *   }
 * }
 */
'use strict';

var audioCtx = null;

(function() {

  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  if (window.AudioContext) {
    audioCtx = new window.AudioContext();
  } else {
    throw new Error('Couldn\'t initialize the audio context.');
  }

})();

module.exports = audioCtx;

},{}],8:[function(_dereq_,module,exports){
'use strict';

/**
 * This is not about javascript events! It's just
 * a definition of the events that the sequencer can handle plus
 * some functions to create valid events.
 * The class defines which subsystem is invoked to process the event.
 * Every class can have several types and a type consists of one or
 * more properties.
 * @example <caption>Create a note event for an audio object</caption>
 * var note = intermix.events.createAudioNote('c3', 65, 128, aSoundObject);
 */

/**
 * All valid event properties in one handy array.
 * @type {Array}
 */
var evProp = [
  'instrument', // the event receiver
  'tone',       // Int between 0 and 127 beginning at c0
  'duration',   // Int representing a number of 64th notes
  'velocity',   // Int between 0 and 127
  'pitch',
  'volume',
  'pan'
];

/**
 * All valid event types and the properties assotiated with them.
 * Type are valid with one, several or all of its properties.
 * @type {Object}
 */
var evType = {
  'note': [ evProp[0], evProp[1], evProp[2], evProp[3] ],
  'control': [ evProp[4], evProp[5], evProp[6] ]
};

/**
 * All valid event classes and the types assotiated with them.
 * @type {Object}
 */
var evClass = {
  'audio': [evType.note, evType.control],
  'synth': [evType.note, evType.control],
  'fx': [],
  'midi': [],
  'osc': []
};

/**
 * Validates the class of a sequencer event
 * @private
 * @param  {String}   eClass Event class
 * @return {boolean}  true if class exists, false if not
 */
var validateClass = function(eClass) {
  if (evClass.hasOwnProperty(eClass)) {
    return true;
  } else {
    return false;
  }
};

/**
 * Validates the type of a sequencer event
 * @private
 * @param  {String}   eType Event type
 * @return {boolean}  true if type exists, false if not
 */
var validateType = function(eType) {
  if (evType.hasOwnProperty(eType)) {
    return true;
  } else {
    return false;
  }
};

/**
 * Checks if an instrument is an object.
 * This is a poorly weak test but that's
 * all we can do here.
 * @param  {Object} instr An instrument object
 * @return {boolean}      true if it's an object, false if not
 */
var validatePropInstrument = function(instr) {
  if (typeof instr === 'object') {
    return true;
  } else {
    return false;
  }
};

/**
 * Validates if a tone or velocity value is
 * an integer between 0 and 127.
 * @private
 * @param  {Int}  value   The number that represents a tone
 * @return {boolean}      True if its a valid tone, false if not
 */
var validatePropToneVelo = function(value) {
  if (!isNaN(value) && Number.isInteger(value) && value >= 0 && value <= 127) {
    return true;
  } else {
    return false;
  }
};

/**
 * Validates if a duration is a positive integer.
 * @private
 * @param  {Int}  value   Number representing multiple 64th notes
 * @return {boolean}      True if its a valid duration, false if not
 */
var validatePropDuration = function(value) {
  if (!isNaN(value) && Number.isInteger(value) && value >= 0) {
    return true;
  } else {
    return false;
  }
};

/**
 * Validates an object of event properties.
 * It checks the properties are valid for the given type.
 * @private
 * @param  {Object} eProps  Object with event properties
 * @param  {String} eType   Event type to validate against
 * @return {boolean}        true if all props are valid, false if not
 */
var validateProps = function(eProps, eType) {
  var type = evType[eType];
  for (var key in eProps)  {
    if (evProp.indexOf(key) === -1 &&
    type.indexOf(key) === -1) {
      return false;
    }
  }
  return true;
};

/**
 * Takes a string of the form c3 or d#4 and
 * returns the corresponding number.
 * @param  {String} tone String representing a note
 * @return {Int}         Number representing a note
 */
var convertTone = function(tone) {
  var notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
  var str = tone.toLowerCase();

  if (str.match(/^[a-h]#?[0-9]$/)) {
    var note = str.substring(0, str.length - 1);
    var oct = str.slice(-1);

    if (note === 'h') {
      note = 'b';
    }
    return notes.indexOf(note) + oct * 12;
  } else {
    throw new Error('Unvalid string. Has to be like [a-h]<#>[0-9]');
  }
};

/**
 * Creates a sequencer event.
 * @private
 * @param  {String} eClass Event class
 * @param  {String} eType  Event type
 * @param  {Object} eProps Object with event properties
 * @return {Object}        Sequencer event
 */
var createEvent = function(eClass, eType, eProps) {
  if (validateClass(eClass) &&
    validateType(eType) &&
    validateProps(eProps, eType)) {
    return {
      'class': eClass,
      'type': eType,
      'props': eProps
    };
  } else {
    throw new Error('Unable to create sequencer event. Wrong parameters');
  }
};

/**
 * Creates an audio note event
 * @param  {Int|String} tone     Tone between 0 and 127 or string (c3, d#4)
 * @param  {Int}        velocity Velocity between 0 and 127
 * @param  {Int}        duration Duration in 64th notes
 * @return {Object}              All properties in one object
 */
var createAudioNote = function(tone, velocity, duration, instr) {
  var props = {};
  if (typeof tone === 'string') {
    tone = convertTone(tone);
  }
  if (tone && validatePropToneVelo(tone)) {
    props.tone = tone;
  }
  if (velocity && validatePropToneVelo(velocity)) {
    props.velocity = velocity;
  }
  if (duration && validatePropDuration(duration)) {
    props.duration = duration;
  }
  if (instr && validatePropInstrument(instr)) {
    props.instrument = instr;
  } else {
    throw new Error('A sequencer event must have an instrument as property');
  }
  return createEvent('audio', 'note', props);
};

module.exports = {
  class: evClass,
  type: evType,
  property: evProp,
  createAudioNote: createAudioNote
};

},{}],9:[function(_dereq_,module,exports){
/**
 * This is a webworker that provides a timer
 * that fires the scheduler for the sequencer.
 * This is because timing here is  more stable
 * than in the main thread.
 * The syntax is adapted to the commonjs module pattern.
 * @example <caption>It is just for library internal
 * usage. See Sequencer.js for details.</caption>
 * worker.postMessage({ 'interval': 200 });
 * worker.postMessage('start');
 * worker.postMessage('stop');
 * worker.terminate();  //webworker internal function, just for completeness
 */
'use strict';

var timer = null;
var interval = 100;

var worker = function(self) {
  self.addEventListener('message', function(e) {
    if (e.data === 'start') {
      timer = setInterval(function() {self.postMessage('tick');}, interval);
    } else if (e.data === 'stop') {
      clearInterval(timer);
    } else if (e.data.interval) {
      interval = e.data.interval;
      if (timer) {
        clearInterval(timer);
        timer = setInterval(function() {self.postMessage('tick');}, interval);
      }
    }
  });
};

module.exports = worker;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsInNyYy9tYWluLmpzIiwiZDovVXNlcnMvamFuc2VuL2dpdC9pbnRlcm1peC5qcy9ub2RlX21vZHVsZXMvd2Vid29ya2lmeS9pbmRleC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1BhcnQuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9TZXF1ZW5jZXIuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9Tb3VuZC5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL1NvdW5kV2F2ZS5qcyIsImQ6L1VzZXJzL2phbnNlbi9naXQvaW50ZXJtaXguanMvc3JjL2NvcmUuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9ldmVudHMuanMiLCJkOi9Vc2Vycy9qYW5zZW4vZ2l0L2ludGVybWl4LmpzL3NyYy9zY2hlZHVsZVdvcmtlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XHJcblxyXG4vL2ludGVybWl4ID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcbnZhciBpbnRlcm1peCA9IHJlcXVpcmUoJy4vY29yZS5qcycpIHx8IHt9O1xyXG5pbnRlcm1peC5ldmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xyXG5pbnRlcm1peC5Tb3VuZFdhdmUgPSByZXF1aXJlKCcuL1NvdW5kV2F2ZS5qcycpO1xyXG5pbnRlcm1peC5Tb3VuZCA9IHJlcXVpcmUoJy4vU291bmQuanMnKTtcclxuaW50ZXJtaXguU2VxdWVuY2VyID0gcmVxdWlyZSgnLi9TZXF1ZW5jZXIuanMnKTtcclxuaW50ZXJtaXguUGFydCA9IHJlcXVpcmUoJy4vUGFydC5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBpbnRlcm1peDtcclxuIiwidmFyIGJ1bmRsZUZuID0gYXJndW1lbnRzWzNdO1xudmFyIHNvdXJjZXMgPSBhcmd1bWVudHNbNF07XG52YXIgY2FjaGUgPSBhcmd1bWVudHNbNV07XG5cbnZhciBzdHJpbmdpZnkgPSBKU09OLnN0cmluZ2lmeTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIHZhciB3a2V5O1xuICAgIHZhciBjYWNoZUtleXMgPSBPYmplY3Qua2V5cyhjYWNoZSk7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNhY2hlS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IGNhY2hlS2V5c1tpXTtcbiAgICAgICAgdmFyIGV4cCA9IGNhY2hlW2tleV0uZXhwb3J0cztcbiAgICAgICAgLy8gVXNpbmcgYmFiZWwgYXMgYSB0cmFuc3BpbGVyIHRvIHVzZSBlc21vZHVsZSwgdGhlIGV4cG9ydCB3aWxsIGFsd2F5c1xuICAgICAgICAvLyBiZSBhbiBvYmplY3Qgd2l0aCB0aGUgZGVmYXVsdCBleHBvcnQgYXMgYSBwcm9wZXJ0eSBvZiBpdC4gVG8gZW5zdXJlXG4gICAgICAgIC8vIHRoZSBleGlzdGluZyBhcGkgYW5kIGJhYmVsIGVzbW9kdWxlIGV4cG9ydHMgYXJlIGJvdGggc3VwcG9ydGVkIHdlXG4gICAgICAgIC8vIGNoZWNrIGZvciBib3RoXG4gICAgICAgIGlmIChleHAgPT09IGZuIHx8IGV4cC5kZWZhdWx0ID09PSBmbikge1xuICAgICAgICAgICAgd2tleSA9IGtleTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF3a2V5KSB7XG4gICAgICAgIHdrZXkgPSBNYXRoLmZsb29yKE1hdGgucG93KDE2LCA4KSAqIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgdmFyIHdjYWNoZSA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNhY2hlS2V5cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrZXkgPSBjYWNoZUtleXNbaV07XG4gICAgICAgICAgICB3Y2FjaGVba2V5XSA9IGtleTtcbiAgICAgICAgfVxuICAgICAgICBzb3VyY2VzW3drZXldID0gW1xuICAgICAgICAgICAgRnVuY3Rpb24oWydyZXF1aXJlJywnbW9kdWxlJywnZXhwb3J0cyddLCAnKCcgKyBmbiArICcpKHNlbGYpJyksXG4gICAgICAgICAgICB3Y2FjaGVcbiAgICAgICAgXTtcbiAgICB9XG4gICAgdmFyIHNrZXkgPSBNYXRoLmZsb29yKE1hdGgucG93KDE2LCA4KSAqIE1hdGgucmFuZG9tKCkpLnRvU3RyaW5nKDE2KTtcblxuICAgIHZhciBzY2FjaGUgPSB7fTsgc2NhY2hlW3drZXldID0gd2tleTtcbiAgICBzb3VyY2VzW3NrZXldID0gW1xuICAgICAgICBGdW5jdGlvbihbJ3JlcXVpcmUnXSwgKFxuICAgICAgICAgICAgLy8gdHJ5IHRvIGNhbGwgZGVmYXVsdCBpZiBkZWZpbmVkIHRvIGFsc28gc3VwcG9ydCBiYWJlbCBlc21vZHVsZVxuICAgICAgICAgICAgLy8gZXhwb3J0c1xuICAgICAgICAgICAgJ3ZhciBmID0gcmVxdWlyZSgnICsgc3RyaW5naWZ5KHdrZXkpICsgJyk7JyArXG4gICAgICAgICAgICAnKGYuZGVmYXVsdCA/IGYuZGVmYXVsdCA6IGYpKHNlbGYpOydcbiAgICAgICAgKSksXG4gICAgICAgIHNjYWNoZVxuICAgIF07XG5cbiAgICB2YXIgc3JjID0gJygnICsgYnVuZGxlRm4gKyAnKSh7J1xuICAgICAgICArIE9iamVjdC5rZXlzKHNvdXJjZXMpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyaW5naWZ5KGtleSkgKyAnOlsnXG4gICAgICAgICAgICAgICAgKyBzb3VyY2VzW2tleV1bMF1cbiAgICAgICAgICAgICAgICArICcsJyArIHN0cmluZ2lmeShzb3VyY2VzW2tleV1bMV0pICsgJ10nXG4gICAgICAgICAgICA7XG4gICAgICAgIH0pLmpvaW4oJywnKVxuICAgICAgICArICd9LHt9LFsnICsgc3RyaW5naWZ5KHNrZXkpICsgJ10pJ1xuICAgIDtcblxuICAgIHZhciBVUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkwgfHwgd2luZG93Lm1velVSTCB8fCB3aW5kb3cubXNVUkw7XG5cbiAgICByZXR1cm4gbmV3IFdvcmtlcihVUkwuY3JlYXRlT2JqZWN0VVJMKFxuICAgICAgICBuZXcgQmxvYihbc3JjXSwgeyB0eXBlOiAndGV4dC9qYXZhc2NyaXB0JyB9KVxuICAgICkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBSZXByZXNlbnRzIGEgcGFydCBvZiBhIHNlcXVlbmNlLiBJdCBjYW4gYmVcclxuICogdXNlZCBpbiBtYW55IHdheXM6XHJcbiAqIDx1bD5cclxuICogPGxpPkEgcGFydCBvZiBhIHRyYWNrIGxpa2UgaW4gcGlhbm8tcm9sbCBzZXF1ZW5jZXJzPC9saT5cclxuICogPGxpPkEgcGF0dGVybiBsaWtlIGluIHN0ZXAgc2VxdWVuY2VycywgZHJ1bSBjb21wdXRlcnMgYW5kIHRyYWNrZXJzPC9saT5cclxuICogPGxpPkEgbG9vcCBsaWtlIGluIGxpdmUgc2VxdWVuY2VyczwvbGk+XHJcbiAqIDwvdWw+XHJcbiAqIFRlY2huaWNhbGx5IGl0IGNhbiBzdG9yZSBhbnkgdHlwZSBvZiBldmVudCB5b3VyIHN5c3RlbSBpcyBjYXBhYmxlIG9mLlxyXG4gKiBUaGlzIG1lYW5zIGl0IGlzIG5vdCBsaW1pdGVkIHRvIGF1ZGlvLCBtaWRpLCBvc2Mgb3IgZG14IGJ1dCBjYW4gaG9sZFxyXG4gKiBhbnkgdHlwZSBvZiBqYXZhc2NyaXB0IG9iamVjdC4gQSBwb3NzaWJsZSB1c2VjYXNlIHdvdWxkIGJlIHRvIHRyaWdnZXJcclxuICogc2NyZWVuIGV2ZW50cyB3aXRoIHRoZSBkcmF3IGZ1bmN0aW9uIG9mIHRoZSBzZXF1ZW5jZXIgb2JqZWN0LlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgc291bmQgPSBuZXcgaW50ZXJtaXguU291bmQoc291bmRXYXZlT2JqZWN0KTtcclxuICogdmFyIHNlcSA9IG5ldyBpbnRlcm1peC5TZXF1ZW5jZXIoKTtcclxuICogdmFyIHBhcnQgPSBuZXcgaW50ZXJtaXguUGFydCgpO1xyXG4gKiB2YXIgbm90ZSA9IGludGVybWl4LmV2ZW50cy5jcmVhdGVBdWRpb05vdGUoJ2EzJywgMSwgMCwgc291bmQpO1xyXG4gKiBwYXJ0LmFkZEV2ZW50KG5vdGUsIDApO1xyXG4gKiBwYXJ0LmFkZEV2ZW50KG5vdGUsIDQpO1xyXG4gKiBzZXEuYWRkUGFydChwYXJ0LCAwKTtcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgbGVuZ3RoICAgICAgIExlbmd0aCBvZiB0aGUgcGFydCBpbiA2NHRoIG5vdGVzIChkZWZhdWx0OiA2NClcclxuICovXHJcbnZhciBQYXJ0ID0gZnVuY3Rpb24obGVuZ3RoKSB7XHJcblxyXG4gIHRoaXMucmVzb2x1dGlvbiA9IDE2OyAvLyAocmVzb2x1dGlvbiAqIG11bHRpcGx5KSBzaG91bGQgYWx3YXN5IGJlIDY0XHJcbiAgdGhpcy5tdWx0aXBseSA9IDQ7ICAgIC8vIHJlc29sdXRpb24gbXVsdGlwbGllclxyXG4gIHRoaXMubGVuZ3RoID0gNjQ7ICAgICAvLyBsZW5ndGggb2YgdGhlIHBhdHRlcm4gaW4gNjR0aCBub3Rlc1xyXG4gIHRoaXMubmFtZSA9ICdQYXJ0JzsgICAvLyBuYW1lIG9mIHRoaXMgcGFydFxyXG4gIHRoaXMucGF0dGVybiA9IFtdOyAgICAvLyB0aGUgYWN0dWFsIHBhdHRlcm4gd2l0aCBub3RlcyBldGMuXHJcblxyXG4gIGlmIChsZW5ndGgpIHtcclxuICAgIHRoaXMubGVuZ3RoID0gbGVuZ3RoO1xyXG4gIH1cclxuXHJcbiAgdGhpcy5wYXR0ZXJuID0gdGhpcy5pbml0UGF0dGVybih0aGlzLmxlbmd0aCk7XHJcbn07XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBhbiBlbXB0eSBwYXR0ZXJuIGZvciB0aGUgcGFydC5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7ZmxvYXR9ICBsZW5ndGggIExlbmd0aCBvZiB0aGUgcGF0dGVybiBtZXN1cmVkIGluIGJhcnMgKDQgYmVhdHMgPSAxIGJhcilcclxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgY3VycmVudCBjb250ZXh0IHRvIG1ha2UgdGhlIGZ1bmN0aW9uIGNoYWluYWJsZS5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmluaXRQYXR0ZXJuID0gZnVuY3Rpb24obGVuZ3RoKSB7XHJcbiAgdmFyIHBhdHRlcm4gPSBbXTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IChsZW5ndGgpOyBpKyspIHtcclxuICAgIHBhdHRlcm5baV0gPSBbXTtcclxuICB9XHJcbiAgcmV0dXJuIHBhdHRlcm47XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBhbiBldmVudCB0byB0aGUgcGF0dGVybiBhdCBhIGdpdmVuIHBvc2l0aW9uXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgIFRoZSBldmVudCAobm90ZSwgY29udHJvbGxlciwgd2hhdGV2ZXIpXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gIFBvc2l0aW9uIGluIHRoZSBwYXR0ZXJuXHJcbiAqIEByZXR1cm4ge09iamVjdH0gVGhlIGN1cnJlbnQgY29udGV4dCB0byBtYWtlIHRoZSBmdW5jdGlvbiBjaGFpbmFibGUuXHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5hZGRFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBwb3NpdGlvbikge1xyXG4gIGlmIChwb3NpdGlvbiA8PSB0aGlzLnJlc29sdXRpb24pIHtcclxuICAgIHZhciBwb3MgPSAocG9zaXRpb24pICogdGhpcy5tdWx0aXBseTtcclxuICAgIHRoaXMucGF0dGVybltwb3NdLnB1c2goc2VxRXZlbnQpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bvc2l0aW9uIG91dCBvZiBwYXR0ZXJuIGJvdW5kcy4nKTtcclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVtb3ZlcyBhbiBldmVudCBhdCBhIGdpdmVuIHBvc2l0aW9uXHJcbiAqIEBwYXJhbSAge09iamVjdH0gc2VxRXZlbnQgIFRoZSBldmVudCAobm90ZSwgY29udHJvbGxlciwgd2hhdGV2ZXIpXHJcbiAqIEBwYXJhbSAge0ludH0gICAgcG9zaXRpb24gIFBvc2l0aW9uIGluIHRoZSBwYXR0ZXJuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBwb3NpdGlvbikge1xyXG4gIHZhciBwb3MgPSAocG9zaXRpb24pICogdGhpcy5tdWx0aXBseTtcclxuICB2YXIgaW5kZXggPSB0aGlzLnBhdHRlcm5bcG9zXS5pbmRleE9mKHNlcUV2ZW50KTtcclxuICB0aGlzLnBhdHRlcm5bcG9zXS5zcGxpY2UoaW5kZXgsIDEpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgbGVuZ3RoIG9mIHRoZSBwYXR0ZXJuIGluIDY0dGggbm90ZXNcclxuICogQHJldHVybiB7SW50fSAgICBMZW5ndGggb2YgdGhlIHBhdHRlcm5cclxuICovXHJcblBhcnQucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnBhdHRlcm4ubGVuZ3RoO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCBhbGwgcG9zaXRpb25zIHRoYXQgY29udGFpbiBhdCBsZWFzdCBvbmUgZXZlbnQuXHJcbiAqIENhbiBiZSBoYW5keSB0byBkcmF3IGV2ZW50cyBvbiB0aGUgc2NyZWVuLlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5mcm9tIHtAdHV0b3JpYWwgU3RlcHNlcXVlbmNlcn08L2NhcHRpb24+XHJcbiAqIGJkU3RlcHMgPSBiZFBhcnQuZ2V0Tm90ZVBvc2l0aW9ucygpO1xyXG4gKiBiZFN0ZXBzLmZvckVhY2goZnVuY3Rpb24ocG9zKSB7XHJcbiAqICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2JkJyArIHBvcykuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJ3JlZCc7XHJcbiAqIH0pO1xyXG4gKiBAcmV0dXJuIHtBcnJheX0gIExpc3Qgd2l0aCBhbGwgbm9uLWVtcHR5IHBhdHRlcm4gZW50cmllc1xyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZ2V0Tm90ZVBvc2l0aW9ucyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBwb3NpdGlvbnMgPSBbXTtcclxuICB0aGlzLnBhdHRlcm4uZm9yRWFjaChmdW5jdGlvbihlbCwgaW5kZXgpIHtcclxuICAgIGlmIChlbC5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHBvc2l0aW9ucy5wdXNoKGluZGV4IC8gdGhpcy5tdWx0aXBseSk7XHJcbiAgICB9XHJcbiAgfSwgdGhpcyk7XHJcbiAgcmV0dXJuIHBvc2l0aW9ucztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmRzIGEgcGFydCBhdCB0aGUgdG9wL3N0YXJ0LlxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGV4dExlbmd0aCBMZW5ndGggaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuUGFydC5wcm90b3R5cGUuZXh0ZW5kT25Ub3AgPSBmdW5jdGlvbihleHRMZW5ndGgpIHtcclxuICB2YXIgZXh0ZW5zaW9uID0gdGhpcy5pbml0UGF0dGVybihleHRMZW5ndGgpO1xyXG4gIHRoaXMucGF0dGVybiA9IGV4dGVuc2lvbi5jb25jYXQodGhpcy5wYXR0ZXJuKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmRzIGEgcGFydCBhdCB0aGUgZW5kXHJcbiAqIEBwYXJhbSAge2Zsb2F0fSAgZXh0TGVuZ3RoIExlbmd0aCBpbiA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5QYXJ0LnByb3RvdHlwZS5leHRlbmRPbkVuZCA9IGZ1bmN0aW9uKGV4dExlbmd0aCkge1xyXG4gIHZhciBleHRlbnNpb24gPSB0aGlzLmluaXRQYXR0ZXJuKGV4dExlbmd0aCk7XHJcbiAgdGhpcy5wYXR0ZXJuID0gdGhpcy5wYXR0ZXJuLmNvbmNhdChleHRlbnNpb24pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQYXJ0O1xyXG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgd29yayA9IHJlcXVpcmUoJ3dlYndvcmtpZnknKTsgICAvL3ByZXBhcmVzIHRoZSB3b3JrZXIgZm9yIGJyb3dzZXJpZnlcclxudmFyIGNvcmUgPSByZXF1aXJlKCcuL2NvcmUuanMnKTtcclxudmFyIHdvcmtlciA9IHJlcXVpcmUoJy4vc2NoZWR1bGVXb3JrZXIuanMnKTtcclxuXHJcbi8qKlxyXG4gKiBUaGUgbWFpbiBjbGFzcyBvZiB0aGUgc2VxdWVuY2VyLiBJdCBkb2VzIHRoZSBxdWV1aW5nIG9mXHJcbiAqIHBhcnRzIGFuZCBldmVudHMgYW5kIHJ1bnMgdGhlIHNjaGVkdWxlcnMgdGhhdCBmaXJlIGV2ZW50c1xyXG4gKiBhbmQgZHJhd3MgdG8gdGhlIHNjcmVlbi5cclxuICogQGV4YW1wbGVcclxuICogdmFyIHBhcnQgPSBuZXcgaW50ZXJtaXguUGFydCgpO1xyXG4gKiB2YXIgc2VxID0gbmV3IGludGVybWl4LlNlcXVlbmNlcigpO1xyXG4gKiBwYXJ0LmFkZEV2ZW50KHNvbWVOb3RlLCAwKTtcclxuICogc2VxLmFkZFBhcnQocGFydCwgMCk7XHJcbiAqIHNlcS5zdGFydCgpO1xyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbnZhciBTZXF1ZW5jZXIgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHRoaXMuYWMgPSBjb3JlOyAgICAgICAgICAgICAvL2N1cnJlbnRseSBqdXN0IHVzZWQgZm9yIHRlc3RzXHJcbiAgdGhpcy5icG0gPSAxMjA7ICAgICAgICAgICAgIC8vYmVhdHMgcGVyIG1pbnV0ZVxyXG4gIHRoaXMucmVzb2x1dGlvbiA9IDY0OyAgICAgICAvL3Nob3J0ZXN0IHBvc3NpYmxlIG5vdGUuIFlvdSBub3JtYWxseSBkb24ndCB3YW50IHRvIHRvdWNoIHRoaXMuXHJcbiAgdGhpcy5pbnRlcnZhbCA9IDEwMDsgICAgICAgIC8vdGhlIGludGVydmFsIGluIG1pbGlzZWNvbmRzIHRoZSBzY2hlZHVsZXIgZ2V0cyBpbnZva2VkLlxyXG4gIHRoaXMubG9va2FoZWFkID0gMC4zOyAgICAgICAvL3RpbWUgaW4gc2Vjb25kcyB0aGUgc2NoZWR1bGVyIGxvb2tzIGFoZWFkLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL3Nob3VsZCBiZSBsb25nZXIgdGhhbiBpbnRlcnZhbC5cclxuICB0aGlzLnF1ZXVlID0gW107ICAgICAgICAgICAgLy9MaXN0IHdpdGggYWxsIHBhcnRzIG9mIHRoZSBzY29yZVxyXG4gIHRoaXMucnVucXVldWUgPSBbXTsgICAgICAgICAvL2xpc3Qgd2l0aCBwYXJ0cyB0aGF0IGFyZSBwbGF5aW5nIG9yIHdpbGwgYmUgcGxheWVkIHNob3J0bHlcclxuXHJcbiAgdGhpcy50aW1lUGVyU3RlcDsgICAgICAgICAgIC8vcGVyaW9kIG9mIHRpbWUgYmV0d2VlbiB0d28gc3RlcHNcclxuICB0aGlzLm5leHRTdGVwVGltZSA9IDA7ICAgICAgLy90aW1lIGluIHNlY29uZHMgd2hlbiB0aGUgbmV4dCBzdGVwIHdpbGwgYmUgdHJpZ2dlcmVkXHJcbiAgdGhpcy5uZXh0U3RlcCA9IDA7ICAgICAgICAgIC8vcG9zaXRpb24gaW4gdGhlIHF1ZXVlIHRoYXQgd2lsbCBnZXQgdHJpZ2dlcmVkIG5leHRcclxuICB0aGlzLmxhc3RQbGF5ZWRTdGVwID0gMDsgICAgLy9zdGVwIGluIHF1ZXVlIHRoYXQgd2FzIHBsYXllZCAobm90IHRyaWdnZXJlZCkgcmVjZW50bHkgKHVzZWQgZm9yIGRyYXdpbmcpLlxyXG4gIHRoaXMubG9vcCA9IGZhbHNlOyAgICAgICAgICAvL3BsYXkgYSBzZWN0aW9uIG9mIHRoZSBxdWV1ZSBpbiBhIGxvb3BcclxuICB0aGlzLmxvb3BTdGFydDsgICAgICAgICAgICAgLy9maXJzdCBzdGVwIG9mIHRoZSBsb29wXHJcbiAgdGhpcy5sb29wRW5kOyAgICAgICAgICAgICAgIC8vbGFzdCBzdGVwIG9mIHRoZSBsb29wXHJcbiAgdGhpcy5pc1J1bm5pbmcgPSBmYWxzZTsgICAgIC8vdHJ1ZSBpZiBzZXF1ZW5jZXIgaXMgcnVubmluZywgb3RoZXJ3aXNlIGZhbHNlXHJcbiAgdGhpcy5hbmltYXRpb25GcmFtZTsgICAgICAgIC8vaGFzIHRvIGJlIG92ZXJyaWRkZW4gd2l0aCBhIGZ1bmN0aW9uLiBXaWxsIGJlIGNhbGxlZCBpbiB0aGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9kcmF3IGZ1bmN0aW9uIHdpdGggdGhlIGxhc3RQbGF5ZWRTdGVwIGludCBhcyBwYXJhbWV0ZXIuXHJcblxyXG4gIC8vIHNldCB0aW1lIHBlciBzZXRUaW1lUGVyU3RlcFxyXG4gIHRoaXMudGltZVBlclN0ZXAgPSB0aGlzLnNldFRpbWVQZXJTdGVwKHRoaXMuYnBtLCB0aGlzLnJlc29sdXRpb24pO1xyXG5cclxuICAvLyBJbml0aWFsaXplIHRoZSBzY2hlZHVsZXItdGltZXJcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyID0gd29yayh3b3JrZXIpO1xyXG5cclxuICAvKmVzbGludC1lbmFibGUgKi9cclxuXHJcbiAgdGhpcy5zY2hlZHVsZVdvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihlKSB7XHJcbiAgICBpZiAoZS5kYXRhID09PSAndGljaycpIHtcclxuICAgICAgc2VsZi5zY2hlZHVsZXIoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKHsnaW50ZXJ2YWwnOiB0aGlzLmludGVydmFsfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVhZHMgZXZlbnRzIGZyb20gdGhlIG1hc3RlciBxdWV1ZSBhbmQgZmlyZXMgdGhlbS5cclxuICogSXQgZ2V0cyBjYWxsZWQgYXQgYSBjb25zdGFudCByYXRlLCBsb29rcyBhaGVhZCBpblxyXG4gKiB0aGUgcXVldWUgYW5kIGZpcmVzIGFsbCBldmVudHMgaW4gdGhlIG5lYXIgZnV0dXJlXHJcbiAqIHdpdGggYSBkZWxheSBjb21wdXRlZCBmcm9tIHRoZSBjdXJyZW50IGJwbSB2YWx1ZS5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2NoZWR1bGVyID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIGxpbWl0ID0gY29yZS5jdXJyZW50VGltZSArIHRoaXMubG9va2FoZWFkO1xyXG4gIC8vIGlmIGludm9rZWQgZm9yIHRoZSBmaXJzdCB0aW1lIG9yIHByZXZpb3VzbHkgc3RvcHBlZFxyXG4gIGlmICh0aGlzLm5leHRTdGVwVGltZSA9PT0gMCkge1xyXG4gICAgdGhpcy5uZXh0U3RlcFRpbWUgPSBjb3JlLmN1cnJlbnRUaW1lO1xyXG4gIH1cclxuXHJcbiAgd2hpbGUgKHRoaXMubmV4dFN0ZXBUaW1lIDwgbGltaXQpIHtcclxuICAgIHRoaXMuYWRkUGFydHNUb1J1bnF1ZXVlKCk7XHJcbiAgICB0aGlzLmZpcmVFdmVudHMoKTtcclxuICAgIHRoaXMubmV4dFN0ZXBUaW1lICs9IHRoaXMudGltZVBlclN0ZXA7XHJcblxyXG4gICAgdGhpcy5zZXRRdWV1ZVBvaW50ZXIoKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogTG9va3MgaW4gdGhlIG1hc3RlciBxdWV1ZSBmb3IgcGFydHMgYW5kIGFkZHNcclxuICogY29waWVzIG9mIHRoZW0gdG8gdGhlIHJ1bnF1ZXVlLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5hZGRQYXJ0c1RvUnVucXVldWUgPSBmdW5jdGlvbigpIHtcclxuICBpZiAodGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXSkge1xyXG4gICAgaWYgKHRoaXMucXVldWVbdGhpcy5uZXh0U3RlcF0ubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgIHZhciBwYXJ0ID0gdGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXVswXTtcclxuICAgICAgcGFydC5wb2ludGVyID0gMDtcclxuICAgICAgdGhpcy5ydW5xdWV1ZS5wdXNoKHBhcnQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5xdWV1ZVt0aGlzLm5leHRTdGVwXS5mb3JFYWNoKGZ1bmN0aW9uKHBhcnQpIHtcclxuICAgICAgICBwYXJ0LnBvaW50ZXIgPSAwO1xyXG4gICAgICAgIHRoaXMucnVucXVldWUucHVzaChwYXJ0KTtcclxuICAgICAgfSwgdGhpcyk7XHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlbGV0ZXMgcGFydHMgZnJvbSBydW5xdWV1ZS4gSXQgaXMgaW1wb3J0YW50LCB0aGF0IHRoZSBpbmRpY2VzXHJcbiAqIG9mIHRoZSBwYXJ0cyBhcmUgc29ydGVkIGZyb20gbWF4IHRvIG1pbi4gT3RoZXJ3aXNlIHRoZSBmb3JFYWNoXHJcbiAqIGxvb3Agd29uJ3Qgd29yay5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9IGluZGljZXMgIEluZGljZXMgb2YgdGhlIHBhcnRzIGluIHRoZSBydW5xdWV1ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5kZWxldGVQYXJ0c0Zyb21SdW5xdWV1ZSA9IGZ1bmN0aW9uKGluZGljZXMpIHtcclxuICBpZiAoaW5kaWNlcy5sZW5ndGggPiAwKSB7XHJcbiAgICBpbmRpY2VzLmZvckVhY2goZnVuY3Rpb24oaWQpIHtcclxuICAgICAgZGVsZXRlIHRoaXMucnVucXVldWVbaWRdLnBvaW50ZXI7XHJcbiAgICAgIHRoaXMucnVucXVldWUuc3BsaWNlKGlkLCAxKTtcclxuICAgIH0sIHRoaXMpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBGaXJlcyBhbGwgZXZlbnRzIGZvciB0aGUgdXBjb21taW5nIHN0ZXAuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmZpcmVFdmVudHMgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgbWFya0ZvckRlbGV0ZSA9IFtdO1xyXG4gIHRoaXMucnVucXVldWUuZm9yRWFjaChmdW5jdGlvbihwYXJ0LCBpbmRleCkge1xyXG4gICAgaWYgKHBhcnQucG9pbnRlciA9PT0gcGFydC5sZW5ndGggLSAxKSB7XHJcbiAgICAgIG1hcmtGb3JEZWxldGUudW5zaGlmdChpbmRleCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgc2VxRXZlbnRzID0gcGFydC5wYXR0ZXJuW3BhcnQucG9pbnRlcl07XHJcbiAgICAgIGlmIChzZXFFdmVudHMgJiYgc2VxRXZlbnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICBzZXFFdmVudHMuZm9yRWFjaChmdW5jdGlvbihzZXFFdmVudCkge1xyXG4gICAgICAgICAgdGhpcy5wcm9jZXNzU2VxRXZlbnQoc2VxRXZlbnQsIHRoaXMubmV4dFN0ZXBUaW1lKTtcclxuICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgfSBlbHNlIGlmIChzZXFFdmVudHMgJiYgc2VxRXZlbnRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc1NlcUV2ZW50KHNlcUV2ZW50c1swXSwgdGhpcy5uZXh0U3RlcFRpbWUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBwYXJ0LnBvaW50ZXIrKztcclxuICB9LCB0aGlzKTtcclxuICB0aGlzLmRlbGV0ZVBhcnRzRnJvbVJ1bnF1ZXVlKG1hcmtGb3JEZWxldGUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEludm9rZXMgdGhlIGFwcHJvcHJpYXRlIHN1YnN5c3RlbSB0byBwcm9jZXNzIHRoZSBldmVudFxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNlcUV2ZW50ICBUaGUgZXZlbnQgdG8gcHJvY2Vzc1xyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGRlbGF5ICAgICB0aW1lIGluIHNlY29uZHMgd2hlbiB0aGUgZXZlbnQgc2hvdWxkIHN0YXJ0XHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnByb2Nlc3NTZXFFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50LCBkZWxheSkge1xyXG4gIGlmIChkZWxheSkge1xyXG4gICAgc2VxRXZlbnQucHJvcHNbJ2RlbGF5J10gPSBkZWxheTtcclxuICB9XHJcbiAgc2VxRXZlbnQucHJvcHMuaW5zdHJ1bWVudC5wcm9jZXNzU2VxRXZlbnQoc2VxRXZlbnQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHBvaW50ZXIgdG8gdGhlIG5leHQgc3RlcCB0aGF0IHNob3VsZCBiZSBwbGF5ZWRcclxuICogaW4gdGhlIG1hc3RlciBxdWV1ZS4gSWYgd2UncmUgcGxheWluZyBpbiBsb29wIG1vZGUsXHJcbiAqIGp1bXAgYmFjayB0byBsb29wc3RhcnQgd2hlbiBlbmQgb2YgbG9vcCBpcyByZWFjaGVkLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gICB7SW50fSAgIHBvc2l0aW9uICBOZXcgcG9zaXRpb24gaW4gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcmV0dXJuICB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2V0UXVldWVQb2ludGVyID0gZnVuY3Rpb24ocG9zaXRpb24pIHtcclxuICBpZiAodGhpcy5sb29wKSB7XHJcbiAgICBpZiAodGhpcy5uZXh0U3RlcCA+PSB0aGlzLmxvb3BFbmQpIHtcclxuICAgICAgdGhpcy5uZXh0U3RlcCA9IHRoaXMubG9vcFN0YXJ0O1xyXG4gICAgICB0aGlzLnJ1blF1ZXVlID0gW107XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm5leHRTdGVwKys7XHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmIChwb3NpdGlvbikge1xyXG4gICAgdGhpcy5uZXh0U3RlcCA9IHBvc2l0aW9uO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aGlzLm5leHRTdGVwKys7XHJcbiAgfVxyXG4gIC8vIGNvbnNvbGUubG9nKCduZXh0IHN0ZXA6ICcgKyB0aGlzLm5leHRTdGVwKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdGFydHMgdGhlIHNlcXVlbmNlclxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICghdGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIHRoaXMuc2NoZWR1bGVXb3JrZXIucG9zdE1lc3NhZ2UoJ3N0YXJ0Jyk7XHJcbiAgICB0aGlzLmlzUnVubmluZyA9IHRydWU7XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuZHJhdy5iaW5kKHRoaXMpKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogU3RvcHMgdGhlIHNlcXVlbmNlciAoaGFsdHMgYXQgdGhlIGN1cnJlbnQgcG9zaXRpb24pXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnNjaGVkdWxlV29ya2VyLnBvc3RNZXNzYWdlKCdzdG9wJyk7XHJcbiAgLy90aGlzLnJ1blF1ZXVlID0gW107XHJcbiAgdGhpcy5uZXh0U3RlcFRpbWUgPSAwO1xyXG4gIHRoaXMuaXNSdW5uaW5nID0gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogU2NoZWR1bGVyIHRoYXQgcnVucyBhIGRyYXdpbmcgZnVuY3Rpb24gZXZlcnkgdGltZVxyXG4gKiB0aGUgc2NyZWVuIHJlZnJlc2hlcy4gVGhlIGZ1bmN0aW9uIFNlcXVlbmNlci5hbmltYXRpb25GcmFtZSgpXHJcbiAqIGhhcyB0byBiZSBvdmVycmlkZGVuIGJ5IHRoZSBhcHBsaWNhdGlvbiB3aXRoIHN0dWZmIHRvIGJlIGRyYXduIG9uIHRoZSBzY3JlZW4uXHJcbiAqIEl0IGNhbGxzIGl0c2VsZiByZWN1cnNpdmVseSBvbiBldmVyeSBmcmFtZSBhcyBsb25nIGFzIHRoZSBzZXF1ZW5jZXIgaXMgcnVubmluZy5cclxuICogQHByaXZhdGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xyXG4gIC8vIGZpcnN0IHdlJ2xsIGhhdmUgdG8gZmluZCBvdXQsIHdoYXQgc3RlcCB3YXMgcGxheWVkIHJlY2VudGx5LlxyXG4gIC8vIHRoaXMgaXMgc29tZWhvdyBjbHVtc3kgYmVjYXVzZSB0aGUgc2VxdWVuY2VyIGRvZXNuJ3Qga2VlcCB0cmFjayBvZiB0aGF0LlxyXG4gIHZhciBsb29rQWhlYWREZWx0YSA9IHRoaXMubmV4dFN0ZXBUaW1lIC0gY29yZS5jdXJyZW50VGltZTtcclxuICBpZiAobG9va0FoZWFkRGVsdGEgPj0gMCkge1xyXG4gICAgdmFyIHN0ZXBzQWhlYWQgPSBNYXRoLnJvdW5kKGxvb2tBaGVhZERlbHRhIC8gdGhpcy50aW1lUGVyU3RlcCk7XHJcblxyXG4gICAgaWYgKHRoaXMubmV4dFN0ZXAgPCBzdGVwc0FoZWFkKSB7XHJcbiAgICAgIC8vIHdlIGp1c3QganVtcGVkIHRvIHRoZSBzdGFydCBvZiBhIGxvb3BcclxuICAgICAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IHRoaXMubG9vcEVuZCArIHRoaXMubmV4dFN0ZXAgLSBzdGVwc0FoZWFkO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5sYXN0UGxheWVkU3RlcCA9IHRoaXMubmV4dFN0ZXAgLSBzdGVwc0FoZWFkO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudXBkYXRlRnJhbWUodGhpcy5sYXN0UGxheWVkU3RlcCk7XHJcbiAgfVxyXG5cclxuICBpZiAodGhpcy5pc1J1bm5pbmcpIHtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5kcmF3LmJpbmQodGhpcykpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSdW5zIGJldHdlZW4gc2NyZWVuIHJlZnJlc2guIEhhcyB0byBiZSBvdmVycmlkZGVuIGJ5IHRoZVxyXG4gKiBhcHAgdG8gcmVuZGVyIHRvIHRoZSBzY3JlZW4uXHJcbiAqIEBwYXJhbSAge0ludH0gIGxhc3RQbGF5ZWRTdGVwICBUaGUgNjR0aCBzdGVwIHRoYXQgd2FzIHBsYXllZCByZWNlbnRseVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS51cGRhdGVGcmFtZSA9IGZ1bmN0aW9uKGxhc3RQbGF5ZWRTdGVwKSB7XHJcbiAgY29uc29sZS5sb2cobGFzdFBsYXllZFN0ZXApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSBwYXJ0IHRvIHRoZSBtYXN0ZXIgcXVldWUuXHJcbiAqIEBwYXJhbSAge09iamVjdH0gcGFydCAgICAgIEFuIGluc3RhbmNlIG9mIFBhcnRcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiAgUG9zaXRpb24gaW4gdGhlIG1hc3RlciBxdWV1ZVxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5hZGRQYXJ0ID0gZnVuY3Rpb24ocGFydCwgcG9zaXRpb24pIHtcclxuICBpZiAocGFydC5sZW5ndGggJiYgcGFydC5wYXR0ZXJuKSB7XHJcbiAgICBpZiAoIXRoaXMucXVldWVbcG9zaXRpb25dKSB7XHJcbiAgICAgIHRoaXMucXVldWVbcG9zaXRpb25dID0gW107XHJcbiAgICB9XHJcbiAgICB0aGlzLnF1ZXVlW3Bvc2l0aW9uXS5wdXNoKHBhcnQpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0dpdmVuIHBhcmFtZXRlciBkb2VzblxcJ3Qgc2VlbSB0byBiZSBhIHBhcnQgb2JqZWN0Jyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZXMgYSBwYXJ0IG9iamVjdCBmcm9tIHRoZSBtYXN0ZXIgcXVldWVcclxuICogQHBhcmFtICB7T2JqZWN0fSBwYXJ0ICAgICBQYXJ0IGluc3RhbmNlIHRvIGJlIHJlbW92ZWRcclxuICogQHBhcmFtICB7SW50fSAgICBwb3NpdGlvbiBQb3NpdGlvbiBpbiB0aGUgbWFzdGVyIHF1ZXVlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnJlbW92ZVBhcnQgPSBmdW5jdGlvbihwYXJ0LCBwb3NpdGlvbikge1xyXG4gIGlmICh0aGlzLnF1ZXVlW3Bvc2l0aW9uXSBpbnN0YW5jZW9mIEFycmF5ICYmXHJcbiAgICB0aGlzLnF1ZXVlW3Bvc2l0aW9uXS5sZW5ndGggPiAwKSB7XHJcbiAgICB2YXIgaW5kZXggPSB0aGlzLnF1ZXVlW3Bvc2l0aW9uXS5pbmRleE9mKHBhcnQpO1xyXG4gICAgdGhpcy5xdWV1ZVtwb3NpdGlvbl0uc3BsaWNlKGluZGV4LCAxKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdQYXJ0IG5vdCBmb3VuZCBhdCBwb3NpdGlvbiAnICsgcG9zaXRpb24gKyAnLicpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgYmVhdHMgcGVyIG1pbnV0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgYnBtIGJlYXRzIHBlciBtaW51dGVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNlcXVlbmNlci5wcm90b3R5cGUuc2V0QnBtID0gZnVuY3Rpb24oYnBtKSB7XHJcbiAgdGhpcy5icG0gPSBicG07XHJcbiAgdGhpcy50aW1lUGVyU3RlcCA9IHRoaXMuc2V0VGltZVBlclN0ZXAoYnBtLCB0aGlzLnJlc29sdXRpb24pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvbXB1dGVzIHRoZSB0aW1lIGluIHNlY29uZHMgYXMgZmxvYXQgdmFsdWVcclxuICogYmV0d2VlbiBvbmUgc2hvcnRlc3QgcG9zc3NpYmxlIG5vdGVcclxuICogKDY0dGggYnkgZGVmYXVsdCkgYW5kIHRoZSBuZXh0LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIGJwbSAgICAgICAgYmVhdHMgcGVyIG1pbnV0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICAgIHJlc29sdXRpb24gc2hvcnRlc3QgcG9zc2libGUgbm90ZSB2YWx1ZVxyXG4gKiBAcmV0dXJuIHtmbG9hdH0gICAgICAgICAgICAgdGltZSBpbiBzZWNvbmRzXHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLnNldFRpbWVQZXJTdGVwID0gZnVuY3Rpb24oYnBtLCByZXNvbHV0aW9uKSB7XHJcbiAgcmV0dXJuICg2MCAqIDQpIC8gKGJwbSAqIHJlc29sdXRpb24pO1xyXG59O1xyXG5cclxuU2VxdWVuY2VyLnByb3RvdHlwZS5nZXRMYXN0UGxheWVkU3RlcCA9IGZ1bmN0aW9uKCkge1xyXG5cclxufTtcclxuXHJcbi8qKlxyXG4gKiBNYWtlcyBhIGNvcHkgb2YgYSBmbGF0IGFycmF5LlxyXG4gKiBVc2VzIGEgcHJlLWFsbG9jYXRlZCB3aGlsZS1sb29wXHJcbiAqIHdoaWNoIHNlZW1zIHRvIGJlIHRoZSBmYXN0ZWQgd2F5XHJcbiAqIChieSBmYXIpIG9mIGRvaW5nIHRoaXM6XHJcbiAqIGh0dHA6Ly9qc3BlcmYuY29tL25ldy1hcnJheS12cy1zcGxpY2UtdnMtc2xpY2UvMTEzXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0FycmF5fSBzb3VyY2VBcnJheSBBcnJheSB0aGF0IHNob3VsZCBiZSBjb3BpZWQuXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBDb3B5IG9mIHRoZSBzb3VyY2UgYXJyYXkuXHJcbiAqL1xyXG5TZXF1ZW5jZXIucHJvdG90eXBlLmNvcHlBcnJheSA9IGZ1bmN0aW9uKHNvdXJjZUFycmF5KSB7XHJcbiAgdmFyIGRlc3RBcnJheSA9IG5ldyBBcnJheShzb3VyY2VBcnJheS5sZW5ndGgpO1xyXG4gIHZhciBpID0gc291cmNlQXJyYXkubGVuZ3RoO1xyXG4gIHdoaWxlIChpLS0pIHtcclxuICAgIGRlc3RBcnJheVtpXSA9IHNvdXJjZUFycmF5W2ldO1xyXG4gIH1cclxuICByZXR1cm4gZGVzdEFycmF5O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTZXF1ZW5jZXI7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcblxyXG4vKipcclxuICogPHA+XHJcbiAqIFBsYXkgYSBzb3VuZCB0aGF0IGNhbiBiZSBsb29wZWQuIFBhdXNlL1N0YXJ0IHdvcmtzIHNhbXBsZS1hY2N1cmF0ZVxyXG4gKiBhdCBhbnkgcmF0ZS4gSGl0IHRoZSBzdGFydCBidXR0b24gbXVsdGlwbGUgdGltZXMgdG8gaGF2ZSBtdWx0aXBsZVxyXG4gKiBzb3VuZHMgcGxheWVkLiBBbGwgcGFyYW1ldGVycyBhcmUgYWRqdXN0YWJsZSBpbiByZWFsdGltZS5cclxuICogPC9wPlxyXG4gKlxyXG4gKiBAZXhhbXBsZVxyXG4gKiB2YXIgc291bmRXYXZlID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZSgnYXVkaW9maWxlLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgaW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQuc3RhcnQoKTtcclxuICogQHR1dG9yaWFsIFNvdW5kXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0gIHtPYmplY3R9IHNvdW5kV2F2ZSBTb3VuZFdhdmUgb2JqZWN0IGluY2x1ZGluZyB0aGUgYnVmZmVyIHdpdGggYXVkaW8gZGF0YSB0byBiZSBwbGF5ZWRcclxuICovXHJcbnZhciBTb3VuZCA9IGZ1bmN0aW9uKHNvdW5kV2F2ZSkge1xyXG5cclxuICB0aGlzLndhdmUgPSBudWxsO1xyXG4gIHRoaXMuYWMgPSBjb3JlOyAgICAgICAgICAgLy9jdXJyZW50bHkganVzdCB1c2VkIGZvciB0ZXN0c1xyXG4gIHRoaXMucXVldWUgPSBbXTsgICAgICAgICAgLy9hbGwgY3VycmVudGx5IGFjdGl2ZSBzdHJlYW1zXHJcbiAgdGhpcy5sb29wID0gZmFsc2U7XHJcbiAgdGhpcy5nYWluTm9kZSA9IG51bGw7XHJcbiAgdGhpcy5wYW5uZXJOb2RlID0gbnVsbDtcclxuXHJcbiAgdGhpcy5zb3VuZExlbmd0aCA9IDA7XHJcbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xyXG4gIHRoaXMuc3RhcnRPZmZzZXQgPSAwO1xyXG4gIHRoaXMuc3RhcnRPZmZzZXRzID0gW107ICAgLy9ob2xkcyBzdGFydCBvZmZzZXRzIGlmIHBhdXNlZFxyXG4gIHRoaXMuc3RhcnRUaW1lID0gMDsgICAgICAgLy93aGVuIHRoZSBzb3VuZCBzdGFydHMgdG8gcGxheVxyXG4gIHRoaXMubG9vcFN0YXJ0ID0gMDtcclxuICB0aGlzLmxvb3BFbmQgPSBudWxsO1xyXG4gIHRoaXMucGxheWJhY2tSYXRlID0gMTtcclxuICB0aGlzLmRldHVuZSA9IDA7XHJcblxyXG4gIGlmIChzb3VuZFdhdmUpIHtcclxuICAgIHRoaXMud2F2ZSA9IHNvdW5kV2F2ZTtcclxuICAgIHRoaXMuYnVmZmVyID0gc291bmRXYXZlLmJ1ZmZlcjtcclxuICAgIHRoaXMuc291bmRMZW5ndGggPSB0aGlzLmxvb3BFbmQgPSB0aGlzLmJ1ZmZlci5kdXJhdGlvbjtcclxuICAgIHRoaXMuc2V0dXBBdWRpb0NoYWluKCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IgaW5pdGlhbGlzaW5nIFNvdW5kIG9iamVjdDogcGFyYW1ldGVyIG1pc3NpbmcuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBnYWluIGFuZCBzdGVyZW8tcGFubmVyIG5vZGUsIGNvbm5lY3RzIHRoZW1cclxuICogKGdhaW4gLT4gcGFubmVyKSBhbmQgc2V0cyBnYWluIHRvIDEgKG1heCB2YWx1ZSkuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0dXBBdWRpb0NoYWluID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5nYWluTm9kZSA9IGNvcmUuY3JlYXRlR2FpbigpO1xyXG4gIHRoaXMucGFubmVyTm9kZSA9IGNvcmUuY3JlYXRlU3RlcmVvUGFubmVyKCk7XHJcbiAgdGhpcy5nYWluTm9kZS5jb25uZWN0KHRoaXMucGFubmVyTm9kZSk7XHJcbiAgdGhpcy5wYW5uZXJOb2RlLmNvbm5lY3QoY29yZS5kZXN0aW5hdGlvbik7XHJcbiAgdGhpcy5nYWluTm9kZS5nYWluLnZhbHVlID0gMTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGFuZCBjb25maWd1cmVzIGEgQnVmZmVyU291cmNlTm9kZVxyXG4gKiB0aGF0IGNhbiBiZSBwbGF5ZWQgb25jZSBhbmQgdGhlbiBkZXN0cm95cyBpdHNlbGYuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEByZXR1cm4ge0J1ZmZlclNvdXJjZU5vZGV9IFRoZSBCdWZmZXJTb3VyY2VOb2RlXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuY3JlYXRlQnVmZmVyU291cmNlID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBidWZmZXJTb3VyY2UgPSBjb3JlLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gIGJ1ZmZlclNvdXJjZS5idWZmZXIgPSB0aGlzLmJ1ZmZlcjtcclxuICBidWZmZXJTb3VyY2UuY29ubmVjdCh0aGlzLmdhaW5Ob2RlKTtcclxuICBidWZmZXJTb3VyY2Uub25lbmRlZCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9jb25zb2xlLmxvZygnb25lbmRlZCBmaXJlZCcpO1xyXG4gICAgc2VsZi5kZXN0cm95QnVmZmVyU291cmNlKGJ1ZmZlclNvdXJjZSk7XHJcbiAgfTtcclxuICByZXR1cm4gYnVmZmVyU291cmNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlc3Ryb3llcyBhIGdpdmVuIEF1ZGlvQnVmZmVyU291cmNlTm9kZSBhbmQgZGVsZXRlcyBpdFxyXG4gKiBmcm9tIHRoZSBzb3VyY2VOb2RlIHF1ZXVlLiBUaGlzIGlzIHVzZWQgaW4gdGhlIG9uZW5kZWRcclxuICogY2FsbGJhY2sgb2YgYWxsIEJ1ZmZlclNvdXJjZU5vZGVzIHRvIGF2b2lkIGRlYWQgcmVmZXJlbmNlcy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7YnNOb2RlfSBic05vZGUgdGhlIGJ1ZmZlclNvdXJjZSB0byBiZSBkZXN0cm95ZWQuXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZGVzdHJveUJ1ZmZlclNvdXJjZSA9IGZ1bmN0aW9uKGJzTm9kZSkge1xyXG4gIGJzTm9kZS5kaXNjb25uZWN0KCk7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUsIGluZGV4KSB7XHJcbiAgICBpZiAobm9kZSA9PT0gYnNOb2RlKSB7XHJcbiAgICAgIHRoaXMucXVldWUuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxuICB9LCB0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdGFydHMgYSBzb3VuZCAoQXVkaW9CdWZmZXJTb3VyY2VOb2RlKSBhbmQgc3RvcmVzIGEgcmVmZXJlbmNlc1xyXG4gKiBpbiBhIHF1ZXVlLiBUaGlzIGVuYWJsZXMgeW91IHRvIHBsYXkgbXVsdGlwbGUgc291bmRzIGF0IG9uY2VcclxuICogYW5kIGV2ZW4gc3RvcCB0aGVtIGFsbCBhdCBhIGdpdmVuIHRpbWUuXHJcbiAqIEBwYXJhbSAge0Jvb2xlYW59IHBsYXlMb29wZWQgV2hldGhlciB0aGUgc291bmQgc2hvdWxkIGJlIGxvb3BlZCBvciBub3RcclxuICogQHBhcmFtICB7ZmxvYXR9ICAgZGVsYXkgICAgICBUaW1lIGluIHNlY29uZHMgdGhlIHNvdW5kIHBhdXNlcyBiZWZvcmUgdGhlIHN0cmVhbSBzdGFydHNcclxuICogQHBhcmFtICB7ZmxvYXR9ICAgZHVyYXRpb24gICBUaW1lIHByZXJpb2QgYWZ0ZXIgdGhlIHN0cmVhbSBzaG91bGQgZW5kXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbihwbGF5TG9vcGVkLCBkZWxheSwgZHVyYXRpb24pIHtcclxuICBpZiAodGhpcy5pc1BhdXNlZCAmJiB0aGlzLnF1ZXVlLmxlbmd0aCA+IDApIHtcclxuICAgIHRoaXMucmVzdW1lKCk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHZhciBzdGFydFRpbWUgPSAwO1xyXG5cclxuICAgIGlmIChkZWxheSkge1xyXG4gICAgICBzdGFydFRpbWUgPSBkZWxheTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHN0YXJ0VGltZSA9IGNvcmUuY3VycmVudFRpbWU7XHJcbiAgICB9XHJcbiAgICB2YXIgYnMgPSB0aGlzLmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG5cclxuICAgIGlmIChwbGF5TG9vcGVkKSB7XHJcbiAgICAgIGJzLmxvb3AgPSBwbGF5TG9vcGVkO1xyXG4gICAgICBicy5sb29wU3RhcnQgPSB0aGlzLmxvb3BTdGFydDtcclxuICAgICAgYnMubG9vcEVuZCA9IHRoaXMubG9vcEVuZDtcclxuICAgIH1cclxuICAgIGJzLnBsYXliYWNrUmF0ZS52YWx1ZSA9IGJzLnRtcFBsYXliYWNrUmF0ZSA9IHRoaXMucGxheWJhY2tSYXRlO1xyXG4gICAgYnMuZGV0dW5lLnZhbHVlID0gdGhpcy5kZXR1bmU7XHJcbiAgICBicy5zdGFydFRpbWUgPSBzdGFydFRpbWU7ICAgLy8gZXh0ZW5kIG5vZGUgd2l0aCBhIHN0YXJ0dGltZSBwcm9wZXJ0eVxyXG5cclxuICAgIHRoaXMucXVldWUucHVzaChicyk7XHJcbiAgICBpZiAoZHVyYXRpb24pIHtcclxuICAgICAgYnMuc3RhcnQoc3RhcnRUaW1lLCB0aGlzLnN0YXJ0T2Zmc2V0LCBkdXJhdGlvbik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBicy5zdGFydChzdGFydFRpbWUsIHRoaXMuc3RhcnRPZmZzZXQpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc3RhcnRPZmZzZXQgPSAwO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdG9wcyBhbGwgYXVkaW8gc3RyZWFtLCBldmVuIHRoZSBvbmVzIHRoYXQgYXJlIGp1c3Qgc2NoZWR1bGVkLlxyXG4gKiBJdCBhbHNvIGNsZWFucyB0aGUgcXVldWUgc28gdGhhdCB0aGUgc291bmQgb2JqZWN0IGlzIHJlYWR5IGZvciBhbm90aGVyIHJvdW5kLlxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5zdG9wKCk7XHJcbiAgICBub2RlLmRpc2Nvbm5lY3QoKTtcclxuICB9KTtcclxuICB0aGlzLnF1ZXVlID0gW107ICAvL3JlbGVhc2UgYWxsIHJlZmVyZW5jZXNcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdG9wcyBhbGwgYXVkaW8gc3RyZWFtcyBvZiB0aGlzIHNvdW5kIHRlbXBvcmFyaWx5LlxyXG4gKiBUaGlzIGN1cnJlbnRseSBqdXN0IHdvcmtzIGluIENocm9tZSA0OSsgb25seS5cclxuICogSWYgeW91IHdhbnQgYSBnbG9iYWwsIGFjY3VyYXRlIHBhdXNlIGZ1bmN0aW9uXHJcbiAqIHVzZSBzdXNwZW5kL3Jlc3VtZSBmcm9tIHRoZSBjb3JlIG1vZHVsZS5cclxuICogQHJldHVybiAge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbigpIHtcclxuICBpZiAoIXRoaXMuaXNQYXVzZWQpIHtcclxuICAgIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICAgIG5vZGUudG1wUGxheWJhY2tSYXRlID0gbm9kZS5wbGF5YmFja1JhdGUudmFsdWU7XHJcbiAgICAgIG5vZGUucGxheWJhY2tSYXRlLnZhbHVlID0gMC4wO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLmlzUGF1c2VkID0gdHJ1ZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzdW1lcyBhbGwgc3RyZWFtcyBpZiB0aGV5IHdlcmUgcGF1c2VkLlxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IG5vZGUudG1wUGxheWJhY2tSYXRlO1xyXG4gICAgZGVsZXRlIG5vZGUudG1wUGxheWJhY2tSYXRlO1xyXG4gIH0pO1xyXG4gIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBQcm9jZXNzZXMgYW4gZXZlbnQgZmlyZWQgYnkgdGhlIHNlcXVlbmNlci5cclxuICogQHBhcmFtICB7T2JqZWN0fSBzZXFFdmVudCBBIHNlcXVlbmNlciBldmVudFxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnByb2Nlc3NTZXFFdmVudCA9IGZ1bmN0aW9uKHNlcUV2ZW50KSB7XHJcbiAgLy90aGlzLnNldFRvbmUoc2VxRXZlbnQucHJvcHMudG9uZSk7XHJcbiAgaWYgKHNlcUV2ZW50LnByb3BzLmR1cmF0aW9uKSB7XHJcbiAgICB0aGlzLnN0YXJ0KGZhbHNlLFxyXG4gICAgICBzZXFFdmVudC5wcm9wcy5kZWxheSxcclxuICAgICAgc2VxRXZlbnQucHJvcHMuZHVyYXRpb24pO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aGlzLnN0YXJ0KGZhbHNlLFxyXG4gICAgICBzZXFFdmVudC5wcm9wcy5kZWxheSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHN0YXJ0cG9pbnQgb2YgdGhlIGxvb3BcclxuICogQHBhcmFtICB7ZmxvYXR9IHZhbHVlICBsb29wIHN0YXJ0IGluIHNlY29uZHNcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRMb29wU3RhcnQgPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIHRoaXMubG9vcFN0YXJ0ID0gdmFsdWU7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUubG9vcFN0YXJ0ID0gdmFsdWU7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgZW5kcG9pbnQgb2YgdGhlIGxvb3BcclxuICogQHBhcmFtICB7ZmxvYXR9IHZhbHVlICBsb29wIGVuZCBpbiBzZWNvbmRzXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0TG9vcEVuZCA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgdGhpcy5sb29wRW5kID0gdmFsdWU7XHJcbiAgdGhpcy5xdWV1ZS5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgIG5vZGUubG9vcEVuZCA9IHZhbHVlO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbGVhc2VzIHRoZSBsb29wIG9mIGFsbCBydW5uaW5nIG5vZGVzLFxyXG4gKiBOb2RlcyB3aWxsIHJ1biB1bnRpbCBlbmQgYW5kIHN0b3AuXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUucmVsZWFzZUxvb3AgPSBmdW5jdGlvbigpIHtcclxuICB0aGlzLnF1ZXVlLmZvckVhY2goZnVuY3Rpb24obm9kZSkge1xyXG4gICAgbm9kZS5sb29wID0gZmFsc2U7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVzZXRzIHRoZSBzdGFydCBhbmQgZW5kcG9pbnQgdG8gc3RhcnQgZW5kIGVuZHBvaW50IG9mIHRoZSBBdWRpb0J1ZmZlclxyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnJlc2V0TG9vcCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMubG9vcFN0YXJ0ID0gMDtcclxuICB0aGlzLmxvb3BFbmQgPSB0aGlzLnNvdW5kTGVuZ3RoO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCB0aGUgcGxheWJhY2sgcmF0ZSBvZiB0aGUgc291bmQgaW4gcGVyY2VudGFnZVxyXG4gKiAoMSA9IDEwMCUsIDIgPSAyMDAlKVxyXG4gKiBAcGFyYW0gIHtmbG9hdH0gIHZhbHVlICAgUmF0ZSBpbiBwZXJjZW50YWdlXHJcbiAqIEByZXR1cm4ge1ZvaWR9XHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuc2V0UGxheWJhY2tSYXRlID0gZnVuY3Rpb24odmFsdWUpIHtcclxuICB0aGlzLnBsYXliYWNrUmF0ZSA9IHZhbHVlO1xyXG4gIHRoaXMucXVldWUuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XHJcbiAgICBub2RlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IHZhbHVlO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgY3VycmVudCBwbGF5YmFjayByYXRlXHJcbiAqIEByZXR1cm4ge2Zsb2F0fSAgVGhlIHBsYXliYWNrIHJhdGUgaW4gcGVyY2VudGFnZSAoMS4yNSA9IDEyNSUpXHJcbiAqL1xyXG5Tb3VuZC5wcm90b3R5cGUuZ2V0UGxheWJhY2tSYXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMucGxheWJhY2tSYXRlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldCB0aGUgdG9uZSB3aXRoaW4gdHdvIG9jdGF2ZSAoKy8tMTIgdG9uZXMpXHJcbiAqIEBwYXJhbSAge0ludGVnZXJ9ICBzZW1pIHRvbmVcclxuICogQHJldHVybiB7Vm9pZH1cclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5zZXRUb25lID0gZnVuY3Rpb24oc2VtaVRvbmUpIHtcclxuICBpZiAoc2VtaVRvbmUgPj0gLTEyICYmIHNlbWlUb25lIDw9IDEyKSB7XHJcbiAgICB0aGlzLmRldHVuZSA9IHNlbWlUb25lICogMTAwO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlbWkgdG9uZSBpcyAnICsgc2VtaVRvbmUgKyAnLiBNdXN0IGJlIGJldHdlZW4gKy8tMTIuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCB0aGUgbGFzdCBwbGF5ZWQgc2VtaXRvbmUuIFRoaXMgZG9lc24ndCBoYXMgdG8gYmUgYW5cclxuICogaW50ZWdlciBiZXR3ZWVuIC0vKzEyIGFzIHRoZSBzb3VuZCBjYW4gYmUgZGV0dW5lZCB3aXRoXHJcbiAqIG1vcmUgcHJlY2lzaW9uLlxyXG4gKiBAcmV0dXJuIHtmbG9hdH0gIFNlbWl0b25lIGJldHdlZW4gLS8rMTJcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5nZXRUb25lID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZGV0dW5lIC8gMTAwO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERldHVuZSB0aGUgc291bmQgb3NjaWxsYXRpb24gaW4gY2VudHMgKCsvLSAxMjAwKVxyXG4gKiBAcGFyYW0gIHtJbnRlZ2VyfSAgdmFsdWUgIGRldHVuZSBpbiBjZW50c1xyXG4gKiBAcmV0dXJuIHtWb2lkfVxyXG4gKi9cclxuU291bmQucHJvdG90eXBlLnNldERldHVuZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgaWYgKHZhbHVlID49IC0xMjAwICYmIHZhbHVlIDw9IDEyMDApIHtcclxuICAgIHRoaXMuZGV0dW5lID0gdmFsdWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRGV0dW5lIHBhcmFtZXRlciBpcyAnICsgdmFsdWUgKyAnLiBNdXN0IGJlIGJldHdlZW4gKy8tMTIwMC4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogZ2V0IHRoZSBjdXJyZW50IGRldHVuZSBpbiBjZW50cyAoKy8tIDEyMDApXHJcbiAqIEByZXR1cm4ge0ludGVnZXJ9ICBEZXR1bmUgaW4gY2VudHNcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5nZXREZXR1bmUgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5kZXR1bmU7XHJcbn07XHJcblxyXG4vKipcclxuICogVGhpcyBpcyBub3QgaW4gdXNlIGFuZCBjYW4gcHJvYmFibHkgYmUgcmVtb3ZlZFxyXG4gKiBAcmV0dXJuIHtJbnR9IFJhbmRvbSBudW1iZXJcclxuICovXHJcblNvdW5kLnByb3RvdHlwZS5nZXRVSUQgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygpLnN1YnN0cigyLCA4KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU291bmQ7XHJcbiIsIid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjb3JlID0gcmVxdWlyZSgnLi9jb3JlLmpzJyk7XHJcblxyXG4vKipcclxuICogPHA+XHJcbiAqIENyZWF0ZXMgYSB3cmFwcGVyIGluIHdoaWNoIGFuIGF1ZGlvIGJ1ZmZlciBsaXZlcy5cclxuICogQSBTb3VuZFdhdmUgb2JqZWN0IGp1c3QgaG9sZHMgYXVkaW8gZGF0YSBhbmQgZG9lcyBub3RoaW5nIGVsc2UuXHJcbiAqIElmIHlvdSB3YW50IHRvIHBsYXkgdGhlIHNvdW5kLCB5b3UgaGF2ZSB0byBhZGRpdGlvbmFsbHkgY3JlYXRlIGFcclxuICogPGEgaHJlZj1cIlNvdW5kLmh0bWxcIj5Tb3VuZDwvYT4gb2JqZWN0LlxyXG4gKiBJdCBjYW4gaGFuZGxlIG9uZSBvciBtb3JlIEFycmF5QnVmZmVycyBvciBmaWxlbmFtZXNcclxuICogKCoud2F2LCAqLm1wMykgYXMgZGF0YSBzb3VyY2VzLlxyXG4gKiA8L3A+PHA+XHJcbiAqIE11bHRpcGxlIHNvdXJjZXMgd2lsbCBiZSBjb25jYXRlbmF0ZWQgaW50byBvbmUgYXVkaW8gYnVmZmVyLlxyXG4gKiBUaGlzIGlzIG5vdCB0aGUgc2FtZSBhcyBjcmVhdGluZyBtdWx0aXBsZSBTb3VuZFdhdmUgb2JqZWN0cy5cclxuICogSXQncyBsaWtlIGEgd2F2ZXRhYmxlOiBBbGwgc3RhcnQvZW5kIHBvc2l0aW9ucyB3aWxsIGJlIHNhdmVkIHNvXHJcbiAqIHlvdSBjYW4gdHJpZ2dlciB0aGUgb3JpZ2luYWwgc2FtcGxlcyB3aXRob3V0IHVzaW5nIG11bHRpcGxlIGJ1ZmZlcnMuXHJcbiAqIFBvc3NpYmxlIHVzYWdlcyBhcmUgbXVsdGlzYW1wbGVkIHNvdW5kcywgbG9vcHMgb3Igd2F2ZXNlcXVlbmNlcyAoa2luZCBvZikuXHJcbiAqIDwvcD5cclxuICpcclxuICogQGV4YW1wbGUgPGNhcHRpb24+UGxheSBhIHNvdW5kIGZyb20gYW4gYXVkaW8gZmlsZTo8L2NhcHRpb24+XHJcbiAqIHZhciBzb3VuZFdhdmUgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKCdmaWxlLndhdicpO1xyXG4gKiB2YXIgc291bmQgPSBuZXcgaW50ZXJtaXguU291bmQoc291bmRXYXZlKTtcclxuICogc291bmQucGxheTtcclxuICogQGV4YW1wbGUgPGNhcHRpb24+Q29uY2F0ZW5hdGUgbXVsdGlwbGUgc291cmNlIGZpbGVzIGludG8gb25lIGJ1ZmZlcjxicj5cclxuICogaW4gdGhlIGdpdmVuIG9yZGVyIGFuZCBwbGF5IHRoZW0gKFRoaXMgaXMgYnJva2VuIGluIHYwLjEuIERvbid0IHVzZSBpdCEpOjwvY2FwdGlvbj5cclxuICogdmFyIHNvdW5kV2F2ZSA9IG5ldyBpbnRlcm1peC5Tb3VuZFdhdmUoJ2ZpbGUxLndhdixmaWxlMi53YXYsZmlsZTMud2F2Jyk7XHJcbiAqIHZhciBzb3VuZCA9IG5ldyBpbnRlcm1peC5Tb3VuZChzb3VuZFdhdmUpO1xyXG4gKiBzb3VuZC5wbGF5O1xyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5cclxuICogVXNpbmcgQXJyYXlCdWZmZXJzIGluc3RlYWQgb2YgZmlsZW5hbWVzIHdpbGwgY29tZSBpbiBoYW5keSBpZiB5b3Ugd2FudDxicj5cclxuICogdG8gaGF2ZSBmdWxsIGNvbnRyb2wgb3ZlciBYSFIgb3IgdXNlIGEgcHJlbG9hZGVyIChoZXJlOiBwcmVsb2FkLmpzKTpcclxuICogPC9jYXB0aW9uPlxyXG4gKiB2YXIgcXVldWUgPSBuZXcgY3JlYXRlanMuTG9hZFF1ZXVlKCk7XHJcbiAqIHF1ZXVlLm9uKCdjb21wbGV0ZScsIGhhbmRsZUNvbXBsZXRlKTtcclxuICogcXVldWUubG9hZE1hbmlmZXN0KFtcclxuICogICAgIHtpZDogJ3NyYzEnLCBzcmM6J2ZpbGUxLndhdicsIHR5cGU6Y3JlYXRlanMuQWJzdHJhY3RMb2FkZXIuQklOQVJZfSxcclxuICogICAgIHtpZDogJ3NyYzInLCBzcmM6J2ZpbGUyLndhdicsIHR5cGU6Y3JlYXRlanMuQWJzdHJhY3RMb2FkZXIuQklOQVJZfVxyXG4gKiBdKTtcclxuICpcclxuICogZnVuY3Rpb24gaGFuZGxlQ29tcGxldGUoKSB7XHJcbiAqICAgICB2YXIgYmluRGF0YTEgPSBxdWV1ZS5nZXRSZXN1bHQoJ3NyYzEnKTtcclxuICogICAgIHZhciBiaW5EYXRhMiA9IHF1ZXVlLmdldFJlc3VsdCgnc3JjMicpO1xyXG4gKiAgICAgdmFyIHdhdmUxID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZShiaW5EYXRhMSk7XHJcbiAqICAgICB2YXIgd2F2ZTIgPSBuZXcgaW50ZXJtaXguU291bmRXYXZlKGJpbkRhdGEyKTtcclxuICogICAgIHZhciBjb25jYXRXYXZlID0gbmV3IGludGVybWl4LlNvdW5kV2F2ZShbYmluRGF0YTEsIGJpbkRhdGEyXSk7XHJcbiAqIH07XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0gIHsoT2JqZWN0fE9iamVjdFtdfHN0cmluZyl9IGF1ZGlvU3JjICAgT25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzIG9yIGZpbGVuYW1lc1xyXG4gKi9cclxudmFyIFNvdW5kV2F2ZSA9IGZ1bmN0aW9uKGF1ZGlvU3JjKSB7XHJcblxyXG4gIHRoaXMuYWMgPSBjb3JlOyAgICAgICAvL2N1cnJlbnRseSBqdXN0IHVzZWQgZm9yIHRlc3RzXHJcbiAgdGhpcy5idWZmZXIgPSBudWxsOyAgIC8vQXVkaW9CdWZmZXJcclxuICB0aGlzLm1ldGFEYXRhID0gW107ICAgLy9zdGFydC0vZW5kcG9pbnRzIGFuZCBsZW5ndGggb2Ygc2luZ2xlIHdhdmVzXHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICBpZiAoYXVkaW9TcmMpIHtcclxuICAgIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XHJcbiAgICAgIC8vb25lIGF1ZGlvIGJ1ZmZlciB0byBkZWNvZGVcclxuICAgICAgdGhpcy5kZWNvZGVBdWRpb0RhdGEoYXVkaW9TcmMpO1xyXG4gICAgfSBlbHNlIGlmIChhdWRpb1NyYyBpbnN0YW5jZW9mIEFycmF5ICYmIGF1ZGlvU3JjWzBdIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgICAgLy9tdWx0aXBsZSBhdWRpbyBidWZmZXJzIHRvIGRlY29kZSBhbmQgY29uY2F0ZW5hdGVcclxuICAgICAgdGhpcy5jb25jYXRCaW5hcmllc1RvQXVkaW9CdWZmZXIoYXVkaW9TcmMpO1xyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYXVkaW9TcmMgPT09ICdzdHJpbmcnICYmIGF1ZGlvU3JjLmluZGV4T2YoJywnKSA9PT0gLTEpIHtcclxuICAgICAgLy9vbmUgZmlsZSB0byBsb2FkL2RlY29kZVxyXG4gICAgICB0aGlzLmxvYWRGaWxlKGF1ZGlvU3JjLCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgIHNlbGYuYnVmZmVyID0gc2VsZi5kZWNvZGVBdWRpb0RhdGEocmVzcG9uc2UpO1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGF1ZGlvU3JjID09PSAnc3RyaW5nJyAmJiBhdWRpb1NyYy5pbmRleE9mKCcsJykgPiAtMSkge1xyXG4gICAgICAvL211bHRpcGxlIGZpbGVzIHRvIGxvYWQvZGVjb2RlIGFuZCBjYW5jYXRpbmF0ZVxyXG4gICAgICB2YXIgYmluQnVmZmVycyA9IHRoaXMubG9hZEZpbGVzKGF1ZGlvU3JjKTtcclxuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmNvbmNhdEJpbmFyaWVzVG9BdWRpb0J1ZmZlcihiaW5CdWZmZXJzLCB0aGlzLmJ1ZmZlcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBjcmVhdGUgU291bmRXYXZlIG9iamVjdDogVW5zdXBwb3J0ZWQgZGF0YSBmb3JtYXQnKTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgLy9zdGFydCB0aGUgb2JqZWN0IHdpdGggZW1wdHkgYnVmZmVyLiBVc2VmdWxsIGZvciB0ZXN0aW5nIGFuZCBhZHZhbmNlZCB1c2FnZS5cclxuICB9XHJcblxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFRha2VzIGJpbmFyeSBhdWRpbyBkYXRhLCB0dXJucyBpdCBpbnRvIGFuIGF1ZGlvIGJ1ZmZlciBvYmplY3QgYW5kXHJcbiAqIHN0b3JlcyBpdCBpbiB0aGlzLmJ1ZmZlci5cclxuICogQmFzaWNhbGx5IGEgd3JhcHBlciBmb3IgdGhlIHdlYi1hdWRpby1hcGkgZGVjb2RlQXVkaW9EYXRhIGZ1bmN0aW9uLlxyXG4gKiBJdCB1c2VzIHRoZSBuZXcgcHJvbWlzZSBzeW50YXggc28gaXQgcHJvYmFibHkgd29uJ3Qgd29yayBpbiBhbGwgYnJvd3NlcnMgYnkgbm93LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtBcnJheUJ1ZmZlcn0gIHJhd0F1ZGlvU3JjIEF1ZGlvIGRhdGEgaW4gcmF3IGJpbmFyeSBmb3JtYXRcclxuICogQHJldHVybiB7UHJvbWlzZX0gICAgICAgICAgICAgICAgICBQcm9taXNlIHRoYXQgaW5kaWNhdGVzIGlmIG9wZXJhdGlvbiB3YXMgc3VjY2Vzc2Z1bGwuXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmRlY29kZUF1ZGlvRGF0YSA9IGZ1bmN0aW9uKHJhd0F1ZGlvU3JjKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHJldHVybiBjb3JlLmRlY29kZUF1ZGlvRGF0YShyYXdBdWRpb1NyYykudGhlbihmdW5jdGlvbihkZWNvZGVkKSB7XHJcbiAgICBzZWxmLmJ1ZmZlciA9IGRlY29kZWQ7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29uY2F0ZW5hdGVzIG9uZSBvciBtb3JlIEFycmF5QnVmZmVycyB0byBhbiBBdWRpb0J1ZmZlci5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9IGJpbmFyeUJ1ZmZlcnMgIEFycmF5IGhvbGRpbmcgb25lIG9yIG1vcmUgQXJyYXlCdWZmZXJzXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBhdWRpb0J1ZmZlciAgIEFuIGV4aXN0aW5nIEF1ZGlvQnVmZmVyIG9iamVjdFxyXG4gKiBAcmV0dXJuIHtBdWRpb0J1ZmZlcn0gICAgICAgICAgICAgICBUaGUgY29uY2F0ZW5hdGVkIEF1ZGlvQnVmZmVyXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmNvbmNhdEJpbmFyaWVzVG9BdWRpb0J1ZmZlciA9IGZ1bmN0aW9uKGJpbmFyeUJ1ZmZlcnMsIGF1ZGlvQnVmZmVyKSB7XHJcbiAgYmluYXJ5QnVmZmVycy5mb3JFYWNoKGZ1bmN0aW9uKGJpbkJ1ZmZlcikge1xyXG4gICAgdmFyIHRtcEF1ZGlvQnVmZmVyID0gdGhpcy5kZWNvZGVBdWRpb0RhdGEoYmluQnVmZmVyKTtcclxuICAgIHRoaXMubWV0YURhdGEucHVzaCh0aGlzLmFkZFdhdmVNZXRhRGF0YShhdWRpb0J1ZmZlciwgdG1wQXVkaW9CdWZmZXIpKTtcclxuICAgIGF1ZGlvQnVmZmVyID0gdGhpcy5hcHBlbmRBdWRpb0J1ZmZlcihhdWRpb0J1ZmZlciwgdG1wQXVkaW9CdWZmZXIpO1xyXG4gIH0sIHRoaXMpO1xyXG5cclxuICByZXR1cm4gYXVkaW9CdWZmZXI7XHJcbn07XHJcblxyXG4vKipcclxuICogQXBwZW5kcyB0d28gYXVkaW8gYnVmZmVycy4gU3VnZ2VzdGVkIGJ5IENocmlzIFdpbHNvbjo8YnI+XHJcbiAqIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTQxNDM2NTIvd2ViLWF1ZGlvLWFwaS1hcHBlbmQtY29uY2F0ZW5hdGUtZGlmZmVyZW50LWF1ZGlvYnVmZmVycy1hbmQtcGxheS10aGVtLWFzLW9uZS1zb25cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXVkaW9CdWZmZXJ9IGJ1ZmZlcjEgVGhlIGZpcnN0IGF1ZGlvIGJ1ZmZlclxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gYnVmZmVyMiBUaGUgc2Vjb25kIGF1ZGlvIGJ1ZmZlclxyXG4gKiBAcmV0dXJuIHtBdWRpb0J1ZmZlcn0gICAgICAgICBidWZmZXIxICsgYnVmZmVyMlxyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5hcHBlbmRBdWRpb0J1ZmZlciA9IGZ1bmN0aW9uKGJ1ZmZlcjEsIGJ1ZmZlcjIpIHtcclxuICB2YXIgbnVtYmVyT2ZDaGFubmVscyA9IE1hdGgubWluKGJ1ZmZlcjEubnVtYmVyT2ZDaGFubmVscywgYnVmZmVyMi5udW1iZXJPZkNoYW5uZWxzKTtcclxuICB2YXIgdG1wID0gY29yZS5jcmVhdGVCdWZmZXIobnVtYmVyT2ZDaGFubmVscyxcclxuICAgIChidWZmZXIxLmxlbmd0aCArIGJ1ZmZlcjIubGVuZ3RoKSxcclxuICAgIGJ1ZmZlcjEuc2FtcGxlUmF0ZSk7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1iZXJPZkNoYW5uZWxzOyBpKyspIHtcclxuICAgIHZhciBjaGFubmVsID0gdG1wLmdldENoYW5uZWxEYXRhKGkpO1xyXG4gICAgY2hhbm5lbC5zZXQoIGJ1ZmZlcjEuZ2V0Q2hhbm5lbERhdGEoaSksIDApO1xyXG4gICAgY2hhbm5lbC5zZXQoIGJ1ZmZlcjIuZ2V0Q2hhbm5lbERhdGEoaSksIGJ1ZmZlcjEubGVuZ3RoKTtcclxuICB9XHJcbiAgcmV0dXJuIHRtcDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgZGljdGlvbmFyeSB3aXRoIHN0YXJ0L3N0b3AgcG9pbnRzIGFuZCBsZW5ndGggaW4gc2FtcGxlLWZyYW1lc1xyXG4gKiBvZiBhbiBhcHBlbmRlZCB3YXZlZm9ybSBhbmQgYWRkcyBpdCB0byB0aGUgbWV0YURhdGEgYXJyYXkuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0F1ZGlvQnVmZmVyfSBleGlzdGluZ0J1ZmZlciBUaGUgJ29sZCcgYnVmZmVyIHRoYXQgZ2V0cyBhcHBlbmRlZFxyXG4gKiBAcGFyYW0gIHtBdWRpb0J1ZmZlcn0gbmV3QnVmZmVyICAgICAgVGhlIGJ1ZmZlciB0aGF0IGdldHMgYXBwZW5kZWRcclxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgICAgICAgICAgIERpY3Rpb25hcnkgd2l0aCBzdGFydC9zdG9wL2xlbmd0aCBkYXRhXHJcbiAqL1xyXG5Tb3VuZFdhdmUucHJvdG90eXBlLmFkZFdhdmVNZXRhRGF0YSA9IGZ1bmN0aW9uKGV4aXN0aW5nQnVmZmVyLCBuZXdCdWZmZXIpIHtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGV4aXN0aW5nQnVmZmVyLmxlbmd0aCArIDEsXHJcbiAgICBlbmQ6IGV4aXN0aW5nQnVmZmVyLmxlbmd0aCArIG5ld0J1ZmZlci5sZW5ndGgsXHJcbiAgICBsZW5ndGg6IG5ld0J1ZmZlci5sZW5ndGhcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIExvYWRzIGEgYmluYXJ5IGZpbGUgYW5kIGNhbGxzIGEgZnVuY3Rpb24gd2l0aCB0aGVcclxuICogcmV0dXJuZWQgQXJyYXlCdWZmZXIgYXMgaXRzIGFyZ3VtZW50IHdoZW4gZG9uZS5cclxuICogQHRvZG8gICAgVGVzdCBpbiBzeW5jaHJvbm91cyBtb2RlIG9yIHJlbW92ZSBpdCBjb21wbGV0ZWx5XHJcbiAqIEBwYXJhbSAge3N0cmluZ30gICBmaWxlbmFtZSAgICAgICBUaGUgZmlsZSB0byBiZSBsb2FkZWRcclxuICogQHBhcmFtICB7ZnVuY3Rpb259IG9ubG9hZENhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWRcclxuICogQHBhcmFtICB7Ym9vbGVhbn0gIFthc3luYz10cnVlXSAgIEFzeW5jaHJvbm91cyBsb2FkaW5nXHJcbiAqIEBleGFtcGxlXHJcbiAqIHZhciBhcnJheUJ1ZmZlcjtcclxuICogdGhpcy5sb2FkRmlsZSgnZmlsZTEud2F2JywgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICogICBhcnJheUJ1ZmZlciA9IHJlc3BvbnNlO1xyXG4gKiB9KTtcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUubG9hZEZpbGUgPSBmdW5jdGlvbihmaWxlbmFtZSwgb25sb2FkQ2FsbGJhY2ssIGFzeW5jKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBhc3luY2hyb25vdXNseSA9IHRydWU7XHJcbiAgdmFyIHJlcXVlc3QgPSBuZXcgd2luZG93LlhNTEh0dHBSZXF1ZXN0KCk7XHJcblxyXG4gIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcigncHJvZ3Jlc3MnLCBzZWxmLnVwZGF0ZVByb2dyZXNzKTtcclxuICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBzZWxmLnRyYW5zZmVyQ29tcGxldGUpO1xyXG4gIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBzZWxmLnRyYW5zZmVyRmFpbGVkKTtcclxuICByZXF1ZXN0LmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgc2VsZi50cmFuc2ZlckNhbmNlbGVkKTtcclxuXHJcbiAgaWYgKGFzeW5jKSB7XHJcbiAgICBhc3luY2hyb25vdXNseSA9IGFzeW5jO1xyXG4gIH1cclxuXHJcbiAgcmVxdWVzdC5vcGVuKCdHRVQnLCBmaWxlbmFtZSwgYXN5bmNocm9ub3VzbHkpO1xyXG4gIHJlcXVlc3QucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcclxuXHJcbiAgcmVxdWVzdC5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIG9ubG9hZENhbGxiYWNrKHJlcXVlc3QucmVzcG9uc2UpO1xyXG4gIH07XHJcblxyXG4gIHJlcXVlc3Quc2VuZCgpO1xyXG59O1xyXG5cclxuU291bmRXYXZlLnByb3RvdHlwZS51cGRhdGVQcm9ncmVzcyA9IGZ1bmN0aW9uKCkge307XHJcblxyXG5Tb3VuZFdhdmUucHJvdG90eXBlLnRyYW5zZmVyQ29tcGxldGUgPSBmdW5jdGlvbigpIHtcclxuXHJcbn07XHJcblxyXG5Tb3VuZFdhdmUucHJvdG90eXBlLnRyYW5zZmVyRmFpbGVkID0gZnVuY3Rpb24oKSB7fTtcclxuXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUudHJhbnNmZXJDYW5jZWxlZCA9IGZ1bmN0aW9uKCkge307XHJcblxyXG4vKipcclxuICogTG9hZHMgbXVsdGlwbGUgYmluYXJ5IGZpbGVzIGFuZCByZXR1cm5zIGFuIGFycmF5XHJcbiAqIHdpdGggdGhlIGRhdGEgZnJvbSB0aGUgZmlsZXMgaW4gdGhlIGdpdmVuIG9yZGVyLlxyXG4gKiBAcGFyYW0gIHtBcnJheX0gIGZpbGVuYW1lcyBMaXN0IHdpdGggZmlsZW5hbWVzXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgIEFycmF5IG9mIEFycmF5QnVmZmVyc1xyXG4gKi9cclxuU291bmRXYXZlLnByb3RvdHlwZS5sb2FkRmlsZXMgPSBmdW5jdGlvbihmaWxlbmFtZXMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIGJpbkJ1ZmZlcnMgPSBbXTtcclxuICB2YXIgbmFtZXMgPSBmaWxlbmFtZXMuc3BsaXQoJywnKTtcclxuICBuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgIHNlbGYubG9hZEZpbGUobmFtZSwgZnVuY3Rpb24ocmVzcG9uc2UpIHtcclxuICAgICAgYmluQnVmZmVyc1tuYW1lXSA9IHJlc3BvbnNlO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0aGlzLnNvcnRCaW5CdWZmZXJzKG5hbWVzLCBiaW5CdWZmZXJzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTb3J0IEFycmF5QnVmZmVycyB0aGUgc2FtZSBvcmRlciwgbGlrZSB0aGUgZmlsZW5hbWVcclxuICogcGFyYW1ldGVycy5cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7QXJyYXl9ICBmaWxlbmFtZXMgIEFycmF5IHdpdGggZmlsZW5hbWVzXHJcbiAqIEBwYXJhbSAge0FycmF5fSAgYmluQnVmZmVycyBBcnJheSB3aXRoIEFycmF5QnVmZmVyXHJcbiAqIEByZXR1cm4ge0FycmF5fSAgICAgICAgICAgICBBcnJheSB3aXRoIHNvcnRlZCBBcnJheUJ1ZmZlcnNcclxuICovXHJcblNvdW5kV2F2ZS5wcm90b3R5cGUuc29ydEJpbkJ1ZmZlcnMgPSBmdW5jdGlvbihmaWxlbmFtZXMsIGJpbkJ1ZmZlcnMpIHtcclxuICByZXR1cm4gZmlsZW5hbWVzLm1hcChmdW5jdGlvbihlbCkge1xyXG4gICAgcmV0dXJuIGJpbkJ1ZmZlcnNbZWxdO1xyXG4gIH0pO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZFdhdmU7XHJcbiIsIi8qKlxyXG4gKiBUaGlzIGlzIHRoZSBmb3VuZGF0aW9uIG9mIHRoZSBJbnRlcm1peCBsaWJyYXJ5LlxyXG4gKiBJdCBzaW1wbHkgY3JlYXRlcyB0aGUgYXVkaW8gY29udGV4dCBvYmplY3RzXHJcbiAqIGFuZCBleHBvcnRzIGl0IHNvIGl0IGNhbiBiZSBlYXNpbHkgY29uc3VtZWRcclxuICogZnJvbSBhbGwgY2xhc3NlcyBvZiB0aGUgbGlicmFyeS5cclxuICpcclxuICogQHJldHVybiB7QXVkaW9Db250ZXh0fSBUaGUgQXVkaW9Db250ZXh0IG9iamVjdFxyXG4gKlxyXG4gKiBAdG9kbyBTaG91bGQgd2UgZG8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHkgZm9yIG9sZGVyIGFwaS12ZXJzaW9ucz9cclxuICogQHRvZG8gQ2hlY2sgZm9yIG1vYmlsZS9pT1MgY29tcGF0aWJpbGl0eS5cclxuICogQHRvZG8gQ2hlY2sgaWYgd2UncmUgcnVubmluZyBvbiBub2RlXHJcbiAqXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPlN1c3BlbmQgYW5kIHJlc3VtZSB0aGUgYXVkaW8gY29udGV4dCB0b1xyXG4gKiBjcmVhdGUgYSBwYXVzZSBidXR0b24uIFRoaXMgc2hvdWxkIGJlIHVzZWQgd2l0aCBjcmVhdGVBdWRpb1dvcmtlclxyXG4gKiBhcyBhbiBlcnJvciB3aWxsIGJlIHRocm93biB3aGVuIHN1c3BlbmQgaXMgY2FsbGVkIG9uIGFuIG9mZmxpbmUgYXVkaW8gY29udGV4dC5cclxuICogWW91IGNhbiBhbHNvIHBhdXNlIHNpbmdsZSBzb3VuZHMgd2l0aCA8aT5Tb3VuZC5wYXVzZSgpPC9pPi5cclxuICogUGxlYXNlIHJlYWQgPGEgaHJlZj1cImh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2RlL2RvY3MvV2ViL0FQSS9BdWRpb0NvbnRleHQvc3VzcGVuZFwiPnRoZSBkZXZlbG9wZXIgZG9jcyBhdCBNRE48L2E+XHJcbiAqIHRvIGdldCBhIGJldHRlciBpZGVhIG9mIHRoaXMuPC9jYXB0aW9uPlxyXG4gKiBzdXNyZXNCdG4ub25jbGljayA9IGZ1bmN0aW9uKCkge1xyXG4gKiAgIGlmKEludGVybWl4LnN0YXRlID09PSAncnVubmluZycpIHtcclxuICogICAgIEludGVybWl4LnN1c3BlbmQoKS50aGVuKGZ1bmN0aW9uKCkge1xyXG4gKiAgICAgICBzdXNyZXNCdG4udGV4dENvbnRlbnQgPSAnUmVzdW1lIGNvbnRleHQnO1xyXG4gKiAgICAgfSk7XHJcbiAqICAgfSBlbHNlIGlmIChJbnRlcm1peC5zdGF0ZSA9PT0gJ3N1c3BlbmRlZCcpIHtcclxuICogICAgIEludGVybWl4LnJlc3VtZSgpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAqICAgICAgIHN1c3Jlc0J0bi50ZXh0Q29udGVudCA9ICdTdXNwZW5kIGNvbnRleHQnO1xyXG4gKiAgICAgfSk7XHJcbiAqICAgfVxyXG4gKiB9XHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgYXVkaW9DdHggPSBudWxsO1xyXG5cclxuKGZ1bmN0aW9uKCkge1xyXG5cclxuICB3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xyXG5cclxuICBpZiAod2luZG93LkF1ZGlvQ29udGV4dCkge1xyXG4gICAgYXVkaW9DdHggPSBuZXcgd2luZG93LkF1ZGlvQ29udGV4dCgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvdWxkblxcJ3QgaW5pdGlhbGl6ZSB0aGUgYXVkaW8gY29udGV4dC4nKTtcclxuICB9XHJcblxyXG59KSgpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBhdWRpb0N0eDtcclxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgaXMgbm90IGFib3V0IGphdmFzY3JpcHQgZXZlbnRzISBJdCdzIGp1c3RcclxuICogYSBkZWZpbml0aW9uIG9mIHRoZSBldmVudHMgdGhhdCB0aGUgc2VxdWVuY2VyIGNhbiBoYW5kbGUgcGx1c1xyXG4gKiBzb21lIGZ1bmN0aW9ucyB0byBjcmVhdGUgdmFsaWQgZXZlbnRzLlxyXG4gKiBUaGUgY2xhc3MgZGVmaW5lcyB3aGljaCBzdWJzeXN0ZW0gaXMgaW52b2tlZCB0byBwcm9jZXNzIHRoZSBldmVudC5cclxuICogRXZlcnkgY2xhc3MgY2FuIGhhdmUgc2V2ZXJhbCB0eXBlcyBhbmQgYSB0eXBlIGNvbnNpc3RzIG9mIG9uZSBvclxyXG4gKiBtb3JlIHByb3BlcnRpZXMuXHJcbiAqIEBleGFtcGxlIDxjYXB0aW9uPkNyZWF0ZSBhIG5vdGUgZXZlbnQgZm9yIGFuIGF1ZGlvIG9iamVjdDwvY2FwdGlvbj5cclxuICogdmFyIG5vdGUgPSBpbnRlcm1peC5ldmVudHMuY3JlYXRlQXVkaW9Ob3RlKCdjMycsIDY1LCAxMjgsIGFTb3VuZE9iamVjdCk7XHJcbiAqL1xyXG5cclxuLyoqXHJcbiAqIEFsbCB2YWxpZCBldmVudCBwcm9wZXJ0aWVzIGluIG9uZSBoYW5keSBhcnJheS5cclxuICogQHR5cGUge0FycmF5fVxyXG4gKi9cclxudmFyIGV2UHJvcCA9IFtcclxuICAnaW5zdHJ1bWVudCcsIC8vIHRoZSBldmVudCByZWNlaXZlclxyXG4gICd0b25lJywgICAgICAgLy8gSW50IGJldHdlZW4gMCBhbmQgMTI3IGJlZ2lubmluZyBhdCBjMFxyXG4gICdkdXJhdGlvbicsICAgLy8gSW50IHJlcHJlc2VudGluZyBhIG51bWJlciBvZiA2NHRoIG5vdGVzXHJcbiAgJ3ZlbG9jaXR5JywgICAvLyBJbnQgYmV0d2VlbiAwIGFuZCAxMjdcclxuICAncGl0Y2gnLFxyXG4gICd2b2x1bWUnLFxyXG4gICdwYW4nXHJcbl07XHJcblxyXG4vKipcclxuICogQWxsIHZhbGlkIGV2ZW50IHR5cGVzIGFuZCB0aGUgcHJvcGVydGllcyBhc3NvdGlhdGVkIHdpdGggdGhlbS5cclxuICogVHlwZSBhcmUgdmFsaWQgd2l0aCBvbmUsIHNldmVyYWwgb3IgYWxsIG9mIGl0cyBwcm9wZXJ0aWVzLlxyXG4gKiBAdHlwZSB7T2JqZWN0fVxyXG4gKi9cclxudmFyIGV2VHlwZSA9IHtcclxuICAnbm90ZSc6IFsgZXZQcm9wWzBdLCBldlByb3BbMV0sIGV2UHJvcFsyXSwgZXZQcm9wWzNdIF0sXHJcbiAgJ2NvbnRyb2wnOiBbIGV2UHJvcFs0XSwgZXZQcm9wWzVdLCBldlByb3BbNl0gXVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFsbCB2YWxpZCBldmVudCBjbGFzc2VzIGFuZCB0aGUgdHlwZXMgYXNzb3RpYXRlZCB3aXRoIHRoZW0uXHJcbiAqIEB0eXBlIHtPYmplY3R9XHJcbiAqL1xyXG52YXIgZXZDbGFzcyA9IHtcclxuICAnYXVkaW8nOiBbZXZUeXBlLm5vdGUsIGV2VHlwZS5jb250cm9sXSxcclxuICAnc3ludGgnOiBbZXZUeXBlLm5vdGUsIGV2VHlwZS5jb250cm9sXSxcclxuICAnZngnOiBbXSxcclxuICAnbWlkaSc6IFtdLFxyXG4gICdvc2MnOiBbXVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyB0aGUgY2xhc3Mgb2YgYSBzZXF1ZW5jZXIgZXZlbnRcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7U3RyaW5nfSAgIGVDbGFzcyBFdmVudCBjbGFzc1xyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgdHJ1ZSBpZiBjbGFzcyBleGlzdHMsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlQ2xhc3MgPSBmdW5jdGlvbihlQ2xhc3MpIHtcclxuICBpZiAoZXZDbGFzcy5oYXNPd25Qcm9wZXJ0eShlQ2xhc3MpKSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgdGhlIHR5cGUgb2YgYSBzZXF1ZW5jZXIgZXZlbnRcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtICB7U3RyaW5nfSAgIGVUeXBlIEV2ZW50IHR5cGVcclxuICogQHJldHVybiB7Ym9vbGVhbn0gIHRydWUgaWYgdHlwZSBleGlzdHMsIGZhbHNlIGlmIG5vdFxyXG4gKi9cclxudmFyIHZhbGlkYXRlVHlwZSA9IGZ1bmN0aW9uKGVUeXBlKSB7XHJcbiAgaWYgKGV2VHlwZS5oYXNPd25Qcm9wZXJ0eShlVHlwZSkpIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiBhbiBpbnN0cnVtZW50IGlzIGFuIG9iamVjdC5cclxuICogVGhpcyBpcyBhIHBvb3JseSB3ZWFrIHRlc3QgYnV0IHRoYXQnc1xyXG4gKiBhbGwgd2UgY2FuIGRvIGhlcmUuXHJcbiAqIEBwYXJhbSAge09iamVjdH0gaW5zdHIgQW4gaW5zdHJ1bWVudCBvYmplY3RcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICB0cnVlIGlmIGl0J3MgYW4gb2JqZWN0LCBmYWxzZSBpZiBub3RcclxuICovXHJcbnZhciB2YWxpZGF0ZVByb3BJbnN0cnVtZW50ID0gZnVuY3Rpb24oaW5zdHIpIHtcclxuICBpZiAodHlwZW9mIGluc3RyID09PSAnb2JqZWN0Jykge1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVmFsaWRhdGVzIGlmIGEgdG9uZSBvciB2ZWxvY2l0eSB2YWx1ZSBpc1xyXG4gKiBhbiBpbnRlZ2VyIGJldHdlZW4gMCBhbmQgMTI3LlxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0gIHtJbnR9ICB2YWx1ZSAgIFRoZSBudW1iZXIgdGhhdCByZXByZXNlbnRzIGEgdG9uZVxyXG4gKiBAcmV0dXJuIHtib29sZWFufSAgICAgIFRydWUgaWYgaXRzIGEgdmFsaWQgdG9uZSwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wVG9uZVZlbG8gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIGlmICghaXNOYU4odmFsdWUpICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpICYmIHZhbHVlID49IDAgJiYgdmFsdWUgPD0gMTI3KSB7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBWYWxpZGF0ZXMgaWYgYSBkdXJhdGlvbiBpcyBhIHBvc2l0aXZlIGludGVnZXIuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge0ludH0gIHZhbHVlICAgTnVtYmVyIHJlcHJlc2VudGluZyBtdWx0aXBsZSA2NHRoIG5vdGVzXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59ICAgICAgVHJ1ZSBpZiBpdHMgYSB2YWxpZCBkdXJhdGlvbiwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wRHVyYXRpb24gPSBmdW5jdGlvbih2YWx1ZSkge1xyXG4gIGlmICghaXNOYU4odmFsdWUpICYmIE51bWJlci5pc0ludGVnZXIodmFsdWUpICYmIHZhbHVlID49IDApIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFZhbGlkYXRlcyBhbiBvYmplY3Qgb2YgZXZlbnQgcHJvcGVydGllcy5cclxuICogSXQgY2hlY2tzIHRoZSBwcm9wZXJ0aWVzIGFyZSB2YWxpZCBmb3IgdGhlIGdpdmVuIHR5cGUuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge09iamVjdH0gZVByb3BzICBPYmplY3Qgd2l0aCBldmVudCBwcm9wZXJ0aWVzXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZVR5cGUgICBFdmVudCB0eXBlIHRvIHZhbGlkYXRlIGFnYWluc3RcclxuICogQHJldHVybiB7Ym9vbGVhbn0gICAgICAgIHRydWUgaWYgYWxsIHByb3BzIGFyZSB2YWxpZCwgZmFsc2UgaWYgbm90XHJcbiAqL1xyXG52YXIgdmFsaWRhdGVQcm9wcyA9IGZ1bmN0aW9uKGVQcm9wcywgZVR5cGUpIHtcclxuICB2YXIgdHlwZSA9IGV2VHlwZVtlVHlwZV07XHJcbiAgZm9yICh2YXIga2V5IGluIGVQcm9wcykgIHtcclxuICAgIGlmIChldlByb3AuaW5kZXhPZihrZXkpID09PSAtMSAmJlxyXG4gICAgdHlwZS5pbmRleE9mKGtleSkgPT09IC0xKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHRydWU7XHJcbn07XHJcblxyXG4vKipcclxuICogVGFrZXMgYSBzdHJpbmcgb2YgdGhlIGZvcm0gYzMgb3IgZCM0IGFuZFxyXG4gKiByZXR1cm5zIHRoZSBjb3JyZXNwb25kaW5nIG51bWJlci5cclxuICogQHBhcmFtICB7U3RyaW5nfSB0b25lIFN0cmluZyByZXByZXNlbnRpbmcgYSBub3RlXHJcbiAqIEByZXR1cm4ge0ludH0gICAgICAgICBOdW1iZXIgcmVwcmVzZW50aW5nIGEgbm90ZVxyXG4gKi9cclxudmFyIGNvbnZlcnRUb25lID0gZnVuY3Rpb24odG9uZSkge1xyXG4gIHZhciBub3RlcyA9IFsnYycsICdjIycsICdkJywgJ2QjJywgJ2UnLCAnZicsICdmIycsICdnJywgJ2cjJywgJ2EnLCAnYSMnLCAnYiddO1xyXG4gIHZhciBzdHIgPSB0b25lLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gIGlmIChzdHIubWF0Y2goL15bYS1oXSM/WzAtOV0kLykpIHtcclxuICAgIHZhciBub3RlID0gc3RyLnN1YnN0cmluZygwLCBzdHIubGVuZ3RoIC0gMSk7XHJcbiAgICB2YXIgb2N0ID0gc3RyLnNsaWNlKC0xKTtcclxuXHJcbiAgICBpZiAobm90ZSA9PT0gJ2gnKSB7XHJcbiAgICAgIG5vdGUgPSAnYic7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbm90ZXMuaW5kZXhPZihub3RlKSArIG9jdCAqIDEyO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VudmFsaWQgc3RyaW5nLiBIYXMgdG8gYmUgbGlrZSBbYS1oXTwjPlswLTldJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBzZXF1ZW5jZXIgZXZlbnQuXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZUNsYXNzIEV2ZW50IGNsYXNzXHJcbiAqIEBwYXJhbSAge1N0cmluZ30gZVR5cGUgIEV2ZW50IHR5cGVcclxuICogQHBhcmFtICB7T2JqZWN0fSBlUHJvcHMgT2JqZWN0IHdpdGggZXZlbnQgcHJvcGVydGllc1xyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICBTZXF1ZW5jZXIgZXZlbnRcclxuICovXHJcbnZhciBjcmVhdGVFdmVudCA9IGZ1bmN0aW9uKGVDbGFzcywgZVR5cGUsIGVQcm9wcykge1xyXG4gIGlmICh2YWxpZGF0ZUNsYXNzKGVDbGFzcykgJiZcclxuICAgIHZhbGlkYXRlVHlwZShlVHlwZSkgJiZcclxuICAgIHZhbGlkYXRlUHJvcHMoZVByb3BzLCBlVHlwZSkpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICdjbGFzcyc6IGVDbGFzcyxcclxuICAgICAgJ3R5cGUnOiBlVHlwZSxcclxuICAgICAgJ3Byb3BzJzogZVByb3BzXHJcbiAgICB9O1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjcmVhdGUgc2VxdWVuY2VyIGV2ZW50LiBXcm9uZyBwYXJhbWV0ZXJzJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYW4gYXVkaW8gbm90ZSBldmVudFxyXG4gKiBAcGFyYW0gIHtJbnR8U3RyaW5nfSB0b25lICAgICBUb25lIGJldHdlZW4gMCBhbmQgMTI3IG9yIHN0cmluZyAoYzMsIGQjNClcclxuICogQHBhcmFtICB7SW50fSAgICAgICAgdmVsb2NpdHkgVmVsb2NpdHkgYmV0d2VlbiAwIGFuZCAxMjdcclxuICogQHBhcmFtICB7SW50fSAgICAgICAgZHVyYXRpb24gRHVyYXRpb24gaW4gNjR0aCBub3Rlc1xyXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgICAgICBBbGwgcHJvcGVydGllcyBpbiBvbmUgb2JqZWN0XHJcbiAqL1xyXG52YXIgY3JlYXRlQXVkaW9Ob3RlID0gZnVuY3Rpb24odG9uZSwgdmVsb2NpdHksIGR1cmF0aW9uLCBpbnN0cikge1xyXG4gIHZhciBwcm9wcyA9IHt9O1xyXG4gIGlmICh0eXBlb2YgdG9uZSA9PT0gJ3N0cmluZycpIHtcclxuICAgIHRvbmUgPSBjb252ZXJ0VG9uZSh0b25lKTtcclxuICB9XHJcbiAgaWYgKHRvbmUgJiYgdmFsaWRhdGVQcm9wVG9uZVZlbG8odG9uZSkpIHtcclxuICAgIHByb3BzLnRvbmUgPSB0b25lO1xyXG4gIH1cclxuICBpZiAodmVsb2NpdHkgJiYgdmFsaWRhdGVQcm9wVG9uZVZlbG8odmVsb2NpdHkpKSB7XHJcbiAgICBwcm9wcy52ZWxvY2l0eSA9IHZlbG9jaXR5O1xyXG4gIH1cclxuICBpZiAoZHVyYXRpb24gJiYgdmFsaWRhdGVQcm9wRHVyYXRpb24oZHVyYXRpb24pKSB7XHJcbiAgICBwcm9wcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xyXG4gIH1cclxuICBpZiAoaW5zdHIgJiYgdmFsaWRhdGVQcm9wSW5zdHJ1bWVudChpbnN0cikpIHtcclxuICAgIHByb3BzLmluc3RydW1lbnQgPSBpbnN0cjtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdBIHNlcXVlbmNlciBldmVudCBtdXN0IGhhdmUgYW4gaW5zdHJ1bWVudCBhcyBwcm9wZXJ0eScpO1xyXG4gIH1cclxuICByZXR1cm4gY3JlYXRlRXZlbnQoJ2F1ZGlvJywgJ25vdGUnLCBwcm9wcyk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBjbGFzczogZXZDbGFzcyxcclxuICB0eXBlOiBldlR5cGUsXHJcbiAgcHJvcGVydHk6IGV2UHJvcCxcclxuICBjcmVhdGVBdWRpb05vdGU6IGNyZWF0ZUF1ZGlvTm90ZVxyXG59O1xyXG4iLCIvKipcclxuICogVGhpcyBpcyBhIHdlYndvcmtlciB0aGF0IHByb3ZpZGVzIGEgdGltZXJcclxuICogdGhhdCBmaXJlcyB0aGUgc2NoZWR1bGVyIGZvciB0aGUgc2VxdWVuY2VyLlxyXG4gKiBUaGlzIGlzIGJlY2F1c2UgdGltaW5nIGhlcmUgaXMgIG1vcmUgc3RhYmxlXHJcbiAqIHRoYW4gaW4gdGhlIG1haW4gdGhyZWFkLlxyXG4gKiBUaGUgc3ludGF4IGlzIGFkYXB0ZWQgdG8gdGhlIGNvbW1vbmpzIG1vZHVsZSBwYXR0ZXJuLlxyXG4gKiBAZXhhbXBsZSA8Y2FwdGlvbj5JdCBpcyBqdXN0IGZvciBsaWJyYXJ5IGludGVybmFsXHJcbiAqIHVzYWdlLiBTZWUgU2VxdWVuY2VyLmpzIGZvciBkZXRhaWxzLjwvY2FwdGlvbj5cclxuICogd29ya2VyLnBvc3RNZXNzYWdlKHsgJ2ludGVydmFsJzogMjAwIH0pO1xyXG4gKiB3b3JrZXIucG9zdE1lc3NhZ2UoJ3N0YXJ0Jyk7XHJcbiAqIHdvcmtlci5wb3N0TWVzc2FnZSgnc3RvcCcpO1xyXG4gKiB3b3JrZXIudGVybWluYXRlKCk7ICAvL3dlYndvcmtlciBpbnRlcm5hbCBmdW5jdGlvbiwganVzdCBmb3IgY29tcGxldGVuZXNzXHJcbiAqL1xyXG4ndXNlIHN0cmljdCc7XHJcblxyXG52YXIgdGltZXIgPSBudWxsO1xyXG52YXIgaW50ZXJ2YWwgPSAxMDA7XHJcblxyXG52YXIgd29ya2VyID0gZnVuY3Rpb24oc2VsZikge1xyXG4gIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uKGUpIHtcclxuICAgIGlmIChlLmRhdGEgPT09ICdzdGFydCcpIHtcclxuICAgICAgdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtzZWxmLnBvc3RNZXNzYWdlKCd0aWNrJyk7fSwgaW50ZXJ2YWwpO1xyXG4gICAgfSBlbHNlIGlmIChlLmRhdGEgPT09ICdzdG9wJykge1xyXG4gICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuICAgIH0gZWxzZSBpZiAoZS5kYXRhLmludGVydmFsKSB7XHJcbiAgICAgIGludGVydmFsID0gZS5kYXRhLmludGVydmFsO1xyXG4gICAgICBpZiAodGltZXIpIHtcclxuICAgICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuICAgICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge3NlbGYucG9zdE1lc3NhZ2UoJ3RpY2snKTt9LCBpbnRlcnZhbCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gd29ya2VyO1xyXG4iXX0=
