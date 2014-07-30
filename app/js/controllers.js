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
    // ItemsData.get().then(function(d){
    //     console.log(d);
    //     list= $scope.list = d.data;
    //     $scope.$watch('list', function(newValue, oldValue){
    //         console.log(list);
    //         $scope.cnt = $filter('filter')(list, {done:false}).length;
    //         if (newValue !== oldValue) { // This prevents unneeded calls to the local storage
    //             ItemsData.put(list);
    //         }
    //     }, true);
    // });
    // $scope.query='';
    // $scope.rubmit = function(){
    //     if ($scope.query) {
    //         $scope.list.push({lid:26, product:this.query, done:false});
    //         $scope.query = '';
    //      }
    // };
    // $scope.clearTbox = function(){$scope.query = '';};
    // $scope.remove= function(item){
    //     console.log(item.product);
    //     var idx = $scope.list.indexOf(item);
    //     $scope.list.splice(idx,1);
    //     console.log(idx);
    // };
});

stuffAppControllers.controller('RegisterCtrl', ['$scope', '$http', 'AuthService', 'UserLS',  'TokenService', 'DbService', function ($scope, $http, AuthService, UserLS, TokenService, DbService) {
    if (TokenService.tokenExists()){
        var message = 'all set you are authorized and have token';
        $scope.state = UserLS.setRegState('Authenticated');
        $scope.message=UserLS.setRegMessage(message);
    } else {
         var message = 'you seem to be lacking a token';
        $scope.message=UserLS.setRegMessage(message);
    }
    console.log(UserLS.getRegMessage());
    $scope.dog = 'butler';
    $scope.nameValid =/^\s*\w*\s*$/
    $scope.user = UserLS.getLastLiveUserRec()  || UserLS.blankUser;
    console.log($scope.user);
    $scope.state=UserLS.getRegState();
    if ($scope.state=='Enter apikey'){
        $scope.message = UserLS.setRegMessage('will give you token when we check your apikey');
    }
    console.log($scope.state);
    $scope.username=$scope.user.name || '';
    $scope.email=$scope.user.email || '';
    $scope.apikey=$scope.user.apikey || '';
    $scope.isuUser='';
    $scope.isMatch='';
    console.log('in register control')
    $scope.submit = function(){
        $scope.user.name = $scope.username
        $scope.user.email = $scope.email
        $scope.user.apikey = $scope.apikey
        //$scope.user = {username: $scope.username, email: $scope.email, apikey: $scope.apikey, lists:[]}

        if ($scope.state=='Register'){
            console.log('new user to LS & db & get apikey sent')
            var response='';
            AuthService.isMatch($scope.username, $scope.email).then(function(data){
                console.log(data);
                response = data.message;
                if (['available', 'match'].indexOf(response)>-1){
                    console.log('response is either available or match')
                    UserLS.postUser($scope.user, 'Enter apikey');
                    $scope.state=UserLS.getRegState(); 
                    $scope.message =UserLS.setRegMessage(response + ', apikey sent');
                } else if(response=='conflict'){
                    console.log('response is conflict')
                    $scope.message = UserLS.setRegMessage( ' Either the user is registered with a different email or email is in use by another user. Try something else.');
                }
            },function(data){
                console.log(Object.keys(data))
                response = data;
            })
        } else if($scope.state == 'Enter apikey'){
            console.log('ok going to authenticate');
            auth($scope.apikey, $scope.username);
            
        } else if($scope.state == 'Get token'){
            console.log('ok getting token');
            auth($scope.apikey, $scope.username);
        }
    } 
    $scope.doesNameExist= function(){
        console.log($scope.username+' changed')
        $scope.state='Register'
        $scope.message = ' will check status...'
        AuthService.isUser($scope.username).then(function(data){
            console.log(data)
            var userls = UserLS.getUser($scope.username);
            if (userls){
                UserLS.setLastLive($scope.username);
                console.log(userls)
                $scope.email=userls.email;
                $scope.apikey=userls.apikey;
                if (TokenService.tokenExists()){
                    var message = 'all set you are authorized and have token';
                    $scope.state = UserLS.setRegState('Authenticated');
                    $scope.message=UserLS.setRegMessage(message);
                } else if ($scope.apikey.length>10){
                    var message = 'you seem to be lacking a token';
                    $scope.state = UserLS.setRegState('Get token');
                    $scope.message=UserLS.setRegMessage(message);
                }
            }else {
                $scope.email = '';
                $scope.apikey ='';
                $scope.message=UserLS.setRegMessage(data.message + ' on server but not here');
            }
        },function(data){
            console.log(data)
            $scope.message=UserLS.setRegMessage(data.message);
        });
        console.log('still alive')
    } 
    var auth= function(apikey, name){
        AuthService.auth(apikey, name).then(function(data){
            //console.log(data)
            if(Object.keys(data)[0]=='message'){
                response = data.message
                console.log(data)
                $scope.message = UserLS.setRegMessage(data.message);
                $scope.apikey = '';
            } else if (data.token.length>40){  
                //$scope.state=UserLS.getRegState(); 
                UserLS.setLastLive(name);
                TokenService.setToken(name, data.token);
                DbService.updateUser();
                $scope.message = UserLS.setRegMessage('authenticated, token received');
                $scope.state = UserLS.setRegState('Authenticated');
                $scope.apikey = '';                    
            }
        }, function(data){//if error
            console.log(data)
            $scope.message = UserLS.setRegMessage(data.message);
        });
    };    
}]);

