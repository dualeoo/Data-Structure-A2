exports.handler = function (change, context, db) {

    var today = new Date();
    // Show the Users who liked the food
    var UserLiked = db.collection('Food-Like')
        .where('fid', '==', change.after.data().fid).get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                console.log('User ' + doc.data().uid + ' liked the food');
            });
            return 0;
        });

    // Update the updated_time field
    var updatedTime = db
        .collection('Food')
        .doc(change.after.id)
        .update({Time_Update: today});
    console.log('Food ' + change.after.id + ' has been updated');

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
                .set(change.after.data());
            return 0;
        });

    var result = [UserLiked, changeNum, updatedTime];
    return result;
};