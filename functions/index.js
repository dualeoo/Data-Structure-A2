const admin = require("firebase-admin");
const functions = require("firebase-functions")


admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

const changesRef = db.collection('changes');

exports.helloWorld = functions.https.onRequest((request, response) => {
    response.send("Hello from Firebase!");
});

exports.filterVulgarity = functions.firestore
    .document('messages/{messageId}')
    .onCreate((snap, context) => {
        const newValue = snap.data();

        // access a particular field as you would any JS property
        const contentBeforeFilter = newValue.content;
        const position = contentBeforeFilter.search(/fuck/gi);
        if (position === -1) {
            console.log("No vulgarity in message!");
            return 0;
        }
        console.log(`Content before filter: ${contentBeforeFilter}`);
        const contentAfterFilter = contentBeforeFilter.replace(/fuck/gi, "");
        console.log(`Content after filter: ${contentAfterFilter}`);

        changesRef.add(newValue)

        return snap.ref.update({content: contentAfterFilter});

    });

exports.addToMostRecentMessage = functions.firestore
    .document('messages/{messageId}')
    .onCreate((snap, context) => {
        // const newValue = snap.ref.firestore;
        let newMessage = snap.data();
        console.log(`The new message = ${newMessage}`);
        const chatRoomRef = newMessage.chatRoom;
        console.log(`The reference to chat room = ${chatRoomRef.id}`);
        const mostRecentMessagesRef = chatRoomRef.collection("mostRecentMessages");
        console.log(`The mostRecentMessages collection Ref = ${mostRecentMessagesRef.id}`);
        let snapshotId = snap.id;
        console.log(`The snapshot ID = ${snapshotId}`);

        changesRef.add(newMessage)

        return mostRecentMessagesRef.doc(snapshotId).set(newMessage).then((result) => {
            console.log(`Successfully add to mostRecentMessages at ${result.writeTime}`);
            return 0;
        });
        // return mostRecentMessagesRef.add(newMessage)
    });

exports.keepOldMessage = functions.firestore
    .document('messages/{messageId}')
    .onUpdate((change, context) => {
        let newDocumentSnapshot = change.after;
        let newDocumentReference = newDocumentSnapshot.ref;
        console.log(`Path to Doc Ref = ${newDocumentReference.path}`);
        const newValue = newDocumentSnapshot.data();
        const previousValue = change.before.data();

        let oldContent = previousValue.content;
        let newContent = newValue.content;

        if (newContent !== oldContent) {
            console.log(`Old content = ${oldContent}`);
            // let messagesRef = firestore.collection("messages");
            // let oldMessage = Object.assign({}, previousValue, {newMessage: newDocumentReference});
            console.log(`New content = ${newContent}`);
            
            changesRef.add(newContent)
            
            return newDocumentReference.collection("previousVersions")
                .add({content: oldContent, time: previousValue.time})
                .then(result => {
                    console.log(`Path to backup message = ${documentReference.path}`);
                    return 0;
                });
        }
        return 0;
    });

exports.keepDeletedMessage = functions.firestore
    .document('messages/{messageId}')
    .onDelete((snap, context) => {
        let firestore = snap.ref.firestore;
        let oldMessage = snap.data();
        let docRef = firestore.collection("deletedMessages").doc(snap.id);
        
        changesRef.add(oldMessage)
        
        return docRef.set(oldMessage).then(result => {
            console.log(`Successfully backup the message at ${result.writeTime.toDate().toLocaleString()}`);
            return 0;
        });
    });

