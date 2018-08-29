const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
db.settings({timestampInSnapshots: true});

//Import functions

const createFood = require('./CuongNguyen/createFood');
const deleteFood = require('./CuongNguyen/deleteFood');
const updateFood = require('./CuongNguyen/updateFood');

const createUser = require('./CuongNguyen/createUser');
const deleteUser = require('./CuongNguyen/deleteUser');
const updateUser = require('./CuongNguyen/updateUser');

//Functions
exports.createUser = functions.firestore
    .document('User/{id}')
    .onCreate((snap, context) => {
        return createUser.handler(snap, context, db);
    });

exports.deleteUser = functions.firestore
    .document('User/{id}')
    .onDelete((snap, context) => {
        /*        console.log("Before calling handler")
                const data = snap.data()
                if (data.name) {
                    console.log(data.name)
                }*/
        return deleteUser.handler(snap, context, db);
    });

exports.updateUser = functions.firestore
    .document('User/{id}')
    .onUpdate((change, context) => {
        if (
            change.after.data().Address === change.before.data().Address &&
            change.after.data().UserName === change.before.data().UserName &&
            change.after.data().Password === change.before.data().Password &&
            change.after.data().Slogan === change.before.data().Slogan &&
            change.after.data().Phone === change.before.data().Phone
        ) {
            return null;
        }
        return updateUser.handler(change, context, db);
    });

exports.createFood = functions.firestore
    .document('Food/{id}')
    .onCreate((snap, context) => {
        return createFood.handler(snap, context, db);
    });

exports.deleteFood = functions.firestore
    .document('Food/{id}')
    .onDelete((snap, context) => {
        return deleteFood.handler(snap, context, db)
    });

exports.updateFood = functions.firestore
    .document('Food/{id}')
    .onUpdate((change, context) => {
        if (
            change.after.data().Name === change.before.data().Name &&
            change.after.data().Price === change.before.data().Price &&
            change.after.data().Ranking === change.before.data().Ranking &&
            change.after.data().Likes === change.before.data().Likes
        ) {
            return null;
        }
        return updateFood.handler(change, context, db);
    });