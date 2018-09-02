exports.handler = function (snap, context, db) {

    // Count all users

    var Users = 0;

    var createUser = db
        .collection('User')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                Users += 1;
            });
            console.log('Number of users is:' + Users);
            return 0;
        });

    // Create a list of changes made

    var numOfChanges = 0;
    var changeNum = db
        .collection('ChangeList')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                numOfChanges += 1;
            });
            db.collection('ChangeList')
                .doc('Change number' + numOfChanges)
                .set(snap.data());
            return 0;
        });

    return [createUser, changeNum];
};

