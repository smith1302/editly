'use strict';
module.exports = function(app) {
    var render = require('~/api/controllers/renderController.js');
    
    app.get('/', function(req, res){
        res.json();
    });
    app.route('/render').get(render.createGIF);
    
};