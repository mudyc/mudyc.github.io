
// // Load them google fonts before starting...!
window.WebFontConfig = {
    google: {
        families: ['Fjalla One', 'Marvel']
    },

    active: function() {
        // do something
        init();
    }
};

// include the web-font loader script
/* jshint ignore:start */
(function() {
    var wf = document.createElement('script');
    wf.src = ('https:' === document.location.protocol ? 'https' : 'http') +
        '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
})();



function Anim() {
}
Anim.linear = function(x, t) { return x; }
Anim.pow2 = function(x, t) { return x*x; }
Anim.sqrt = function(x, t) { return Math.sqrt(x); }
Anim.jiggle = function(x, t) { return Math.sin(x * t * Math.PI); }

Anim.render = function(renderer, timer) {
  var a = this;
  var phase = 0;
  if (timer.curr >= a.delay)
    phase = a.interp((timer.curr - a.delay)/a.time, a.time - a.delay);
  if (timer.curr > a.delay + a.time)
    phase = 1;
  
  // update position
  for (i in a.from) {
    if (a.from.hasOwnProperty(i) && a.to[i] !== undefined) {
      a.obj[i] = a.from[i] + (a.to[i] - a.from[i]) * phase
    }
  }
  if (a.set !== undefined) {
    for (i in a.set) {
      a.obj[i] = a.set[i]
    }
  }

}

function Parallel(scene) {
  var anims = [];

  var self = {
    time: 0,
    add: function(a){
      if (a.time === undefined) a.time = 0;
      if (a.delay === undefined) a.delay = 0;
      if (a.interp === undefined) a.interp = Anim.linear;
      if (a.render === undefined) a.render = Anim.render;

      self.time = Math.max(self.time, a.delay + a.time);
      anims.push(a);
    },
    render: function(renderer, timer){
      var len = anims.length;
      while (--len >= 0) {
        var a = anims[len];
        a.render.call(a, renderer, timer);
      }
      if (scene !== null)
        renderer.render(scene);
    }
  };
  return self;
}

function Seq(scene) {
  var curr = 0;

  var anims = [];

  var self = {
    time: 0,
    add: function(a) {
      if (a.time === undefined) a.time = 0;
      if (a.delay === undefined) a.delay = 0;
      if (a.interp === undefined) a.interp = Anim.linear;
      if (a.render === undefined) a.render = Anim.render;
      anims.push(a);
      self.time += a.delay + a.time;
    },
    render: function(renderer, timer) {
      var tmax = self.time;
      var len = anims.length;
      while (--len >= 0) {
        var a = anims[len];
        var tmin = tmax - a.delay - a.time;
        //console.log(len, tmin, tmax, timer, timer.curr);
        if (tmin <= timer.curr && timer.curr < tmax) {
          timer.push(tmin);
          a.render.call(a, renderer, timer);
          timer.pop();
        }
        tmax = tmin;
      }
      if (scene !== null)
        renderer.render(scene);
    },
  };
  return self;
}

// the main timer
function Timer(top_anim){
  var known_time = 0;
  var time_stack = [];

  var self = {
    time: top_anim.time,
    curr: 0, // position of relative time in seconds
    tick: function(){
      if (self.next_curr !== undefined) {
        self.curr = self.next_curr;
        self.next_curr = undefined;
      }

      var t1 = Date.now();
      var t0 = known_time;
      known_time = t1;
      var dt = (t1-t0)/1000;
      if (dt > 0.5) dt = 0;
      self.curr += dt;
      
      if (top_anim.time < self.curr) self.curr = self.time - 0.001;
    },
    real_curr: function() {
      var ret = self.curr;
      var len = time_stack.length;
      while (--len >= 0) {
        ret += time_stack[len];
      }
      return ret; 
    },
    set_next_curr: function(value) {
      self.next_curr = value;
    },
    push: function(time){
      time_stack.push(time);
      self.curr -= time;
    },
    pop: function() {
      self.curr += time_stack.pop();
    }
  };  
  return self;
}


