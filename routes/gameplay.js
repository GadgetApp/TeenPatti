var express = require('express');
// var table = require('../lib/tabledecks');
var router = express.Router();

const fs = require('fs');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: 'AKIAXTVMHV2VO4UNUH57',
  secretAccessKey: '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' 
});

const fileName = './public/deckheros/images/background.jpg'

const uploadFile = () => {
    fs.readFile(fileName, (err, data) => {
       if (err) throw err;
       const params = {
           Bucket: 'realgames', // pass your bucket name
           Key: 'background_new.jpg', // file will be saved as testBucket/contacts.csv
           ACL: 'public-read',
           Body: data
       };
       s3.upload(params, function(s3Err, data) {
           if (s3Err) throw s3Err
           console.log(`File uploaded successfully at ${data.Location}`)
       });
    });
  };
  router.post('/uploadImg', function(req, res) {
    console.log('Uploading',JSON.stringify(req))
  })
/* GET home page. */
router.get('/page', function(req, res) {
  res.render('gameplay.ajax.jade', { title: 'Welcome',pagename:'gameplay' });
});

module.exports = router;
