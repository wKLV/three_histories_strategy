var staticurl = '/static', controls, bases = [], lastTime, ready = false;;

$(document).ready(function(){
	var renderer = new THREE.WebGLRenderer({antialias:true});
	var body = document.body, html = document.documentElement;
	renderer.setSize( document.body.clientWidth, Math.max( body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight ) );
	document.body.appendChild(renderer.domElement);
	renderer.setClearColorHex(0x111111, 1.0);
    renderer.clear();
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;

    var stats = new Stats();
	stats.domElement.style.position	= 'absolute';
	stats.domElement.style.bottom	= '0px';
	document.body.appendChild( stats.domElement );

	$(document).add($('<div style="position:absolute; bottom:80px; id="coll"/>'))

	Physijs.scripts.worker = staticurl+'/libs/physijs_worker.js';
	Physijs.scripts.ammo = staticurl+'/libs/ammo.js';

	var scene = new THREE.Scene;

	var camera = new THREE.PerspectiveCamera(
	    35,         // Field of view
	    800 / 640,  // Aspect ratio
	    .1,         // Near
	    10000       // Far
	);
	camera.position.set(0,0 ,64);

	controls = new THREE.TrackballControls( camera );

	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;

	controls.noZoom = false;
	controls.noPan = false;

	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	controls.keys = [ 65, 83, 68 ];

	var render = function(time){
		renderer.render(scene, camera);
		stats.update()
		controls.update();

		var dt = time - lastTime;
		lastTime = time;
		map.update(dt);
        if(ready)
		    map.update(dt);
		requestAnimationFrame(render);
	}

	//controls.addEventListener('change', render );

	scene.add(camera);

	var directionallight = new THREE.DirectionalLight(0xffffff, 1.5);
	directionallight.position.set(1, -1, 3);
	scene.add(directionallight);
	directionallight.castShadow = true;
	directionallight.shadowDarkness = 0.5;
	directionallight.shadowCameraLeft = -60;
	directionallight.shadowCameraTop = -60;
	directionallight.shadowCameraRight = 60;
	directionallight.shadowCameraBottom = 60;
	directionallight.shadowCameraNear = 1;
	directionallight.shadowCameraFar = 500;
	directionallight.shadowBias = -.001
	directionallight.shadowMapWidth = directionallight.shadowMapHeight = 2048;
	directionallight.shadowDarkness = .7;

	map = new GAME.Map({scene:scene});
	THREEx.WindowResize(renderer, camera);

	requestAnimationFrame(render);

});

THREE.Vector3.prototype.stringify = function(){
	return this.x +","+this.y+","+this.z
}
//Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

GAME.Map = function(parameters) {
	var scene = parameters.scene;

	var teams = {};
	var bases = [];
	var obstacles = [];
	var routes = {};

	function addTeam(team){
		teams[team.teamName] = team;
		addBase(team.base);
	}

	function addBase(base){
		bases.push(base);
		scene.add(base.mesh)
	}
	function addObst(obst){
		obstacles.push(obst);
		scene.add(obst.mesh)
	}
	function addShip(ship){
		if(!routes[ship.route[0].stringify()]) routes[ship.route[0].stringify()] = {route:ship.route, ships:[]}
		routes[ship.route[0].stringify()].ships.push(ship);
		scene.add(ship.mesh);
	}

	//Load Tech
	$.getJSON(staticurl+'/tech.js', function(data){
		$.each(data, function(i,v){
			var s = v.speed, w = v.weaponry, sh = v.shield, l = v.life, time = v.time, n = i, m = v.model;
			GAME.Resources.loadObj3D(n, "models/"+m+".js");
            for (var i=0; i<s.length; i++){
				GAME.TECH.add({name:n,speed:s[i],weaponry:w[i],shield:sh[i],life:l[i],time:time, points:Math.pow(i+1,10)*101, level:i})
			}
		});
		// Load map
        GAME.Resources.addReady(function() {
            $.getJSON(staticurl+'/maps/basic.js', function(data){
                var bas = data.bases, planets = data.planets, nebulas = data.nebulas;

                $.each(bas, function(i,v){
                    addTeam(createTeam(i,v, this));
                });
                $.each(planets, function(i,v){
                    addObst(createPlanet(i,v, this));
                });
                $.each(nebulas, function(i,v){
                    addObst(createNebula(i,v, this));
                });
		    });
            ready = true;
        });
	});
	this.update = function(dt){
		$.each(teams, function(i,v) {
			v.updateTech(dt/1000);
			var list = v.iterateBases(function(base) {return base.updateReleases(dt/1000) });
			$.each(list, function(k,release) {
				var base = release.base, t = release.ship;
				var ship = createShip(v,t,[new THREE.Vector3(0,-20,0),new THREE.Vector3(-50,-20,0), new THREE.Vector3(0,0,0)]);
				ship.mesh.position.add(base.mesh.position).add(new THREE.Vector3(0,0,10));
				addShip(ship);
			});
		});
		$.each(routes, function(r,ships){
			var r = ships.route, ships = ships.ships, rems = [];
			$.each(ships, function(i,ship){
                //DESTROY
                if(ship.life <= 0){
                     scene.remove(ship.mesh);
                     rems.push(i);

                }
                else {
	            //MOVING TIME
                var s = ship.mesh;
				var sp = s.position.clone()
				var v = sp.sub(r[0]).clone().normalize();
				var ds = v.multiplyScalar(dt*ship.model.tech.speed/1000);
				s.position.sub(ds);
				// It arrives
				if(sp.sub(ds).length() <= 0.5){
					rems.push(i)
					ship.route = ship.route.splice(1);
					if(ship.route.length)
						addShip(ship);
				}
                //BATTLE TIME
                var d = -1, sh;
			    $.each(routes, function(r, ships){
                    $.each(ships.ships, function(i, v){
                        if(v.mesh.position.distanceTo(ship.mesh.position)<d && d !== -1 && v !== ship)
                            sh = v, d = v.mesh.position.distanceTo(ship.mesh.position);
                        else if(d === -1 && v !== ship) sh = v, d = v.mesh.position.distanceTo(ship.mesh.position);
                    });
                });
                if(d < 5)
                    sh.life -= ship.model.tech.weaponry.damage;
                }
            });
			$.each(rems, function(i,v){ships.remove(v-i)})
		});
	}
	function rand(scale){
		return (Math.random()-0.5)*2*scale
	}
	this.paintBackground = function(pos, scale){
		var stars = new THREE.Geometry();
		for(var i =0; i<scale; i++)
			stars.vertices.push(new THREE.Vector3(rand(i/10), rand(i/10), rand(i/20)-scale/10));
		var mat = new THREE.ParticleBasicMaterial({color:0xFFFF00});
		var stars = new THREE.ParticleSystem(stars, mat);
		stars.position.add(pos);
		scene.add(stars);
	}
	for(var i=0; i<5; i++)
		this.paintBackground(new THREE.Vector3(rand(500),rand(500),rand(500)), rand(i*10000));
}
