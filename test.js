var EVEoj = require("EVEoj"),
    SDD = EVEoj.SDD.Create("json", {
        path: "\SDD_YC118_5_201605310"
    }),
    map;

SDD.LoadMeta()
.then(function() {
    map = EVEoj.map.Create(SDD, "K");
    return map.Load();
})
.then(function() {
    var jita = map.GetSystem({name: "Jita"});
    var amarr = map.GetSystem({name: "Amarr"});
    var route = map.Route(jita.ID, amarr.ID, [], false, false);
    console.log("Jita to Amarr route length: " + route.length);
})
.caught(function(err) {
    console.error(err);
});
