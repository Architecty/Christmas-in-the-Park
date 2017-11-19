import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

const colorList = [
    {name: "Random", hex: 'linear-gradient(135deg, #ff0202 3%,#fbff1e 19%,#3cff1e 35%,#1effff 51%,#1e61ff 65%,#ec1eff 78%,#ff1e7c 91%,#ff1e22 100%)'},
    {name: "Red", hex: '#FF001E'},
    {name: "Green", hex: '#32FF17'},
    {name: "Blue", hex: '#173AFF'},
    {name: "Teal", hex: '#4EF2F0'},
    {name: "Seafoam", hex: '#67DBAD'},
    {name: "Violet", hex: '#B156DB'},
    {name: "Pink", hex: '#DB56DB'},
    {name: "White", hex: '#FFF'}
];

const patternList = [
    {name: "Random", icon: "?"},
    {name: "Rotate", icon: '<i class="fa fa-spinner fa-pulse fa-fw"></i>'},
    {name: "Fade", icon: '<i class="fa fa-spinner fadeinout"></i>'},
    {name: "Blink", icon: '<i class="fa fa-spinner blink"></i>'},
    {name: "Solid", icon: '<i class="fa fa-spinner"></i>'}
]



Template.hello.onCreated(function(){
    this.autorun(()=>{
        this.subscribe('jobs', Session.get('job_id'));
    })
    Session.setDefault('pattern', 'Random');
    Session.setDefault('color', 'Random');
    Session.setDefault('whichTemplate', 'choices')
})

Template.hello.helpers({
  whichTemplate() {
      if(!Session.get('job_id')){
         console.log('choices');
          return 'choices'
      } else if(Session.get('job_id') === 'delay'){
          console.log('uploading');
          return 'uploading';
      } else if (Session.get('job_id') && Jobs.findOne({_id: Session.get('job_id'), status: 'ready'})){
          console.log('waiting');
          return 'waiting';
      } else if (Session.get('job_id') && Jobs.findOne({_id: Session.get('job_id'), status: 'running'})){
         console.log('playing');
          return 'playing';
      } else if(Session.get('job_id') && !Jobs.findOne({_id: Session.get('job_id')})){
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
        Session.set('job_id', null);
    }
})

Template.choices.helpers({
    selectedColor() {
        return colorList.filter(val => val.name === Session.get('color'))
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



        Session.set('job_id', 'delay');
        Meteor.call('addCommand', pattern, color, function (err, result){
            if(err){
                alert(err);
            }
            if(result){
                setTimeout(function(){
                    Session.set('job_id', result);
                }, 3000)
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
        Session.set('color', $(event.currentTarget).text());
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
