var NEBULA = "nebula";
var PLANET = "planet";

GAME.Obstacle = function(name, parameters){
	this.name = name;
	this.size = parameters.size;
	this.color = parseInt(parameters.color, 16);
	this.tech = {}; // TODO
	this.type = parameters.type; // nebula or planet
}

GAME.Obstacle.prototype.createVisual = function(){
	var mesh, size = this.size;
	switch (this.type){
	case PLANET:
		var geo = new THREE.SphereGeometry(size);
		var mat = new THREE.MeshPhongMaterial({color:this.color});
		mesh = new THREE.Mesh(geo, mat);
		break;
	case NEBULA:
		function randPos(){
			var a = function(){ return Math.random()-0.5}
			return 4*a()*a() * size
		}
		var geo = new THREE.Geometry();
		for (var i =0; i< size*100; i++)
			geo.vertices.push(new THREE.Vector3(randPos(),randPos(),randPos()))
		var mat = new THREE.ParticleBasicMaterial({color:this.color});
		mesh = new THREE.ParticleSystem(geo, mat);
		break;
	}
	return mesh;
}

function createPlanet(name, parameters, scene){
	parameters.type = PLANET;
	var planet = new GAME.Obstacle(name, parameters);

	planet.mesh = planet.createVisual();
	planet.mesh.position.set(parameters.pos[0], parameters.pos[1], 0);
	return planet;
}

function createNebula(name, parameters, scene){
	parameters.type = NEBULA;
	var nebula = new GAME.Obstacle(name, parameters);

	nebula.mesh = nebula.createVisual();
	nebula.mesh.position.set(parameters.pos[0], parameters.pos[1], 0);

	return nebula;
}
