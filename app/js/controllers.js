'use strict';

//var httpLoc = 'http://10.0.1.24:3000/api/';
//var httpLoc = 'http://localhodst:3000/api/';

/* Controlrs */
var stuffAppControllers = angular.module('stuffAppControllers', []);

stuffAppControllers.controller('RootController', function($scope, $state) {
  $scope.$state = $state;
});

stuffAppControllers.controller('ItemsCtrl', ['$scope', function ($scope) {
  $scope.dog = 'mutt';
}]);

stuffAppControllers.controller('TimeCtrl', function ($scope, UsersData) {
  $scope.timestamp=Date.now();
  console.log($scope.timestamp);
  $scope.addUser = function(){
    console.log('in addUser');
    UsersData.post().then(function(d){
      console.log(d);
    });
  };
});

stuffAppControllers.controller('InpCtrl', function ($scope, ItemsData, $filter) {
  var list;
  ItemsData.get().then(function(d){
    console.log(d);
    list= $scope.list = d.data;
    $scope.$watch('list', function(newValue, oldValue){
      console.log(list);
      $scope.cnt = $filter('filter')(list, {done:false}).length;
      if (newValue !== oldValue) { // This prevents unneeded calls to the local storage
        ItemsData.put(list);
      }
    }, true);
  });
  $scope.query='';
  $scope.rubmit = function(){
    if ($scope.query) {
      $scope.list.push({lid:26, product:this.query, done:false});
      $scope.query = '';
     }
  };
  $scope.clearTbox = function(){$scope.query = '';};
  $scope.remove= function(item){
    console.log(item.product);
    var idx = $scope.list.indexOf(item);
    $scope.list.splice(idx,1);
    console.log(idx);
  };
});

stuffAppControllers.controller('RegisterCtrl', function ($scope, $http, AuthService, UserLS) {
  console.log(UserLS.users.lastLive)
  $scope.dog = 'butler';
  $scope.nameValid =/^\s*\w*\s*$/
  $scope.user = UserLS.getUserIdx(UserLS.users.lastLive)  || UserLS.blankUser;
  console.log($scope.user);
  $scope.state=UserLS.getRegState();
  console.log($scope.state);
  $scope.username=$scope.user.name || '';
  $scope.email=$scope.user.email || '';
  $scope.apikey=$scope.user.apikey || '';
  $scope.isuUser='';
  $scope.isMatch='';
  $scope.userNameIs=''
  console.log('in register control')
  $scope.submit = function(){
    $scope.user.name = $scope.username
    $scope.user.email = $scope.email
    $scope.user.apikey = $scope.apikey
    //$scope.user = {username: $scope.username, email: $scope.email, apikey: $scope.apikey, lists:[]}
    console.log($scope.user)
    if ($scope.state=='Register'){
      console.log('new user to LS & db & get apikey sent')
      var response='';
      AuthService.isMatch($scope.username, $scope.email).then(function(data){
        console.log(data);
        response = data.message;
        if (['available', 'match'].indexOf(response)>-1){
          console.log('resonse is either available or match')
          UserLS.postUser($scope.user, 'Enter apikey');
          $scope.state=UserLS.getRegState(); 
          $scope.userNameIs = response;
        } else if(response=='conflict'){
          console.log('response is conflict')
          $scope.userNameIs = ' Either the user is registered with a different email or email is in use by another user. Try something else.';
        }
      },function(data){
        console.log(data)
        response = data;
      })
    } else if($scope.state == 'Enter apikey'){
      console.log('ok going to authenticate');
      AuthService.auth($scope.apikey).then(function(data){
        console.log(data);
        if (data.name==$scope.user.name){
          $scope.user = data;
          UserLS.postUser(data, 'Authenticated');   
          $scope.state=UserLS.getRegState();       
        }
      }, function(data){//if error
        console.log(data)
        response = data;
      });
    }
  } 
  $scope.doesNameExist= function(){
    console.log($scope.username+' changed')
    $scope.state='Register'
    $scope.userNameIs = ' will check status...'
    AuthService.isUser($scope.username).then(function(data){
      console.log(data)
      $scope.userNameIs=data.message;
    },function(data){
      console.log(data)
      $scope.userNameIs=data.message;
    });
    console.log('still alive')
  } 
});

stuffAppControllers.controller('IsregCtrl', function ($scope, $state, UserLS, AuthService) {
  $scope.numUsers = UserLS.numUsers();
  $scope.user = UserLS.getUserIdx(UserLS.users.lastLive)  || UserLS.blankUser;
  console.log('in isRegCtrl # of users = ' + $scope.numUsers);
  console.log($scope.user)
  if ($scope.numUsers==0){
    $state.go('register');
  } else if ($scope.numUsers==1 & $scope.user.apikey.length<10){
    UserLS.setRegState('Enter apikey');
    $state.go('register');
  } else if ($scope.numUsers==1){//and there is apikey
    console.log('ok going to authenticate');
    AuthService.auth($scope.user.apikey).then(function(data){
      console.log(data);
      if (data.name==$scope.user.name){
        $scope.user = data;
        UserLS.postUser(data, 'Authenticated');          
      }
    }, function(data){//if error
      console.log(data)
      response = data;
    });
  }
  console.log($scope.numUsers);
});

stuffAppControllers.controller('ListCtrl', function ($scope) {
  $scope.dog = 'boots';
});
stuffAppControllers.controller('ListsCtrl', function ($scope) {
  $scope.dog = 'dusty';
});
stuffAppControllers.controller('UserCtrl', function ($scope) {
  $scope.dog = 'petey';

});
stuffAppControllers.controller('ShopsCtrl', ['$scope', 'ListService', function ($scope, ListService) {
  $scope.dog = 'fritz';
  ListService.aList('Jutebi').then(function(list){
    console.log(list);
    $scope.list = JSON.stringify(list, undefined, 2);
  });
}]);
stuffAppControllers.controller('ConfigCtrl', ['$scope', function ($scope) {
  $scope.dog = 'kazzy';

}]);
stuffAppControllers.controller('AdminCtrl', ['$scope', 'UserLS',  function ($scope, UserLS) {
  $scope.username='';
  $scope.dog = 'piper';
  $scope.output = '';
  $scope.listAll = function(){
    $scope.output=UserLS.getAll();
  }; 
  $scope.find = function(){
    $scope.output=UserLS.getUser($scope.username);
  };  
  $scope.del = function(){
    $scope.output=UserLS.delUser($scope.username);
  };
}]);
