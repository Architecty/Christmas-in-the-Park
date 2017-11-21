import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

const colorList = [
    {name: "Random",            key: 'RANDOM',      hex: '#eee'},
    {name: "Red",               key: 'RED',         hex: '#FF001E'},
    {name: "Green",             key: 'GREEN',       hex: '#32FF17'},
    {name: "Blue",              key: 'BLUE',        hex: '#0040FF'},
    {name: "Yellow",            key: 'YELLOW',      hex: '#FFFA00'},
    {name: "Pale Green",        key: 'PALE_GREEN',  hex: '#61F36A'},
    {name: "Tinted Green",      key: 'TINTED_GREEN',hex: '#ACFFB1'},
    {name: "Seafoam",           key: 'SEAFOAM',     hex: '#67DBAD'},
    {name: "Teal",              key: 'TEAL',        hex: '#4EF2F0'},
    {name: "Light Blue",        key: 'LIGHT_BLUE',  hex: '#8CFFFF'},
    {name: "Violet",            key: 'VIOLET',      hex: '#CF9EFF'},
    {name: "Purple",            key: 'PURPLE',      hex: '#9742EA'},
    {name: "Pink",              key: 'PINK',        hex: '#F892F8'},
    {name: "Pale Blue",         key: 'WHITE',       hex: '#CCFFFF'}
];

const patternList = [
    {name: "Random", icon: "?"},
    //{name: "Rotate", icon: '<i class="fa fa-spinner fa-pulse fa-fw"></i>'},
    {name: "Fade", icon: '<i class="fa fa-spinner fadeinout"></i>'},
    {name: "Blink", icon: '<i class="fa fa-spinner blink"></i>'},
    {name: "Solid", icon: '<i class="fa fa-spinner"></i>'}
];



Template.hello.onCreated(function(){
    this.autorun(()=>{
        this.subscribe('jobs', SessionAmplify.get('job_id'));
});
    Session.setDefault('pattern', 'Random');
    Session.setDefault('color', 'Random');
    Session.setDefault('whichTemplate', 'choices');

    if(SessionAmplify.get('job_id') === 'delay'){
        setTimeout(()=>{
            if(SessionAmplify.get('job_id') === 'delay'){
            SessionAmplify.set('job_id', null);
        }
    }, 2500);
    }
});

Template.hello.helpers({
    whichTemplate() {
        if(!SessionAmplify.get('job_id')){
            return 'choices'
        } else if(SessionAmplify.get('job_id') === 'delay'){
            return 'uploading';
        } else if (SessionAmplify.get('job_id') && Jobs.findOne({_id: SessionAmplify.get('job_id'), status: 'ready'})){
            return 'waiting';
        } else if (SessionAmplify.get('job_id') && Jobs.findOne({_id: SessionAmplify.get('job_id'), status: 'running'})){
            return 'playing';
        } else if(SessionAmplify.get('job_id') && !Jobs.findOne({_id: SessionAmplify.get('job_id')})){
            return 'finished';
        }
    }
})

Template.waiting.helpers({
    positionInLine() {
        return Jobs.find({status: 'ready'}).count();
    }
})

Template.finished.events({
    'click #clearJob_id'(e){
        SessionAmplify.set('job_id', null);
    }
})

Template.choices.helpers({
    selectedColor() {
        return colorList.filter(val => val.key === Session.get('color'))
    .reduce((sum, val) => {sum = val});
    },
    selectedPattern() {
        return patternList.filter(val => val.name === Session.get('pattern'))
    .reduce((sum, val) => {sum = val});
    },
});

Template.choices.events({
    'click button#updateTree'(event, instance) {
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
        }

        var color = Session.get('color') !== 'Random' ? Session.get('color') : colorList[getRandomInt(1, colorList.length)].name,
            pattern = Session.get('pattern') !== 'Random' ? Session.get('pattern') : patternList[getRandomInt(1, patternList.length)].name;



        SessionAmplify.set('job_id', 'delay');
        Meteor.call('addCommand', pattern, color, function (err, result){
            if(err){
                alert(err);
            }
            if(result){
                setTimeout(function(){
                    SessionAmplify.set('job_id', result);
                }, 2500)
            }
        });
    },
});

Template.colorModal.helpers({
    colors() {
        return colorList;
    },
});

Template.colorModal.events({
    'click button'(event, instance) {
        Session.set('color', $(event.currentTarget).data('key'));
        $("#colorModal").modal('hide');
    },
});

Template.patternModal.helpers({
    patterns() {
        return patternList;
    },
});

Template.patternModal.events({
    'click button'(event, instance) {
        Session.set('pattern', $(event.currentTarget).data('type'));
        $("#patternModal").modal('hide');
    },
});
