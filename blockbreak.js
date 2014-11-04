$(function() {
  var Q = window.Q = Quintus()
                     .include("Input,Sprites,Scenes, UI, Input, Touch, 2D, Audio")
                     .setup()
                     .enableSound()
                     .controls().touch();

  Q.input.keyboardControls();
  Q.input.touchControls({ 
            controls:  [ ['left','<' ],[],[],[],['right','>' ] ]
  });

  function goHTML5Audio() {
    Q.assets = {};
    
    loadAssetsAndGo();
  }

  function goWebAudio() {
    Q.assets = [];
    Q.audio.enableWebAudioSound();
    loadAssetsAndGo();
  }

  Q.Sprite.extend("Paddle", {     // extend Sprite class to create Q.Paddle subclass
    init: function(p) {
      this._super(p, {
        sheet: 'paddle',
        speed: 200,
        x: 0,
      });
      this.p.x = Q.width/2;
      this.p.y = Q.height - this.p.h;
      if(Q.input.keypad.size) {
        this.p.y -= Q.input.keypad.size + this.p.h;
      }
    },

    step: function(dt) {
      if(Q.inputs['left']) { 
        this.p.x -= dt * this.p.speed;
      } else if(Q.inputs['right']) {
        this.p.x += dt * this.p.speed;
      }
      if(this.p.x < 30) { 
        this.p.x = 30;
      } else if(this.p.x > Q.width - 30) { 
        this.p.x = Q.width - 30;
      }
//      this._super(dt);	      // no need for this call anymore
    }
  });

  Q.Sprite.extend("Ball", {
    init: function() {
      this._super({
        sheet: 'ball',
        speed: 200,
        dx: 1,
        dy: -1,
      });
      this.p.y = Q.height / 2 - this.p.h;
      this.p.x = Q.width / 2 + this.p.w / 2;
	  
	  this.on('hit', this, 'collision');  // Listen for hit event and call the collision method
	  
	  this.on('step', function(dt) {      // On every step, call this anonymous function
		  var p = this.p;
		  Q.stage().collide(this);   // tell stage to run collisions on this sprite
      var livesTxt = Q.state.get("lives");
		  p.x += p.dx * p.speed * dt;
		  p.y += p.dy * p.speed * dt;

		  if(p.x < 5) { 
			p.x = 5;
			p.dx = 1;
      Q.audio.play('powerdown');
		  } else if(p.x > Q.width - 5) { 
			p.dx = -1;
			p.x = Q.width - 5;
      Q.audio.play('powerdown');
		  }

		  if(p.y < 40) {
			p.y = 40;
			p.dy = 1;
      Q.audio.play('powerdown');
		  } else if(p.y > Q.height) { 
        Q.state.dec("lives",1);
        //Q.state.set("lives",2);
        this.destroy();
        Q.stage().trigger('newBall');
        if (livesTxt == 1){
         // Q.state.set("score",0);
           Q.stageScene('lose');
        }
  			
		  }
	  });
    },
	
	collision: function(col) {                // collision method
		if (col.obj.isA("Paddle")) {
//			alert("collision with paddle");
        Q.audio.play('powerup');
			this.p.dy = -1;
		} else if (col.obj.isA("Block")) {
//			alert("collision with block");
			col.obj.destroy();
			this.p.dy *= -1;
			Q.stage().trigger('removeBlock');
		}
	}
  });


  Q.Sprite.extend("Block", {
    init: function(props) {
      this._super(_(props).extend({ sheet: 'block'}));
      this.on('collision',function(ball) { 
        this.destroy();
        ball.p.dy *= -1;
        Q.stage().trigger('removeBlock');
      });
    }
  });

   Q.UI.Text.extend("Score",{
    init: function() {
      this._super({
        label: "Score: 0",
        x: 273,
        y: 14,
        color:"#FF0000",
        size:20
      });

      Q.state.on("change.score",this,"score");
    },

    score: function(score) {
      this.p.label = "Score: " + score;
    }
  });

   Q.UI.Text.extend("Lives",{
    init: function() {
      this._super({
        label: "Lives: 3",
        x: 50,
        y: 14,
        color:"#FF0000",
        size:20
      });

      Q.state.on("change.lives",this,"lives");
    },

    lives: function(lives) {
      this.p.label = "Lives: " + lives;
    }
  });

   //Q.enableSound();
   Q.audio.enableHTML5Sound();

//  Q.load(['blockbreak.png','blockbreak.json'], function() {
 // Q.load(['blockbreak.png', "brickDeath.mp3", "powerup.mp3", "powerdown.mp3"], function() {
  Q.load({"blockbreak": "blockbreak.png", 
          "brickDeath": "brickDeath.mp3",
          "powerup": "powerup.mp3", 
          "powerdown": "powerdown.mp3"}, function() {
	Q.sheet("ball", "blockbreak", { tilew: 20, tileh: 20, sy: 0, sx: 0 });
	Q.sheet("block", "blockbreak", { tilew: 40, tileh: 20, sy: 20, sx: 0 });
	Q.sheet("paddle", "blockbreak", { tilew: 60, tileh: 20, sy: 40, sx: 0 });		 		 
    Q.scene('game',new Q.Scene(function(stage) {
      stage.insert(new Q.Paddle());
      stage.insert(new Q.Ball());

            var container = stage.insert(new Q.UI.Container({
            x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
          }));

             Q.stageScene("hud"); 

             var currLives = Q.state.get("lives");
            
           //var label = container.insert(new Q.UI.Text({x: -120, y: -195, 
            //                                       label: "Lives: " + currLives,
             //                                      color:"#FF0000",
               //                                    size:20}));
      var blockCount=0;
      for(var x=0;x<6;x++) {
        for(var y=1;y<6;y++) {
          stage.insert(new Q.Block({ x: x*50+35, y: y*30+10 }));
          blockCount++;
        }
      }
      stage.on('removeBlock',function() {
        Q.audio.play('brickDeath');
        blockCount--;  
        Q.state.inc("score",1);
        if(blockCount == 0) {
          Q.stageScene('win');
        }
      });

       stage.on('newBall',function() {
        stage.insert(new Q.Ball());
      });

    }));
     Q.scene('title',new Q.Scene(function(stage) {
        var container = stage.insert(new Q.UI.Container({
            x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
          }));
        var label = container.insert(new Q.UI.Text({x: 0, y: -100, 
                                                   label: "Block Break",
                                                   color:"#FF0000",
                                                   size:40}));

         var button = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
                                                  label: "Play game" })) 
          var label = container.insert(new Q.UI.Text({x:-80, y: 60, 
                                                   label: "Instuctions:",
                                                   color:"#FF0000",
                                                   size:20 }));
          var label = container.insert(new Q.UI.Text({x:-25, y: 88, 
                                                   label: "User left arrrow (<) to move left",
                                                   color:"#FF0000",
                                                   size:15}));
          var label = container.insert(new Q.UI.Text({x:-14, y: 116, 
                                                   label: "User right arrrow (>) to move right",
                                                   color:"#FF0000" ,
                                                   size:15}));

          button.on("click",function() {
             Q.clearStages();
              Q.state.reset({ score: 0, lives: 3 });
            Q.stageScene('game');
          });


    }));
    Q.scene('win',new Q.Scene(function(stage) {
        var container = stage.insert(new Q.UI.Container({
            x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
          }));
        var label = container.insert(new Q.UI.Text({x: 0, y: -100, 
                                                   label: "You Win!",
                                                   color:"#FF0000",
                                                   size:40}));

         var button = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
                                                  label: "Play Again" })) 

        Q.state.reset({ score: 0, lives: 3 });

          button.on("click",function() {
             Q.clearStages();
            Q.stageScene('game');
          });


    }));

        Q.scene('lose',new Q.Scene(function(stage) {
        var container = stage.insert(new Q.UI.Container({
            x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
          }));
        var label = container.insert(new Q.UI.Text({x: 0, y: -100, 
                                                   label: "You Lose!",
                                                   color:"#FF0000",
                                                   size:40}));

         var button = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
                                                  label: "Play Again" })) 
         Q.state.reset({ score: 0, lives: 3 });
   
          button.on("click",function() {
             Q.clearStages();
            Q.stageScene('game');
          });


    }));

         Q.scene("hud",function(stage) {
    stage.insert(new Q.Score());
    stage.insert(new Q.Lives());
  }, { stage: 1 });


    Q.stageScene('title');
  } );  
});