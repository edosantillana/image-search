var express = require("express");

module.exports = function(app, dirname) {

    app.route('/')
        .get(function(req, res) {
            res.sendFile(dirname + '/public/index.html');
        });
};
