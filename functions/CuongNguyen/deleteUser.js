exports.handler = function (snap, context, db) {

    // Count how many user left
    var newnum = 0;

    var Usernum = db
        .collection('User')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                newnum++;
            });
            console.log('Total number of user after deleted: ' + newnum);
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

    return [Usernum, changeNum];
};
