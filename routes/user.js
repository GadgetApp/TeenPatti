var express = require('express');
var router = express.Router();
var utils = require('../lib/base/utils');
var DAL = require('../lib/dal');
var https = require('https');
var jwt = require('jsonwebtoken');
/* GET users listing. */
router.get('/', function(req, res) {
    res.send('respond with a resource');
});
router.post('/register', function(req, res) {
    var user;
    if (req.body.userName) {
        var username ='PDE:' +  req.body.userName;
        DAL.db.game_users.find({
            user_name: username
        }).toArray(function(err, game_users) {
            
            if (!game_users || game_users.length === 0) {
                res.json({
                    status: 'failed'
                });

            } else {
                var session = req.session;
                session.user_name = game_users[0].user_name;
                user = {
                    displayName: game_users[0].user_name,
                    userName: game_users[0].user_name,
                    guid: utils.guid(),
                    chips: game_users[0].balance,
                    isActive : game_users[0].isActive,
                    betLock : game_users[0].betLock
                };
                console.log("check status of game user: " + JSON.stringify(user));
                res.json({
                    'status': 'success',
                    data: user
                });
            }
        });
    } else {
        res.json({
            status: 'failed'
        });
    }


});

router.post('/getUserFromSession', function(req, res) {
    var user;
    try {
        if (req.body.userToken) {
            var options = {
                'method': 'GET',
                'hostname': 'api.deckheros.com',
                'path': '/SSO/' + req.body.userToken,
                'headers': {
                  'Content-Type': 'application/json'
                },
                'maxRedirects': 20
              };
              const reqSSO = https.request(options, resHttp => {
                let data = [];
                console.log(`statusCode: ${res.statusCode}`);
                if(resHttp.statusCode == 200){
                    resHttp.on('data', d => {
                        data.push(d);
                      });
                      resHttp.on('end', () => {
                       
                        const userSSOData = JSON.parse(Buffer.concat(data).toString());
                        console.log("data :" + JSON.stringify(userSSOData) );
                        var decoded = jwt.verify(userSSOData.token, 'DEVREALGAMES');
                        var username = decoded.aud + ":" + decoded.sub;
                        console.log(decoded) ;
                        DAL.db.game_users.find({
                            user_name: username
                        }).toArray(function(err, game_users) {
                            if (!game_users || game_users.length === 0) {
                                res.json({
                                    status: 'failed'
                                });
                
                            } else {
                                var session = req.session;
                                session.user_name = game_users[0].user_name;
                                user = {
                                    displayName: game_users[0].user_name,
                                    userName: game_users[0].user_name,
                                    guid: utils.guid(),
                                    chips: game_users[0].balance
                                };
                                res.json({
                                    'status': 'success',
                                    data: user
                                });
                            }
                        });
                      });
                }else{
                   
                }
              })
              reqSSO.end()
              
        }else{
            res.json({
                status: 'failed'
            });
        }
       
    }catch(err) {
            console.log(err) ;
           
    }
});

router.post('/get', function(req, res) {
    var user;
    if (req.body.userName) {
        DAL.db.users.find({
            userName: req.body.userName
        }).toArray(function(err, users) {
            if (!users || users.length === 0) {
                res.json({
                    status: 'failed'
                });
            } else {
                user = users[0];
            }
            res.json({
                'status': 'success',
                data: user
            });
        });
    } else {
        res.json({
            status: 'failed'
        });
    }
});


router.post('/getTableUserCount', function(req, res) {
    var count = 0
    for (let item of global.userSocketIdMap.values()) {
        if(item.betamt == req.body.betamt && item.gametype == req.body.gameType)
            count++;
    }

    res.json({
        count: count
    });
});

module.exports = router;