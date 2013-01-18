
GAME.Ship = function(team, model, route){
	this.team = team, this.model = model, this.route = route, this.life = model.tech.life;
}

GAME.Ship.prototype.createVisual = function(){
<<<<<<< HEAD
	switch(this.model.tech.model){
	case 'cylinder':
		return new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,10,10,false), new THREE.MeshPhongMaterial({color:this.team.color}))
	case 'triangle':
		return new THREE.Mesh(new THREE.CubeGeometry(1,1,1), new THREE.MeshPhongMaterial({color:this.team.color}))
	default: return;
	}
}


=======
    return GAME.Resources.getObj3D(this.model.tech.name);
}
>>>>>>> 052a85b... Load models for graphics
GAME.Ship.prototype.updatePosition = function(dt){

}

function createShip(team, tech, route){
	var ship = new GAME.Ship(team, tech, route);
<<<<<<< HEAD
	ship.mesh = ship.createVisual();
	return ship;
=======

    ship.mesh = ship.createVisual();
    return ship;
>>>>>>> 052a85b... Load models for graphics
}
