exports.handler = function (change, context, db) {

    var today = new Date();

    // Update the updated_time field
    var updatedTime = db
        .collection('User')
        .doc(change.after.id)
        .update({Time_Update: today});
    console.log('User ' + change.after.id + ' has been updated');

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

    var result = [updatedTime, changeNum];
    return result;

};
