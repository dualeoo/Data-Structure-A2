exports.handler = function (snap, context, db) {

    //Delete Food Ranking
    var deleteRanking = db
        .collection('Food-Ranking')
        .where('fid', '==', snap.data().fid)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                var updateRanking = db
                    .collection('Food-Ranking')
                    .doc(doc.id)
                    .update({Deleted: true});
                console.log('Food ' + doc.data().fid + ' has deleted');
                console.log('Food-Ranking from ' + doc.data().uid + ' has Deleted')
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

    var result = [deleteRanking, changeNum];
    return result;
};