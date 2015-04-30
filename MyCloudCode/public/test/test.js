var app = angular.module('app', [
    'GlobalConfiguration',
    'Parse',
]);

app.run(function(applicationId, javaScriptKey, ParseSDK){


    ParseSDK.initialize(applicationId, javaScriptKey);

    var obj = new ParseSDK.Object("Monster");
    obj.set('test', 'here');
    obj.set('time', new Date());
    obj.save()
    .then(function(o){
        

        var q = new ParseSDK.Query('Monster');
        q.limit(10);
        q.descending('createdAt');
        q.find()
        .then(function(results){
            console.log(results);
        })

    },
         function(e) {
    });

});