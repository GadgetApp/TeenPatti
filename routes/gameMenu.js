var express = require('express');
var router = express.Router();
var DAL = require('../lib/dal');



/* GET Menu. */
router.get('/', function(req, res) {
	console.log(req.body)
    res.render('gameMenu', {
    });

});
router.get('/page', function(req, res) {
	console.log(req.body)
    //uploadFile()
    res.render('gameMenu.ajax.jade', {
    });

});

router.post('/get', function(req, res) {
    var gameTables;
    if (req.body.gameType) {
        DAL.db.game_tables.find({
            game_code: req.body.gameType
        }).sort({boot_amount: 1}).toArray(function(err, gameTables) {
           // console.log("error response:" + JSON.stringify(gameTables));
            if (!gameTables || gameTables.length === 0) {
                res.json({
                    status: 'failed'
                });
            } else {
                //user = users[0];
            }
            res.json({
                'status': 'success',
                data: gameTables
            });
        });
    } else {
        res.json({
            status: 'failed'
        });
    }
});

module.exports = router;