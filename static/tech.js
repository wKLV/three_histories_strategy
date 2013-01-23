{
"mothership":{
        "speed":[0,0,0],
        "weaponry":[{"damage":10, "frequency":5},
                    {"damage":15, "frequency":5},
                    {"damage":20, "frequency":10}
                     ],
        "weapontype": {"area":"cone", "distance":10},
        "shield":[10,15,20],
        "life":[1000,1000,1000],
        "time": 0,
        "model":"cube",
        "tactic": "nofollow"
},
"hummer":{
    "speed":[7,12,16],
    "weaponry":[{"damage":2, "frequency":7},
                {"damage":4, "frequency":7},
                {"damage":8, "frequency":7}
               ],
    "weapontype": {"area":"sphere", "distance":10},
    "shield":[2,3,4],
    "life":[50,75,150],
    "time": 3,
    "model": "thorusknot",
    "tactic": "hummer"
},
"eagle":{
    "speed":[3,5,7],
    "weaponry":[{"damage":5, "frequency":3},
                {"damage":7, "frequency":4},
                {"damage":10, "frequency":20}
               ],
    "weapontype": {"area":"single", "distance":20},
    "shield":[5,6,7],
    "life":[200,300,500],
    "time": 15 ,
    "model": "cylinder",
    "tactic": "onetoone"
}
}
