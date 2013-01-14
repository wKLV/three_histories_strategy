GAME = {};

GAME.TECH = function(){
	techs = {};
	
	return {
		get: function(name){
			return techs[name];
		}, getLevel: function(name, level){
			return techs[name][level];
		}, add: function(tech){
			if(!techs[tech.name]) techs[tech.name] = [];
			techs[tech.name].push(tech);
		}, all: function(){
			return techs;
		}
	}
}();