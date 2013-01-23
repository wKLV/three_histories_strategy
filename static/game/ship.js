
GAME.Ship = function(id, team, model, route){
    this.team = team, this.model = model, this.route = route, this.life = model.tech.life, this.id = id;
    this.AI = createAI(model.tech, this), this.mesh;
}

function createAI(tech, thish){
    var chase = false, check, attacking;
    switch(tech.tactic){
    case "hummer":
        chase = true;
        break;
    case "onetotone":
        chase = true;
        break;
    }
    function checkDistance(sh1, sh2, d){
        return sh1.mesh.position.distanceTo(sh2.mesh.position) < d
    }
    switch(tech.weapontype.area){
    case "single":
        attacking = {distance:-1}
        check = function(ship){
            if(ship.team !== thish.team && (checkDistance(ship, thish, attacking.distance) || attacking.distance === -1))
                attacking = {distance: ship.mesh.position.distanceTo(thish.mesh.position), ship:ship}
        }
        break;
    case "sphere":
        attacking = {};
        check = function(ship){
            if(checkDistance(ship, thish, tech.weapontype.distance))
                attacking[ship.id] = ship;
        }
        break;
    case "cone":
        // TODO
    }
    return{
        updateAttackShip: function(ship){
            check(ship);
        },
        returnResult: function(){
            switch(tech.weapontype.area){
                case "single":
                    if(attacking.ship && attacking.distance < tech.weapontype.distance) attacking = [attacking.ship];
                    else attacking = [];
                    break;
                case "sphere":
                    var all = true;
                    $.each(attacking, function(i,v){
                        if(v.team !== thish.team){
                            all = false;
                            return false
                        }
                    });
                    if (all) attacking = [];
                    break;
            }
                return attacking;
        },
        reset: function(){
            switch(tech.weapontype.area){
            case "single": attacking = {distance: -1}; break;
            case "sphere": attacking = {};
            }
        }
    }
}

GAME.Ship.prototype.createVisual = function(){
    var g = GAME.Resources.getObj3D(this.model.tech.name);
    g.children[0].material.color = new THREE.Color(this.team.color);
    return g;
}
GAME.Ship.prototype.updateTecheAttack = function(ship, distance){

}

function createShip(id, team, tech, route){
    var ship = new GAME.Ship(id, team, tech, route);
    ship.mesh = ship.createVisual();
    return ship;

    ship.mesh = ship.createVisual();
    return ship;
}
