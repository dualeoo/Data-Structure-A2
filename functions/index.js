const functions = require('firebase-functions');
var admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.cuong = require("./indexCuong");
exports.toan = require("./indexToan");
exports.minh = require("./indexMinh");