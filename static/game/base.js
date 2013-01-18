GAME.Team = function(teamName, parameters){
	this.teamName = teamName;
	this.color = parseInt(parameters.color,16);
	this.tech = {};
	this.bases = [];

	var tech = this.tech;
	$.each(GAME.TECH.all(), function(i,v) {
		tech[i] = {tech:(v[0]), toNext:0};
	});

}

GAME.Team.prototype.createBase = function(parameters){
	var Base = function(team, parameters){
		this.team = team;
		this.releases = {};
		this.model = GAME.TECH.getLevel("mothership", 0);

		var releases = this.releases;
		$.each(this.team.tech, function(i,v) {
			releases[i] = {tech:v, toNext:0}
		});
	};

	Base.prototype.createVisual = function(){
	    return GAME.Resources.getObj3D(this.model.name);
    }

	Base.prototype.updateReleases = function(dt){
		var list = [], tech = this.team.tech, base = this;
		$.each(this.releases, function(i,v){
			v.toNext += dt;
			if(tech[i].tech.time <= v.toNext && tech[i].tech.time > 0){
				list.push({ship:v.tech, base:base});
				v.toNext = 0;
			}
		});
		return list;
	}


	var b = new Base(this, parameters);
	this.bases.push(b);
	return b;
}

GAME.Team.prototype.iterateBases = function(f){
	var list = []
	$.each(this.bases, function(i,v) {
		list = list.concat(f(v));
	});
	return list;
}

GAME.Team.prototype.updateTech = function(dt){
	$.each(this.tech, function(i,v){
		v.toNext += dt;
		if(v.toNext >= GAME.TECH.getLevel(i, v.tech.level+1).points){
			v = {tech:GAME.TECH.getLevel(i, v.tech.level+1), toNext:0};
			releases[i] = {tech:GAME.TECH.getLevel(i+1, v.tech.level), toNext:releases[i].time}
		}
	});
}

function createTeam(teamName, parameters, scene){
	var team = new GAME.Team(teamName, parameters);

	team.base = team.createBase({})
    team.base.mesh = team.base.createVisual();
    team.base.mesh.position.set(parameters.pos[0], parameters.pos[1], 0);

	return team;
}

