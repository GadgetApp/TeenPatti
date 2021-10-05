var jwt_decode = require('jwt-decode'); 
var express = require('express');
var jwt = require('jsonwebtoken');
var assert = require('assert');
var https = require('https');
var DAL = require('../lib/dal');

var router = express.Router();

/* GET test . */
router.get('/token', function(req, res) {
    var newtoken = jwt.sign({ foo: 'bar' }, 'shhhhh');
    console.log(req.session);
    /*  var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    var decoded = jwt_decode(token);
    console.log(decoded);
    // decode header by passing in options (useful for when you need `kid` to verify a JWT):
    var decodedHeader = jwt_decode(token, { header: true });
    console.log(decodedHeader);*/
    res.send(newtoken);
});

router.post('/', function(req, res) {
    res.contentType('application/json');
    var validResponse = "{'isSuccess':true,'data' : {'url' :'" + req.get('host') + "'}}";
    var invalidResponse = "{'isSuccess' : false ,'exception': {'code' : 'USER_ACCOUNT_BLOCKED' ,'message' : 'User account is blocked' }}";
    var session = req.session;
    // creating 24 hours from milliseconds
    
    var token = req.header('authorization');
    if(token.length >0){
       token =  token.replace('Bearer ',''); 

       try {
            var decoded = jwt.verify(token, 'DEVREALGAMES');
            //console.log(decoded) ;// bar
            var username = decoded.aud + ":" + decoded.sub;
            var options = {
                hostname : 'api.deckheros.com',
                port: 443,
                path : '/user/balance',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-OP-KEY' : decoded.iss,
                    'Authorization' : token
                  },
                method: 'GET'
              };
            const reqBalance = https.request(options, resHttp => {
                let data = [];
                //console.log(`statusCode: ${res.statusCode}`);
                if(resHttp.statusCode == 200){
                    resHttp.on('data', d => {
                        data.push(d);
                      });
                      resHttp.on('end', () => {
                        //console.log('Response ended: ');
                        const usersBalanceData = JSON.parse(Buffer.concat(data).toString());
                        console.log("data :" + JSON.stringify(usersBalanceData) );
                        if(usersBalanceData.isActive == true && usersBalanceData.betLock == false){
                            console.log("user is good to play");
                            //set session data - do not require right now
                            //session.user_name = username;
                            //console.log(req.session);

                            var userBalance = usersBalanceData.availableBalance + usersBalanceData.upLineBalance + usersBalanceData.exposure;
                            var user;
                            DAL.db.game_users.find({
                                user_name : username
                            }).toArray(function(err, game_users) {
                    
                                if (!game_users || game_users.length === 0) {
                                    user = {
                                        user_name : username,
                                        balance: userBalance,
                                        operator_id: usersBalanceData.operatorId,
                                        operator_token : token,
                                        game_session : session
                                    };
                                    DAL.db.game_users.insert(user);
                    
                                } else {
                                    //get user from table
                                    DAL.db.game_users.update({
                                        user_name : username
                                    }, {
                                        $set: {
                                            balance: userBalance,
                                            game_session : session
                                        }
                                    }, function(err, result) {
                                      //  console.log('user update result: ' + result);
                                    });
                                    //user = game_users[0];
                                    //console.log(user);
                                }
                                
                            });
                          
                            res.send(validResponse);    
                        }else{
                            res.send(invalidResponse);   
                        }
                      });
                }else{
                    res.send(invalidResponse);  
                }
              })
              reqBalance.end()
           
        } catch(err) {
            console.log(err) ;
            res.send(invalidResponse);  
        }
    }else{
        res.send(invalidResponse);  
    }
});

module.exports = router;