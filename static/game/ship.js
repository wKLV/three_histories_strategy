
GAME.Ship = function(team, model, route){
	this.team = team, this.model = model, this.route = route;
}

GAME.Ship.prototype.createVisual = function(){
	return new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,10,10,false), new THREE.MeshPhongMaterial({color:this.team.color}))
}

GAME.Ship.prototype.updatePosition = function(dt){
	
}

function createShip(team, tech, route){
	var ship = new GAME.Ship(team, tech, route);
	ship.mesh = ship.createVisual();
	return ship;
}