stuffAppControllers.controller('IsregCtrl', function ($scope, $state, UserLS, AuthService) {
        $scope.numUsers = UserLS.numUsers();
        $scope.user =UserLS.getUser(UserLS.getLastLive()) || UserLS.blankUser;
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
                        console.log(data.token);
                        if (data.token.length >40){
                                UserLS.postUser($scope.user, 'Authenticated');   
                                UserLS.getUser($scope.user.name);       
                        }
                }, function(data){//if error
                        console.log(data.message)
                        $scope.dog = data.message
                        var response = data;
                });
        }
        console.log($scope.numUsers);
});

stuffAppControllers.controller('ListsCtrl', ['$scope', '$state', 'TokenService', 'UserLS',  function ($scope, $state, TokenService, UserLS) {
    if (TokenService.tokenExists()){
        var name = UserLS.getLastLive();
        $scope.username = name;
        $scope.lists = UserLS.getLists();
        $scope.default = UserLS.getDefaultList();
        $scope.templ = 'partials/shops.html';
    } else{
        UserLS.setRegState('Get token');
        $state.go('register');
    }
}]);

stuffAppControllers.controller('ListCtrl', ['$scope', '$state', '$filter', 'ListService', 'TokenService', 'UserLS', 'DbService', function ($scope, $state, $filter, ListService, TokenService, UserLS, DbService) {
    if (TokenService.tokenExists()){
        var lid, list, listInfo, items;
        var orderBy = $filter('orderBy');
        var filter = $filter('filter');
        $scope.showAmt = false;
        $scope.showLoc = false;
        $scope.showTags = false;
        $scope.editedItem = null;
        listInfo = ListService.getDefault();//defaultLid of lastLive user 
        if (listInfo){
            lid= $scope.lid = listInfo.lid;
        }
        var fakeshops = ["hardware", "lumber", "down Center"];
        fakeshops.unshift(listInfo.shops)
        $scope.shops = fakeshops;

        console.log($scope.shops)
        console.log(lid)
        if (! lid) {$state.go('lists');}  
        list = ListService.getLS(listInfo);
        items =$scope.items = list.items;
        //$scope.stores= list.stores;
        var mkt0={"id": "0", "name": "sort-alpha"}
        var stores=  [
                {"id" : "s_Bereti","name" : "Stop&Shop"},
                {"id" : "s_Bereto","name" : "WholeFoods"},
                {"id" : "s_Bereta","name" : "TraderJoes"}
        ];

        stores.unshift(mkt0);
        $scope.stores = stores;
        $scope.currentStore=$scope.stores[0];
        $scope.reverse = true;
        $scope.order = function() {
            var needed = filter($scope.items, ({done: false}));
            var done = filter($scope.items, ({done: true}));
            console.log($scope.currentStore.id)
            if($scope.currentStore.id=="0"){
                $scope.reverse = !$scope.reverse
                console.log($scope.reverse)
                needed = orderBy(needed, "product", $scope.reverse);
            }else {
                needed = orderBy(needed, $scope.aisleOrder);
            } 
            console.log(JSON.stringify(needed)) ;
            console.log(JSON.stringify(done)) ;
            items = $scope.items  = ListService.union(needed,done,'product')
            console.log(JSON.stringify(items))    
        };   
        var s2g_shops=  {
  "default": 0,
  "stores": [
    "s_Bereti",
    "s_Bereto",
    "s_Bereta"
  ],
  "s_Bereti": {
    "name": "Stop&Shop",
    "aisles": [
      "produce",
      "nuts",
      "canned",
      "meats",
      "baking",
      "snacks",
      "paper/plastic",
      "cleaning",
      "dairy",
      "bread"
    ],
    "address": "301 Center St, Jamaica Plain, MA 02130",
    "url": "http://stopandshop.shoplocal.com/stopandshop/default.aspx?action=entry&pretailerid=-99254&siteid=673&storeID=2598877"
  },
  "s_Bereto": {
    "name": "WholeFoods",
    "aisles": []
  }
}
        var aisles = s2g_shops["s_Bereti"].aisles;
        console.log(aisles);
        $scope.aisleOrder = function(item){
            if(!item.loc){
                return 0 
            }else {
                var ret = aisles.indexOf(item.loc);
                //console.log(ret)
                return ret;   
            }  
        };


        console.log($scope.stores[0].name)
        ListService.update(list).then(function(data){
            //console.log(data.items); 
            items = $scope.items =data.items ;
            var filt = $filter('filter')(items, {done:false});
            if(filt){
                $scope.cnt = $filter('filter')(items, {done:false}).length;                                                        
            } else {
                $scope.cnt = 0;
            }
            $scope.$watch('items', function(newValue, oldValue){
                console.log('watch is triggered');
                //console.log(items);
                list.items = items;
                list.timestamp = Date.now();
                $scope.cnt = $filter('filter')(items, {done:false}).length;
                $scope.query = '';
                //console.log(JSON.stringify(newValue));
                //console.log(JSON.stringify(oldValue));
                //console.log(newValue == oldValue)
                if (newValue !== oldValue) { // This prevents unneeded calls to update
                    ListService.update(list).then(function(data){
                        //console.log(data.items); 
                        items = $scope.items =data.items              
                    }, function(data){//on error do nothing
                    });
                }
            }, true);   
        }, function(data){
        });
        $scope.query='';
        $scope.rubmit = function(){
            if ($scope.query) {
                console.log($scope.query)
                $scope.items.push({product:this.query, done:false});
                console.log($scope.items);
                $scope.query = '';
             }
        };
        $scope.remove= function(item){
            console.log(item.product);
            var idx = $scope.items.indexOf(item);
            $scope.items.splice(idx,1);
            console.log(idx);
        };
        $scope.editItem = function(item){
            console.log('in editItem')
            $scope.editedItem= item;
            console.log($scope.editedItem == item)
            $scope.originalItem = angular.extend({}, item);
        };
        $scope.revertEdit = function(item){
            console.log('escaped into revertEdit')
            items[items.indexOf(item)] = $scope.originalItem;
            $scope.doneEditing($scope.originalItem);           
        };
        $scope.doneEditing = function(item){
            console.log('in doneEditing')
            $scope.editedItem = null;
            item.product = item.product.trim();
            if(item.amt){
                if(item.amt.qty) {item.amt.qty = item.amt.qty.trim()};
                if(item.amt.unit) {item.amt.unit = item.amt.unit.trim()};
            }
            if (!item.product) {
                $scope.remove(item);
            } 
        };
    } else{
        UserLS.setRegState('Get token');
        $state.go('register');
    }
}]);
//     if (TokenService.tokenExists()){
//         console.log('in  ListCtrl')
//         var name = UserLS.getLastLive();
//         console.log(name);
//         $scope.name = name;
//         var dl= UserLS.getDefaultList();
//         console.log(dl);
//         if (dl){
//             var lid = dl.lid;
//             console.log(lid)
//             $scope.lid= lid;
//             DbService.getList(lid).then(function(data){
//                 $scope.listInfo = data;   
//                 var list = $scope.list = data.list;
//                 $scope.$watch('list', function(newValue, oldValue){
//                     console.log(list);
//                     $scope.cnt = $filter('filter')(list, {done:false}).length;
//                     if (newValue !== oldValue) { // This prevents unneeded calls to the local storage
//                         ItemsData.put(list);
//                     }
//                 }, true);                
//             }, function(error){
//                 if(error.search('Signature verification failed')>-1){
//                     UserLS.setRegMessage('Token did not work, try getting another');
//                     UserLS.setRegState('Get token');
//                     $state.go('register');
//                 } ;
//                 console.log(typeof error);
//             });                 
//         } else {
//             console.log('aint no default list');
//             $state.go('lists');
//         }   
//     } else{
//         UserLS.setRegState('Get token');
//         $state.go('register');
//     }
// }]);