function init() {

  var RIGHT = window.innerWidth*2;

  var headerfont = { font: 'normal 60px Fjalla One', fill: '#000000', align: 'left', stroke: '#000000', strokeThickness: 1 };
  var linefont = { font: 'normal 24px Marvel', fill: '#000000', align: 'left', stroke: '#000000', strokeThickness: 0.9 };

  // i need to make this global because of different scenes..
  var drag_state = {
    data: null,
    dragging: false,
    x: 0,
  };

  function timeline() {
    // timeline
    var graphics = new PIXI.Graphics();
    graphics.beginFill(0x999999);
    graphics.lineStyle(1, 0x333333, 1);
  
    // draw a shape
    graphics.moveTo(0,0);
    graphics.lineTo(30, 0);
    graphics.lineTo(30, 35);
    graphics.lineTo(0, 35);
    graphics.endFill();
    graphics.alpha = 0.55;

    graphics.interactive = true;
    graphics.buttonMode = true;

    graphics.mousedown = graphics.touchstart = function(event)
		{
			drag_state.data = event.data;
			drag_state.dragging = true;
		};

    graphics.mouseup = graphics.mouseupoutside = graphics.touchend = graphics.touchendoutside = function(data)
		{
			drag_state.dragging = false;
			drag_state.data = null;
		};
    graphics.mousemove = graphics.touchmove = function()
		{
			if(drag_state.dragging)
			{
				var newPosition = drag_state.data.getLocalPosition(this.parent);
        drag_state.x = newPosition.x;
				this.position.x = newPosition.x;
				this.position.y = newPosition.y;
			}
		}

    return graphics;
  }



  function texts(arr) {
    var names = ['header','t0','t1','t2','t3','t4','t5','t6'];
    var fonts = [headerfont, linefont, linefont, linefont, linefont, linefont];
    var margins = [50, 30,30,30,30,20];
    ret = {
      paper: new Paper(),
      stage: new PIXI.Container(),
      scene: new PIXI.Container(),
    };
    ret.anim = new Parallel(ret.stage),
    ret.stage.addChild(ret.scene);
    ret.stage.addChild(timeline());


    ret.scene.addChild(ret.paper);

    var y = 0, delay = 0;
    for (idx in arr) {
      var text = arr[idx];
      var time = text.length * 0.033 + 0. + text.split('\n').length * 0.5;

      var t = new PIXI.Text(text, fonts[idx]);
      t.y = y;
      ret[names[idx]] = t;
      ret.scene.addChild(t);
      if (fonts[idx] == headerfont)
        ret.anim.add({ obj: t, time: time, from:{ alpha: 0 }, to:{ alpha: 1 }});
      else
        ret.anim.add({ obj: t, delay: delay, time: 0.5,
                       interp: Anim.pow2, from:{ x: RIGHT }, to:{ x: 50 + idx*10}});
      var line_mul = Math.ceil(-1 + 1.5 * text.split('\n').length);

      y += parseInt(fonts[idx].font.split(' ')[1])*(line_mul);
      y += margins[idx];
      delay += time;
    };
    ret.anim.add({ delay: delay + 3 });


    return ret;
  }


  var s1 = (function(){
    o = texts([
      "I'm UX & Software Designer",

      'This means I can do stuff that works,',

      'I can measure if people really find it usable, and',

      'adjust it to make it actually easy to use.'
    ]);

    o.anim.add({ obj: o.paper, set: { seed: 14553 }});
    return o.anim;
  })();  


  var s2 = (function(){
    o = texts([
      'Different people find UX\nto mean different things',

      'To me UX means happy end user.',

      'As a UX designer I want to make something that matters\n'+
      'to the user and gives user warm vibes.',

      'As a software designer I want to make it happen by\n'+
      'using beautiful code and good programming practices.']);

    var happy = new PIXI.Sprite(PIXI.Texture.fromImage('happy.png'));
    happy.position.x = 370;
    happy.position.y = 150;
    happy.scale.x = happy.scale.y = 0.3;
    o.anim.add({obj: happy, delay: 3.5, from: { alpha:0}, to: { alpha: 1}});
    
    o.scene.addChild(happy);
    


    o.anim.add({ obj: o.paper, set: { seed: 145532 }});
    return o.anim;
  })();  


  var s3 = (function(){
    o = texts([
      'I have been interested in\nusability since 2005',

      'It was the time when I understood that it does not matter how\n'+
      'excellent technology you use if the user interface sucks. Thus,\n'+
      'doing things right is not same as doing right things.',

      'First I thought usability was only about interaction design.  I\n'+
      'think well done interaction design will bring UX far but the final\n'+
      'touch comes with visual design. It helps to design things when you\n'+
      'know what you can actually achieve in software world.']);

    o.anim.add({ obj: o.paper, set: { seed: 1270345532 }});
    return o.anim;
  })();  


  var s4 = (function(){
    o = texts([
      'I am not visual designer',

      'In portfolio you should be able to show things and I think this\n'+
      'would mean visual designs. So if you are looking for visual\n'+
      'designer I am not the right person for the job.',
    ]);
    o.anim.add({ obj: o.paper, set: { seed: 127852387 }});
    return o.anim;
  })();  


  var s5 = (function(){
    o = texts([
      'That being said I have eye\n'+
      'for aesthetics',

      'I have been creating some wood work.',

      'Like this, this and this..',

      'I can draw but it takes time...',
    ]);

    var images = [
      'http://2.bp.blogspot.com/-ksGo2HLqWmM/T8PUXAqIa-I/AAAAAAAAAhQ/rwLQNpURPEU/s1600/17052012%2528007%2529.jpg',
      'http://3.bp.blogspot.com/-COv8Sj8zAs8/Td7A5uH4JGI/AAAAAAAAAXc/tI1bKtIdcPI/s1600/26052011%2528001%2529.jpg',
      'http://3.bp.blogspot.com/_YKIEjmlB388/TBqR_8Pn7SI/AAAAAAAAAKs/t6U4adypcEU/s1600/puu.png',
      'http://3.bp.blogspot.com/_YKIEjmlB388/TQ8emKbR79I/AAAAAAAAATo/zgxtlt1HEiQ/s1600/27112010%2528024%2529.jpg',
      'harakka.png',
      'pupu.png',
      'leijona.jpg',
      'perhonen.jpg',
    ];
    images = images.map(function(url){ return new PIXI.Texture.fromImage(url); });
    sprites = images.map(function(img){ return new PIXI.Sprite(img); });
    for (i in images) {
      images[i].on('update', function(img){
        var v = (img.height > img.width)? img.height: img.width;

        this.height = 400 * this.height/this.width;
        this.width = 400;
        this.y = 120;
      }, sprites[i]);
      o.scene.addChild(sprites[i]);
      o.anim.add({obj: sprites[i], delay: 3+i*2, time: 0.6, from: { x: RIGHT }, to:{ x: 400 }});
      o.anim.add({obj: sprites[i], delay: 5+i*2, time: 0.4, from: { alpha: 1 }, to:{ alpha: 0 }});

    }


    o.anim.add({ obj: o.paper, set: { seed: 12084390 }});
    return o.anim;
  })();  

  var s7 = (function(){
    o = texts([
      'How do I work?',

      'As a UX designer I want to work with end users if that is possible.\n'+
      'I cannot really work alone for long time. I really need some feedback when doing design work.\n'+
      'As a software designer I want to center on things one at time and do it well.'
    ]);
    o.anim.add({ obj: o.paper, set: { seed: 8756114425 }});
    return o.anim;
  })();  


  var s7 = (function(){
    o = texts([
      'What methods I use?',

      'It depends on the case.',

      'For new products I love to use paper prototyping first. It is fast,\n'+
      'it is cheap. Then I like to continue with HTML+javascript prototyping.\n'+
      'I find that these small prototypes are great because of you can easily run\n'+
      'them on web and try on different devices and you get the feel. And,\n'+
      'you can easily measure users.',

      'Measuring users I love to do by conducting usability tests with few\n'+
      'users. It is very intimating to try to think what the user is\n'+
      'actually thinking and find the bottlenecks in the design.',
  
      'I have also done focus groups and online queries. And I can do\n'+
      'statistical analysis for quantitative user research.'
    ]);
    o.anim.add({ obj: o.paper, set: { seed: 1111718486092 }});
    return o.anim;
  })();  

  var s8 = (function(){
    o = texts([
      'How many programming languages\nI can manage?',

      'Enough. I used to have a plan to learn at least one new programming\n'+
      'language per year. At some point it was not fun anymore - they all\n'+
      'do what I want in the end. I try to pick a one that is good fit for\n'+
      'the project/product.',

      'Anyway, here is list: C, C++, Java (Certified Java Programmer, J2SE 1.4),\nScala, Javascript, Coffeescript, Perl, Bash, assemblers, Python, Ruby,\nDelphi, Haskell, VHDL, XSLT, Postscript.'
    ]);
    o.anim.add({ obj: o.paper, set: { seed: 98786107 }});
    return o.anim;
  })();  

  var s9 = (function(){
    o = texts([

      "Let's continue with other buzzwords...",

      "methods - user centered design, interaction design, \n"+
      "          prototype based design, emotional design, value based design,\n"+
      "          visualizations, wireframes, use-cases",

      "web - rails, sinatra, tornado, plone, pybottle, scalatra, J2EE, xslt, nginx, varnish, jQuery",

      "data - json, xml, xslt, rdf, sql, solr, lucene, redis, awk, sed",

      "ui toolkits - Web, Canvas, OpenGL, GTK+, Qt+, Cairo, Hildon, SWT and Jface, Swing, AWT"
    ]);
    o.anim.add({ obj: o.paper, set: { seed: 1870280372 }});
    return o.anim;
  })();  



  var s10 = (function(){
    o = texts([
      'So what have I done?',

      'I started by doing software development in 2002. Then UX design\n'+
      'came along few years later. At some point I have been also doing\n'+
      'team lead, scrum master, architect, security engineering. I am\n'+
      'usually one of the important pieces in the team that are needed\n'+
      'to make things happen.'
    ]);
    return o.anim;
    o.anim.add({ obj: o.paper, set: { seed: 41614 }});
  })();  

  var s11 = (function(){
    o = texts([
      'Why did I build a portfolio\nas a game app?',

      'Because of you are looking for top talent people and I want to pop\n'+
      'out from the mass :-) Also I want to push my limits every time I do\n'+
      'something.',
    ]);
    o.anim.add({ obj: o.paper, set: { seed: 871 }});
    return o.anim;
  })();  

  var s12 = (function(){
    o = texts([
      'Anyway I will open my\nthinking even more:',

      'The background images, or unique background textures, are from\n'+
      'research project I was involved in my early career. I find them\n'+
      'attractive and I hope you too.',

      'I use pixi.js as a platform because it is just mind blowing\n'+
      'fast. And by using that I make a statement for the speed. I think\n'+
      'performance is important factor of everything that is being\n'+
      'made. If the product is not performing it is not really working in the\n'+
      'first place.',

      'I will do my own tools if needed or sometimes just for fun.',
    ]);
    o.anim.add({ obj: o.paper, set: { seed: 920637 }});
    return o.anim;
  })();  


  var s13 = (function(){
    o = texts([
     'I am looking for the opportunity..',
     '...with my support team.'
    ]);
    o.anim.add({ obj: o.paper, set: { seed: 125443547 }});

    var happy = new PIXI.Sprite(PIXI.Texture.fromImage('support.png'));
    happy.position.x = 400;
    happy.position.y = 350;
    happy.anchor.x = happy.anchor.y = 0.5;
    happy.scale.x = happy.scale.y = 1;
    o.anim.add({obj: happy, delay: 3, time: 1.4, from: { alpha:0}, to: { alpha: 1}});
    o.anim.add({obj: happy, delay: 3.5, time: 15, interp: Anim.jiggle, from: { rotation: -0.05}, to: { rotation: 0.1}});
    
    o.scene.addChild(happy);

    return o.anim;
  })();  






  var s = new Seq(null);
  s.add(s1);
  s.add(s2);
  s.add(s3);
  s.add(s4);
  s.add(s5);
  //s.add(s6);
  s.add(s7);
  s.add(s8);
  s.add(s9);
  s.add(s10);
  s.add(s11);
  s.add(s12);
  s.add(s13);


  // create a renderer instance.
  var renderer = new PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight,{background: 0xffffffff, autoResize: true});
  // set the canvas width and height to fill the screen
  renderer.view.style.display = "block";
  document.body.appendChild(renderer.view);

  var container = new PIXI.Container();

  var timer = new Timer(s);


  renderer.old_render = renderer.render;
  renderer.render = function(stage) {
    var w = window.innerWidth;
    var h = window.innerHeight;

    // set timeline
    var timeline = stage.getChildAt(1);
    timeline.position.y = h - 36;
    if (!drag_state.dragging)
      timeline.position.x = (w-31) * timer.real_curr()/timer.time;
    else
      timer.set_next_curr(timer.time * drag_state.x / (w-31));
    

    // do adjustment to be responsive!!
    // let's aim at 800x600 resolution
    var scene = stage.getChildAt(0);
    var scale = 1;
    if (w < 800 || h < 600) {
      var orig = 800/600;
      var sc = w/h;
      scale = (orig < sc)? h/600: w/800;
      scene.scale.x = scale;
      scene.scale.y = scale;
    }
     
    scene.position.x = (w - (800*scale))/2;
    scene.position.y = (h - (600*scale))/2;
    
    renderer.old_render(stage);
  };


  function animate() {

      timer.tick();

      s.render(renderer, timer);

      //renderer.render(container);
      //if (timer.curr < 0.2)
      requestAnimFrame(animate);
  }
  animate();


  window.addEventListener('resize', function(e){
    renderer.resize(window.innerWidth, window.innerHeight);
  });
  document.body.onresize = function(e){
    renderer.resize(window.innerWidth, window.innerHeight);
  };
};