exports.onPostContainerCreate = functions.firestore
    .document('postContainers/{postContainerId}')
    .onCreate(async (snap, context) => {
        console.log(`The postContainer recently created =  ${snap.id}`);
        let postContainer = snap.data();
        
        changesRef.add(postContainer)
        
        let postContainerOwnerRef = postContainer.userId;
        let postContainerOwnerId = postContainerOwnerRef.id;
        console.log(`The postContainer ownerID =  ${postContainerOwnerId}`);
        let postContainerOwnerSnap = await postContainerOwnerRef.get();
        if (!postContainerOwnerSnap.exists) {
            console.log(`There is no user with ID = ${postContainerOwnerId}`);
            return 0;
        }
        let postContainerOwner = postContainerOwnerSnap.data();
        let followersQuerySnap = await postContainerOwnerRef.collection("followers").get();
        if (followersQuerySnap.empty) {
            console.log(`The post owner (${postContainerOwnerId}) has no followers. So no notification`);
            return 0;
        }
        let followerNo = 1;
        followersQuerySnap.forEach(async snap => {
            let follower = snap.data();
            console.log(`follower#${followerNo++} of ${postContainerOwnerId} =  ${snap.id}`);
            let followerRef = follower.user;
            let tokenQuerySnapshot = await followerRef.collection("notificationTokens").get();
            if (tokenQuerySnapshot.empty) {
                console.log(`The following follower (${followerRef.id}) has no notification tokens. So no notification`);
                return 0;
            }
            let tokens = [];
            let tokenNo = 1;
            tokenQuerySnapshot.forEach(snap => {
                let notificationToken = snap.data();
                let token = Object.keys(notificationToken)[0];
                console.log(`Token${tokenNo++} = ${token}`);
                tokens.push(token);
            });
            const payload = {
                notification: {
                    title: `${postContainerOwner.firstName} recently made a new post`,
                    body: `${postContainer.content}`,
                    icon: "https://scontent.fsgn3-1.fna.fbcdn.net/v/t1.0-1/p240x240/34117274_10155663043522914_4610195604646133760_n.jpg?_nc_cat=0&oh=59375a3da37c071552e8037020145e98&oe=5C0643F4"
                }
            };
            const response = await admin.messaging().sendToDevice(tokens, payload);
            console.log(`Number of failure messages = ${response.failureCount}`);
            console.log(`Number of success messages = ${response.successCount}`);
            return 0;
        });
        return 0;
    });

exports.onPostContainerLiked = functions.firestore
    .document('postContainers/{postContainerId}/likedBy/{userId}')
    .onCreate(async (snap, context) => {
        let userLike = snap.data();
        
        changesRef.add(userLike)

        let postContainerId = context.params.postContainerId;
        console.log(`User ${context.params.userId} liked postContainer ${postContainerId}`);

        let firestore = snap.ref.firestore;
        let postContainerRef = firestore.doc(`postContainers/${postContainerId}`);
        let postContainerSnap = await postContainerRef.get();
        let postContainer = postContainerSnap.data();

        let postContainerOwnerRef = postContainer.userId;
        console.log(`PostContainerOwner =  ${postContainerOwnerRef.id}`);
        let tokenQuerySnapshot = await postContainerOwnerRef.collection("notificationTokens").get();
        if (tokenQuerySnapshot.empty) {
            console.log(`The following user (${postContainer.userId}) has no notification tokens. So no notification`);
            return 0;
        }

        let tokens = [];
        let tokenNo = 1;
        tokenQuerySnapshot.forEach(snap => {
            let notificationToken = snap.data();
            let token = Object.keys(notificationToken)[0];
            console.log(`Token${tokenNo++} = ${token}`);
            tokens.push(token);
        });
        const payload = {
            notification: {
                title: `${userLike.firstName} recently like your message`,
                body: `Your original message: ${postContainer.content}`,
                icon: "https://scontent.fsgn3-1.fna.fbcdn.net/v/t1.0-1/p240x240/34117274_10155663043522914_4610195604646133760_n.jpg?_nc_cat=0&oh=59375a3da37c071552e8037020145e98&oe=5C0643F4"
            }
        };
        const response = await admin.messaging().sendToDevice(tokens, payload);
        console.log(`Number of failure messages = ${response.failureCount}`);
        console.log(`Number of success messages = ${response.successCount}`);
        return 0;
    });

exports.onPostcontainerDeleted = functions.firestore
    .document('postContainers/{postContainerId}')
    .onDelete((snap, context) => {
        let firestore = snap.ref.firestore;
        let oldPostContainer = snap.data();
        
        changesRef.add(oldPostContainer)
        
        let docRef = firestore.collection("deletedPostContainer").doc(snap.id);
        return docRef.set(oldPostContainer).then(result => {
            console.log(`Successfully backup the postContainer at ${result.writeTime.toDate().toLocaleString()}`);
            return 0;
        });
    });

// exports.toan = require("../indexToan.js");