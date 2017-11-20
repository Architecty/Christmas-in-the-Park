import { Meteor } from 'meteor/meteor';


SyncedCron.add({
    name: 'Create a random job if nothing is running',
    schedule: function(parser) {
        // parser is a later.parse object
        return parser.text('every 2 minutes');
    },
    job: function() {
        if(!Jobs.findOne({status: {$in: ['ready', 'running']}, 'data.repeat': {$gt: -1}})){

            function getRandomInt(min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
            }

            const patterns = ["Rotate", "Fade", "Blink", "Solid", "MultiFade", "MultiJump"];
            const colors = ['RED', 'GREEN', 'BLUE'];

            Meteor.call('addCommand', patterns[getRandomInt(0, patterns.length)], colors[getRandomInt(0, colors.length)])
        }
    }
});
if(Meteor.isServer){
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

        //TEMPORARY TESTING CODE
        Job.processJobs('jobs', 'commandTree', {concurrency:1, workTimeout: 240 * 1000}, function(job, cb) {
                Meteor.setTimeout(function(){job.done(); cb();}, 5000);
        });

        Meteor.methods({
            addCommand(pattern, color){
                let actions = [createAction('ALL', 'ON', 250)];
                let repeat = -1;
                switch(pattern){
                    case "Rotate":
                        for(let i = 0; i < 6; i++){
                            actions.push(createAction([i], color, 500));
                        }
                        for(let i = 5; i >= 0; i--){
                            actions.push(createAction([i], 'OFF', 250));
                        }
                        for(let i = 5; i >= 0; i--){
                            actions.push(createAction([i], 'ON', 250));
                        }
                        break;
                    case "Fade":
                        for(let i = 0; i < 9; i++){
                            actions.push(createAction('ALL', 'FADE_OUT', 250));
                        }
                        for(let i = 0; i < 9; i++){
                            actions.push(createAction('ALL', 'FADE_IN', 250));
                        }
                        repeat = 2;
                        break;
                    case "Blink":
                        actions.push(createAction('ALL', color, 1000));
                        actions.push(createAction('ALL', 'OFF', 1000));
                        actions.push(createAction('ALL', 'ON', 1000));
                        actions.push(createAction('ALL', 'OFF', 1000));
                        actions.push(createAction('ALL', 'ON', 1000));
                        actions.push(createAction('ALL', 'OFF', 500));
                        actions.push(createAction('ALL', 'ON', 500));
                        actions.push(createAction('ALL', 'OFF', 500));
                        actions.push(createAction('ALL', 'ON', 500));
                        actions.push(createAction([0,2,4], 'OFF', 500));
                        actions.push(createAction([0,2,4], 'ON', 500));
                        actions.push(createAction([1,3,5], 'OFF', 500));
                        actions.push(createAction([1,3,5], 'ON', 500));
                        actions.push(createAction('ALL', 'OFF', 1000));
                        actions.push(createAction('ALL', 'ON', 1000));
                        break;
                    case "Solid":
                        actions.push(createAction('ALL', color, 5000));
                        repeat = 0;
                        break;
                    case "MultiFade":
                        actions.push(createAction('ALL', 'FADE', 10000));
                        for(let i = 0; i < 6; i++){
                            actions.push(createAction([i], 'FADE', 500));
                        }
                        createAction([], 'FADE', 10000)
                        repeat = 0;
                        break;
                    case "MultiJump":
                        actions.push(createAction('ALL', 'JUMP', 5000));
                        for(let i = 0; i < 6; i++){
                            actions.push(createAction([i], 'JUMP', 500));
                        }
                        createAction([], 'JUMP', 10000)
                        repeat = 0;
                        break;
                }

                const siteJob = new Job(Jobs, 'commandTree', {actions: actions, repeat: repeat})
                    .retry({retries:5, wait: 15*1000})
                    .save();

                console.log(siteJob, actions);
                return siteJob;
            }
        })
    });

    function createAction(strands, key, wait){
        return {
            strands: strands,
            key: key,
            wait: wait
        }
    }

    Meteor.publish('jobs', function(job_id){
        var thisJob = Jobs.findOne({_id: job_id});
        if(thisJob){
            return Jobs.find({status: {$in: ['ready', 'running']}, created: {$lte: thisJob.created}}, {fields: {_id: 1, "status":1}});
        }
        this.ready();
    })
}