stuffAppControllers.controller('UserCtrl', ['$scope', 'DbService',  function ($scope, DbService) {
    $scope.dog = 'petey';
    DbService.updateUser();

}]);
stuffAppControllers.controller('ShopsCtrl', ['$scope', 'DbService', function ($scope, DbService) {
    $scope.dog = 'fritz';
    $scope.templ2 = 'partials/lists.html';
}]);
stuffAppControllers.controller('ConfigCtrl', ['$scope', function ($scope) {
    $scope.dog = 'kazzy';

}]);
stuffAppControllers.controller('AdminCtrl', ['$scope', 'UserLS',  'TokenService', function ($scope, UserLS, TokenService) {
    $scope.username='';
    $scope.dog = 'piper';
    $scope.output = '';
    $scope.listAll = function(){
        $scope.output=UserLS.getAll();
        $scope.username='';
    }; 
    $scope.find = function(){
        $scope.output=UserLS.getUser($scope.username);
    };  
    $scope.del = function(){
        $scope.output=UserLS.delUser($scope.username);
        $scope.username='';
    };
    $scope.usernameT='';
    $scope.outputT= '';
    $scope.listAllT = function(){
        $scope.outputT=TokenService.getAll();
        $scope.usernameT='';
    }; 
    $scope.findT = function(){
        $scope.outputT=TokenService.getToken($scope.usernameT);
    };  
    $scope.delT = function(){
        $scope.outputT=TokenService.delUserToken($scope.usernameT);
        $scope.usernameT='';
    };
}]);

        // ListService.updateList(lid).then(function(data){

        // }, function(data){

        // });
