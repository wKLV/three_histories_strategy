var staticurl = '/static', controls, bases = [], lastTime,
ready = false, map, camera, projector = new THREE.Projector();

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

    camera = new THREE.PerspectiveCamera(
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
//directionallight.castShadow = true;
//directionallight.shadowDarkness = 0.5;
//directionallight.shadowCameraLeft = 60;
//directionallight.shadowCameraTop = -60;
//directionallight.shadowCameraRight = 60;
//directionallight.shadowCameraBottom = 60;
//directionallight.shadowCameraNear = 1;
//directionallight.shadowCameraFar = 500;
//directionallight.shadowBias = -.001
//directionallight.shadowMapWidth = directionallight.shadowMapHeight = 2048;
//directionallight.shadowDarkness = .7;

	map = new GAME.Map({scene:scene});
	THREEx.WindowResize(renderer, camera);

    $(document).click(map.click);
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

    var teams = {},
    bases = [],
    ids = 0,
    obstacles = [],
    ships = {},
    routA = [new THREE.Vector3(-40,-40,10)];


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
        ships[ship.id] = ship;
        scene.add(ship.mesh);
    }

    //Load Tech
    $.getJSON(staticurl+'/tech.js', function(data){
        $.each(data, function(i,v){
            var s = v.speed, w = v.weaponry, wt = v.weapontype, sh = v.shield, l = v.life, time = v.time, n = i, m = v.model;
            GAME.Resources.loadObj3D(n, "models/"+m+".js");
            for (var i=0; i<s.length; i++){
                GAME.TECH.add({name:n,speed:s[i],weaponry:w[i], weapontype: wt, shield:sh[i],life:l[i],time:time, points:Math.pow(i+1,10)*101, level:i})
            }
        });
        // Load map
        GAME.Resources.addReady(function() {
            $.getJSON(staticurl+'/maps/basic.js', function(data){
                var bas = data.bases, planets = data.planets, nebulas = data.nebulas;

                plane = new THREE.Mesh(new THREE.PlaneGeometry(1000,1000), new THREE.MeshBasicMaterial())
                plane.visible = false;
                scene.add(plane);

                $.each(bas, function(i,v){
                    addTeam(createTeam(i,v, this));
                    teamMats[i] = new THREE.LineBasicMaterial({color:parseInt(v.color,16)});
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
    var lines = [], teamMats = {};
    this.update = function(dt){
        $.each(lines, function(i,v){
            scene.remove(v);
        });
        lines = [];
        $.each(teams, function(i,v) {
            v.updateTech(dt/1000);
            var list = v.iterateBases(function(base) {return base.updateReleases(dt/1000) });
            $.each(list, function(k,release) {
                var base = release.base, t = release.ship;
                ids ++;
                if(v.teamName === "A")
                    var ship = createShip(ids, v,t,routA.slice(0));
                else
                    var ship = createShip(ids, v,t,[new THREE.Vector3(40,40,10),new THREE.Vector3(0,-20,0),new THREE.Vector3(-50,-20,0), new THREE.Vector3(0,0,0)]);
                ship.mesh.position.add(base.mesh.position).add(new THREE.Vector3(0,0,10));
                addShip(ship);
            });
        });
        $.each(ships, function(id, ship){
            var r = ship.route;
            //DESTROY
            if(ship.life <= 0){
                 delete ships[id];
                 scene.remove(ship.mesh);
            }
            else {
            //MOVING TIME
            var s = ship.mesh;
            var sp = s.position.clone()
            if(r[1]){
                var v = sp.sub(r[1]).clone().normalize();
                var ds = v.multiplyScalar(dt*ship.model.tech.speed/1000);
                s.position.sub(ds);
                // It arrives
                if(sp.sub(ds).length() <= 0.5){
                    ship.route = ship.route.splice(1);
                }
            }
            //BATTLE TIME
            $.each(ships, function(i, v){
                if(ship !== v) ship.AI.updateAttackShip(v);
            });
            $.each(ship.AI.returnResult(), function(i,v){
                v.life -= ship.model.tech.weaponry.damage*ship.model.tech.weaponry.frequency*dt/1000
                var geo = new THREE.Geometry();
                geo.vertices.push(ship.mesh.position);
                geo.vertices.push(v.mesh.position);
                lines.push(new THREE.Line(geo, teamMats[ship.team.teamName]));
            });
            ship.AI.reset();
            }
        });
        $.each(lines, function(i,v){
            scene.add(v);
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

    function repaintRoute(){
        var geo = new THREE.Geometry();
        $.each(routA, function(i, p){
            geo.vertices.push(new THREE.Vertex(p));
        });
        line = new THREE.Line(geo);
        scene.add(line);
    }

    this.click = function(event){
        event.preventDefault();

        var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
        projector.unprojectVector( vector, camera );

        var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

        var intersects = raycaster.intersectObjects([plane]);
        routA.push(intersects[0].point);
        repaintRoute();
    }
}
