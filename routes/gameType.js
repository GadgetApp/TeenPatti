var express = require('express');
var router = express.Router();
var DAL = require('../lib/dal');

/* GET Menu. */
router.get('/', function(req, res) {
	//console.log(req.body)
    
    res.render('gameType', {
    });

});
router.get('/page', function(req, res) {
	console.log(req.body)

    res.render('gameType.ajax.jade', {
    });

});

router.post('/get', function(req,res) {
    var gametypes;
    
        DAL.db.game_details.find({}).sort({game_code: 1}).toArray(function(err, gametypes) {
            
            if (!gametypes || gametypes.length === 0) {
                res.json({
                    status: 'failed'
                });
            } else {
               
            }
            res.json({
                'status': 'success',
                data: gametypes
            });
        });
   
});

module.exports = router;