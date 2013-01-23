GAME.Resources = function(){
    var resources = {},
        waiting = {},
        loader = new THREE.SceneLoader(),
        callbacks = [];
        return{
        loadObj3D: function(name, url){
            loader.load(staticurl+"/"+url, function(scene){
                //resources[name] = scene;
                var obj3D = new THREE.Object3D();
                $.each(scene.scene.children, function(i,v){
                    obj3D.add(v);
                });
                resources[name] = obj3D;

                waiting[name] = false;
                var count = 0;
                $.each(waiting, function(i,v){
                    count ++;
                    return !v;
                });
                if(count >= Object.keys(waiting).length)
                    $.each(callbacks, function(i,v){
                        v();
                    });
            });
            waiting[name] = true;
        }, getObj3D: function(name){
            if (resources[name]){
                var r = resources[name], obj3D = new THREE.Object3D();
                $.each(r.children, function(i,v){
                    var o = v.clone();
                    o.material = v.material.clone();
                    obj3D.add(o);
                });
                return obj3D;
            }
            else return false;
        }, addReady: function(callback){
            callbacks.push(callback);
        }
    }
}();
