
GAME.Ship = function(team, model, route){
	this.team = team, this.model = model, this.route = route, this.life = model.tech.life;
}

GAME.Ship.prototype.createVisual = function(){
    return GAME.Resources.getObj3D(this.model.tech.name);
}
GAME.Ship.prototype.updatePosition = function(dt){

}

function createShip(team, tech, route){
	var ship = new GAME.Ship(team, tech, route);
	ship.mesh = ship.createVisual();
	return ship;

    ship.mesh = ship.createVisual();
    return ship;
}
