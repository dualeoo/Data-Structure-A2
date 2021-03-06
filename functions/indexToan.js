const functions = require('firebase-functions');
var admin = require('firebase-admin');

var db = admin.firestore();

const restaurantRef = db.collection('restaurants');
const deletedReviewRestaurantRef = db.collection('deletedReviewRestaurants');
const chatRoomRef = db.collection('chatRooms');
const eventLog = db.collection('eventLogs');

const SENDGRID_API_KEY = functions.config().sendgrid.key;
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

exports.createReviewRestaurant = functions.firestore.document('reviewRestaurants/{reviewRestaurantID}').onCreate((snap, context) => {
    const newValue = snap.data();
    restaurant_ = restaurantRef.doc(newValue['restaurantId']).get().then(doc => {
        if (doc.exists) {
            res = doc.data();
            if (newValue['follow']) {
                res['followCount']++
            }
            if (newValue['like']) {
                res['likeCount']++
            }
            if (newValue['rating'] !== null) {
                res['rateCount']++;
                res['rateTotal'] += newValue['rating']
            }
            restaurantRef.doc(newValue['restaurantId']).set(res)


        }
        return null
    });
    return null
});

exports.updateReviewRestaurant = functions.firestore
    .document('reviewRestaurants/{reviewRestaurantID}')
    .onUpdate((change, context) => {

        const newValue = change.after.data();
        const previousValue = change.before.data();
        restaurant_ = restaurantRef.doc(newValue['restaurantId'])
            .get()
            .then(doc => {
                    if (doc.exists) {
                        res = doc.data();
                        if (previousValue['follow'] !== newValue['follow']) {
                            if (newValue['follow']) {
                                res['followCount']--
                            } else {
                                res['followCount']--
                            }
                        }
                        if (previousValue.like !== newValue.like) {
                            if (newValue.like) {
                                res['likeCount']++
                            } else {
                                res['likeCount']--
                            }
                        }
                        if (previousValue['rating'] === null) {
                            if (newValue['rating'] !== null) {
                                res['rateTotal'] = res['rateTotal'] + newValue['rating'];
                                res['rateCount']++
                            }
                        } else {
                            if (previousValue['rating'] !== newValue['rating']) {
                                res['rateTotal'] = res['rateTotal'] + newValue.rating - previousValue.rating
                            }
                        }
                        restaurantRef.doc(newValue['restaurantId']).set(res)
                    }

                    return null;
                }
            );

        return change.after.ref.set({}, {merge: true});

    });

exports.deleteReviewRestaurant = functions.firestore
    .document('reviewRestaurants/{reviewRestaurantID}')
    .onDelete((snap, context) => {
        const deletedData = snap.data();
        restaurant_ = restaurantRef.doc(deletedData['restaurantId'])
            .get()
            .then(doc => {

                if (doc.exists) {
                    res = doc.data();
                    if (deletedData['rating'] !== null) {
                        res['rateTotal'] -= deletedData['rating'];
                        res['rateCount']--
                    }
                    if (deletedData['like']) {
                        res['likeCount']--
                    }
                    if (deletedData['follow']) {
                        res['followCount']--
                    }
                    restaurantRef.doc(deletedData['restaurantId']).set(res);
                    deletedReviewRestaurantRef.doc(context.params.reviewRestaurantID).set(deletedData)
                }
                return null
            });
        return null
    });

exports.createChatRoom = functions.firestore
    .document('chatRooms/{chatRoomId}')
    .onCreate((snap, context) => {
        data = snap.data();

        const msg = {
            to: [data['u1_email'], data['u2_email']],
            from: 'foodbook_chat@foodbook.com',
            subject: 'New Chatroom',
            templateId: 'd-c2af1a49d39941be9cfe10ea30f98b6c',
            substitutionWrappers: ['{{', '}}'],
            substitutions: {
                action: 'joined'
            }
        };

        return sgMail.send(msg)

    });

exports.deleteChatRoom = functions.firestore
    .document('chatRooms/{chatRoomId}')
    .onDelete((snap, context) => {
        data = snap.data();

        const msg = {
            to: [data['u1_email'], data['u2_email']],
            from: 'foodbook_chat@foodbook.com',
            subject: 'Exited Chatroom',
            templateId: 'd-c2af1a49d39941be9cfe10ea30f98b6c',
            substitutionWrappers: ['{{', '}}'],
            substitutions: {
                action: 'exited'
            }
        };

        return sgMail.send(msg)
    });

exports.updateChatRoom = functions.firestore
    .document('chatRooms/{chatRoomId}/mostRecentMessages/{messageID}')
    .onCreate((snapshot, context) => {
        data = snapshot.data();

        chatRoom_ = chatRoomRef.doc(context.params.chatRoomId)
            .get()
            .then(doc => {
                res = doc.data();
                const msg = {
                    to: [res['u1_email'], res['u2_email']],
                    from: 'foodbook_chat@foodbook.com',
                    subject: 'New Message',
                    templateId: 'd-c2af1a49d39941be9cfe10ea30f98b6c',
                    substitutionWrappers: ['{{', '}}'],
                    substitutions: {
                        action: 'exited'
                    }
                };

                return sgMail.send(msg)
            });

        return null
    });