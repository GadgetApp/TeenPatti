var config = require('./../config');
var databaseUrl;
// var config = JSON.parse(process.env.APP_CONFIG);
if (config.database.mode==='local'){
	databaseUrl ="local"; 
} else {
	//databaseUrl = "mongodb://" + config.database.username + ":"+  config.database.password +"@" + config.database.host + ":" + config.database.port + "/" + config.database.dbname;
	databaseUrl = "mongodb+srv://" + config.database.username + ":"+  config.database.password +"@" + config.database.host  + "/" + config.database.dbname;
	//databaseUrl = "mongodb://" + config.database.username + ":"+  config.database.password +"@" + config.database.host  + "/" + config.database.dbname;
}
var collections = ["tables","sessions","game_details","game_tables","game_rounds","bet_details","transactions","game_users"];
var db = require("mongojs")(databaseUrl, collections);



var DAL={db:db};


module.exports = DAL;