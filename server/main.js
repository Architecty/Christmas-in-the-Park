import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {

    Jobs.startJobServer();
    Jobs.allow({
        worker: function (userId, method, params) {
            var workerUser = Meteor.users.findOne({_id: userId});
            if (_.has(workerUser.permissions, 'worker')) {
                if (workerUser.permissions.worker === true) {
                    return true;
                }
            }
            return false;
        }
    });
    Meteor.methods({
        addCommand(pattern, color){
            let actions = [];


            const siteJob = new Job(Jobs, 'commandTree', {actions: actions})
                .retry({retries:5, wait: 15*1000})
                .save();

            console.log(siteJob);
            return siteJob;
        }
    })
});

Meteor.publish('jobs', function(job_id){
    var thisJob = Jobs.findOne({_id: job_id});
    if(thisJob){
        return Jobs.find({status: {$in: ['ready', 'running']}, created: {$lte: thisJob.created}}, {fields: {_id: 1, "status":1}});
    }
    this.ready();
})