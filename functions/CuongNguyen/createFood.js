exports.handler = function (snap, context, db) {

    // Find User who created the food

    var createdUser = db
        .collection('Create-Food')
        .where('fid', '==', snap.data().fid)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                console.log('User ' + doc.data().uid + ' created food ' + doc.data().fid)
            });
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
            var changeUpdate = db
                .collection('ChangeList')
                .doc('Change number' + numOfChanges)
                .set(snap.data());
            return 0;
        });

    var result = [createdUser, changeNum];
    return result;

};