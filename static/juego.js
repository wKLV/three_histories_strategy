var staticurl = '/static', controls, bases = [], lastTime,
ready = false, map, camera, projector = new THREE.Projector();

$(document).ready(function(){
    $("#baseUI").load(staticurl+"/icons/baseUI.svg");
    $("#baseUI").hide();
    $("#nodeUI").load(staticurl+"/icons/nodeUI.svg");
    $("#nodeUI").hide();

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
    $(document).mousemove(map.mouseMove);
    $(document).mousedown(map.mousedown);
    $(document).mouseup(map.mouseup);
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

GAME.Node = function(target, tactics){
    this.target = target, this.tactics = tactics, this.ships = {}, this.length = 0;;
}
GAME.Node.prototype.addShip = function(ship){
        if(!this.ships[ship.id])
            this.ships[ship.id] = ship.id, this.length ++;
        return this;
}

GAME.Node.CHASE = "chase",
GAME.Node.WAIT5 = "wait5",
GAME.Node.WAIT10 = "wait10";

GAME.Map = function(parameters) {
    var scene = parameters.scene;

    var teams = {},
    bases = [],
    basesMesh = [],
    ids = 0,
    obstacles = [],
    ships = {},
    routes = this.routes = {},
    enmyroutes = [new GAME.Node(new THREE.Vector3(40,40,10), GAME.Node.WAIT10),
                                           new GAME.Node(new THREE.Vector3(0,-20,0), GAME.Node.WAIT5),
                                           new GAME.Node(new THREE.Vector3(-50,-20,0), GAME.Node.CHASE),
                                           new GAME.Node(new THREE.Vector3(0,0,0), GAME.Node.CHASE)]
    routeslines = {},
    mode = "hummer";

    function addTeam(team){
        teams[team.teamName] = team;
        addBase(team.base);
    }

    function addBase(base){
        bases.push(base);
        basesMesh.push(base.mesh.children[0]);
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
            routes[n] = [new GAME.Node(new THREE.Vector3(-40,-40,-10), GAME.Node.WAIT10)];
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
    var lines = [], teamMats = {},
        mouseOver = new THREE.Mesh(
            new THREE.PlaneGeometry(15,15),
            new THREE.MeshPhongMaterial({color:"#ffffff"})
        );
    mouseOver.material.opacity=0.5, mouseOver.material.transparent=true;
    scene.add(mouseOver);
    mouseOver.visible = false;
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
                    var ship = createShip(ids, v,t,routes[t.tech.name].slice(0));
                else
                    var ship = createShip(ids, v,t, enmyroutes.slice(0));                                        ;
                ship.mesh.position.add(base.mesh.position).add(new THREE.Vector3(0,0,10));
                addShip(ship);
            });
        });
        $.each(ships, function(id, ship){
            var r = ship.route;
            //DESTROY
            if(ship.life <= 0){
                 if(ship.route[1].ships[ship.id]){
                     ship.route[1].length --;
                    delete ship.route[1].ships[ship.id]
                 }
                 delete ships[id];
                 scene.remove(ship.mesh);
            }
            else {
            //MOVING TIME
            var s = ship.mesh;
            var sp = s.position.clone()
            if(r[1]){
                var v, ds;
                if(r[1].target instanceof THREE.Vector3)
                    v = sp.sub(r[1].target).clone().normalize()
                else if (r[1].target instanceof GAME.Ship)
                    v = sp.sub(r[1].target.mesh.position).clone().normalize()
                ds = v.multiplyScalar(dt*ship.model.tech.speed/1000);
                s.position.sub(ds);
                // It arrives
                if(sp.sub(ds).length() <= 0.5){
                    r[1].addShip(ship)
                    if((r[1].length >= 5 && r[1].tactics === GAME.Node.WAIT5) ||
                      r[1].length >=10 && r[1].tactics === GAME.Node.WAIT10 ||
                      r[1].tactics === GAME.Node.CHASE){
                        r[1].ships[ship.id] = false;
                        var all = true;
                        $.each(r[1].ships, function(i,v){
                            if(v) all = false;
                            return all;
                        });
                        if(all) r[1].ships = {}, r[1].length = 0;
                        ship.route = ship.route.splice(1);
                    }
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

    this.repaintRoute = function(){
        var geo = new THREE.Geometry();
        $.each(routes[mode], function(i, p){
            geo.vertices.push(p.target);
        });
        scene.remove(routeslines[mode]);
        routeslines[mode] = line = new THREE.Line(geo);
        scene.add(line);
    }

    function unProject(event, objs){
        var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
        projector.unprojectVector( vector, camera );

        var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

        return raycaster.intersectObjects(objs);
    }

    this.mousedown = function(event){
        event.preventDefault();
        var base = unProject(event, basesMesh)[0]
        if(base){
             $("#baseUI").show().css("left", event.clientX-175+"px").css("top", event.clientY+"px");
       }
        else{
            $("#nodeUI").show().css("left", event.clientX-175+"px").css("top", event.clientY+"px");

            lastNode.point = unProject(event, [plane])[0].point;
                    }

    }
    this.mouseup = function(event){
        $("#baseUI").hide();
        $("#nodeUI").hide();

    }

    this.mouseMove = function(event){
        event.preventDefault();

        var obj = unProject(event, basesMesh)[0];
        if(obj){
            obj = obj.object;
            mouseOver.visible = true;
            mouseOver.position = obj.parent.position.clone().add(new THREE.Vector3(0,0,-10)).add(obj.position);
        }
        else{
            mouseOver.visible = false;
        }
    }
    this.setMode = function(mod){
        mode = mod;
        routes[mode] = [new GAME.Node(new THREE.Vector3(-40,-40,-10), GAME.Node.WAIT10)]
    }
}

GAME.UI = function(pressed){
    map.setMode(pressed);
};
var lastNode = {};
GAME.UInode = function(pressed){
    map.routes[mode].push(new GAME.Node(lastNode.point, pressed));
    map.repaintRoute();
}
