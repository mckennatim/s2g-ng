'use strict';

/* Controlrs */
var stuffAppControllers = angular.module('stuffAppControllers', []);

stuffAppControllers.controller('RootController', function($scope, $state) {
    $scope.$state = $state;
});

stuffAppControllers.controller('TimeCtrl', function ($scope, UsersData) {
    $scope.timestamp=Date.now();
});


stuffAppControllers.controller('RegisterCtrl', ['$scope', '$http', 'AuthService', 'UserLS',  'TokenService', 'DbService', 'ListService', '$rootScope', 'Users', function ($scope, $http, AuthService, UserLS, TokenService, DbService, ListService, $rootScope, Users) {
    if (TokenService.tokenExists()){
        var message = 'all set you are authorized and have token';
        $scope.state = Users.setRegState('Authenticated');
        $scope.message=Users.setRegMessage(message);
    } else {
         var message = 'you seem to be lacking a token';
        $scope.message=Users.setRegMessage(message);
    }
    console.log(Users.getRegMessage());
    $scope.dog = 'butler';
    $scope.nameValid =/^\s*\w*\s*$/
    $scope.user = Users.al[Users.al.activeUser] || Users.blankUser;//UserLS.getLastLiveUserRec()  || UserLS.blankUser;
    console.log($scope.user);
    $scope.state=Users.getRegState();
    if ($scope.state=='Enter apikey'){
        $scope.message = Users.setRegMessage('will give you token when we check your apikey');
    }
    console.log($scope.state);
    $scope.username=$scope.user.name || '';
    $scope.email=$scope.user.email || '';
    $scope.apikey=$scope.user.apikey || '';
    $scope.isuUser='';
    $scope.isMatch='';
    console.log('in register control')
    $scope.$watch('$rootScope.online', function(newValue, oldValue){
        console.log('watchin')
        if (newValue ==false){
            $scope.message = 'server or you are offline, try later';
            console.log('server or you are offline, try later')
        }
    })
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
                UserLS.setActiveUser($scope.username);
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
                $scope.message = Users.setRegMessage(data.message);
                $scope.apikey = '';
            } else if (data.token.length>40){  
                //$scope.state=UserLS.getRegState(); 
                Users.makeActive(name);
                TokenService.setToken(name, data.token);
                Users.dBget().then(function(){
                    Users.makeActive(name);
                    Users.dBgetLists();
                });                
                $scope.message = Users.setRegMessage('authenticated, token received');
                $scope.state = Users.setRegState('Authenticated');
                $scope.apikey = '';                    
            }
        }, function(data){//if error
            console.log(data)
            $scope.message = UserLS.setRegMessage(data.message);
        });
    };    
}]);

stuffAppControllers.controller('IsregCtrl', function (TokenService, $state, Users) {
     if (TokenService.tokenExists()){
        $state.go('list');
    } else{
        Users.setRegState('Get token');
        $state.go('register');
    }    
});

stuffAppControllers.controller('ListsCtrl', ['$scope', '$state', 'TokenService', 'UserLS', 'ListService', 'DbService', '$rootScope', '$window', 'Users', 'Lists', function ($scope, $state, TokenService, UserLS, ListService, DbService, $rootScope, $window, Users, Lists) {//must be in same order
    if (TokenService.tokenExists()){
        /*------setup------*/
        console.log('in Lists ctrl');
        var userName;
        //$scope.listsInput='dog';
        $scope.templUser = 'partials/user.html';        
        var online = $rootScope.online = false ;   
        //DbService.ckIfOnline();  
        $scope.lists = Lists;
        $scope.users = Users;
        $scope.active = Users.al.activeUser;
        /*-------event driven-------*/

        $scope.makeActive=function(name){
            Users.makeActive(name);
        }
        $scope.makeDefListInfo =function(def){
            Users.makeDefLid(def.lid);
            console.log('clicked shops')
            $state.go('list');
        }        
        var onFocus = function(){
            console.log('lists focused')
            DbService.ckIfOnline().then(function(status){
                if (status==200){
                    console.log('in onFocus about to dBget and saveList ')
                    Users.dBget().then(function(){});
                    if ($scope.lists.lal[$scope.lists.lal.activeList]){
                        Lists.updList($scope.lists.lal[$scope.lists.lal.activeList]);
                    }else{
                        console.log('no active list')
                    }
                }
                console.log(status)
            });
        }
        $window.onfocus = onFocus;           

        $rootScope.$watch('online', function(newValue, oldValue){
            //console.log('watched')
            //console.log(newValue)
            if (newValue !== oldValue) {
                online=$scope.online=newValue;
                if(newValue){
                    console.log('$rootScope.online changed to: '+$rootScope.online )
                    Users.dBget().then(function(){});
                }                
            }                       
        }); 
        $scope.join = function(){
            console.log($scope.listsInput)
             if ($scope.listsInput) {
                Users.dBjoin($scope.listsInput).then(function(data){
                    if (data.message){
                        $scope.message = data.message;
                    }else {
                        $scope.message= ''
                        console.log(data)
                    }
                    $scope.listsInput = ''
                });                
            }
        };
        $scope.remove = function(list){
            console.log(list)
            alert('Are you sure you want to resign from this list?')
            Users.dBdelList(list.lid).then(function(data){
                if (data.message){
                    $scope.message = data.message;
                }else {
                    console.log(data)
                }
            })
        };
        $scope.add = function(){
            console.log($scope.listsInput)
             if ($scope.listsInput) {
                Users.dBaddList($scope.listsInput).then(function(data){
                    if (data.message){
                        $scope.message = data.message;
                    }else {
                        $scope.message= ''
                        console.log(data)
                    }
                    $scope.listsInput = ''
                });                
            }
        };
        $scope.edit =function(list){
            $scope.editedList=list;
            $scope.originalItem = angular.extend({}, list);
        }; 
        $scope.revertEdit = function(list){
            console.log('escaped into revertEdit')
            $scope.editedList = null;
            $scope.users.al[$scope.users.al.activeUser].lists[$scope.users.al[$scope.users.al.activeUser].lists.indexOf(list)]=$scope.originalItem;
            //$scope.lists[$scope.lists.indexOf(list)] = $scope.originalItem;
            //$scope.doneEditing($scope.originalItem);           
        };
        $scope.doneEditing = function(list){
            console.log('in doneEditing')
            $scope.editedList = null;
            $scope.users.al[$scope.users.al.activeUser].lists[$scope.users.al[$scope.users.al.activeUser].lists.indexOf(list)]=list;
            Users.dBput($scope.users.al[$scope.users.al.activeUser]);
        };                                                 
    } else{
        UserLS.setRegState('Get token');
        $state.go('register');
    }
}]);

stuffAppControllers.controller('ListCtrl', ['$scope', '$state', '$filter',  '$interval', '$window', 'ListService', 'TokenService', 'UserLS', 'DbService', '$rootScope', 'Lists', 'Users', 'Stores', function ($scope, $state, $filter, $interval, $window, ListService, TokenService, UserLS, DbService, $rootScope, Lists, Users, Stores) {
    if (TokenService.tokenExists()){
        /*----------setup----------------*/
        console.log('in list ctrl')
        var lid, list, clist, listInfo, items, online, userName, init;
        var filter =$filter('filter');
        $scope.templLists = 'partials/lists.html'; 
        online= $scope.online=$rootScope.online=false;
        //DbService.ckIfOnline();
        $scope.lists = Lists;
        $scope.users = Users;
        $scope.stores=Stores;
        $scope.onFocus = function(){
            console.log('lists focused')
            DbService.ckIfOnline().then(function(status){
                if (status==200){
                    console.log('in onFocus about to dBget and saveList ')
                    Users.dBget().then(function(){});
                    Lists.updList($scope.lists.lal[$scope.lists.lal.activeList]);
                }
                console.log(status)
            });
        }
        $scope.makeActive=function(name){
            Users.makeActive(name);
        }
        $scope.makeDefListInfo =function(def){
            Users.makeDefLid(def.lid);
        }
        $scope.editBuffer={} 
     
        $rootScope.$watch('online', function(newValue, oldValue){
            //console.log('watched')
            //console.log(newValue)
            if (newValue !== oldValue) {
                online=$scope.online=newValue;
                if(newValue){
                    console.log('$rootScope.online changed to: '+$rootScope.online )
                }                
            }                       
        });         
        $scope.ckDone = function(item){
            //console.log('in ckDone')
            if (item.amt){
                item.amt.qty="";
            }
            Lists.saveList();
        }
        $scope.editItem = function(item){
            console.log(item)
            $scope.editedItem= item;
            $scope.buffer = JSON.parse(JSON.stringify(item));
            console.log($scope.buffer)
        };
        $scope.doneEditing = function(buffer){
            console.log('in doneEditing')  
            console.log(buffer)         
            $scope.editedItem.product = buffer.product.trim();
            if(buffer.loc){$scope.editedItem.loc = buffer.loc.trim();}
            console.log(buffer.tags)
            if(buffer.tags && buffer.tags.length>0){$scope.editedItem.tags = buffer.tags;}
            console.log(buffer.amt);
            if (buffer.amt){
                $scope.editedItem.amt = {qty:0, unit:''}
                if(buffer.amt.qty){
                    $scope.editedItem.amt.qty = buffer.amt.qty.trim()
                };
                if(buffer.amt.unit){
                    $scope.editedItem.amt.unit = buffer.amt.unit.trim()
                };        
            }
            if (!buffer.product) {
                $scope.remove($scope.editedItem);
            } 
            console.log($scope.editedItem)
            $scope.editedItem = null;
            Lists.saveList();
        };
        $scope.revertEdit = function(item){
            console.log('escaped into revertEdit')
            $scope.editedItem = null;
            //items[items.indexOf(item)] = $scope.originalItem;
            //$scope.doneEditing($scope.originalItem);           
        };                 
        $scope.rubmit = function(){
            console.log($scope.lists.lal.activeList)
            if ($scope.query) {
                $scope.lists.lal[$scope.lists.lal.activeList].items.push({product:this.query, done:false});
                $scope.query = '';
                Lists.saveList();
             }
        };
        $scope.remove= function(item){
            var idx = $scope.lists.lal[$scope.lists.lal.activeList].items.indexOf(item);
            $scope.lists.lal[$scope.lists.lal.activeList].items.splice(idx,1);
            Lists.saveList();
        };
        var orderBy = $filter('orderBy');
        var filter = $filter('filter');  
        $scope.aisleOrder = function(item){
            if(!item.loc){
                return 0 
            }else {
                return $scope.stores.st[store.id].aisles.indexOf(item.loc); 
            }  
        };              
        $scope.orderByStore= function(store){
            var aisleOrder = function(item){
                if(!item.loc){
                    return 0 
                }else {
                    //console.log(item.product + ' ' +item.loc)
                    //console.log($scope.stores.st[store.id].aisles.indexOf(item.loc))
                    return  $scope.stores.st[store.id].aisles.indexOf(item.loc);
                }  
            };            
            var items= $scope.lists.lal[$scope.lists.lal.activeList].items;
            $scope.lists.lal[$scope.lists.lal.activeList].items = orderBy(items, aisleOrder);
            Lists.saveList();
        };

        $scope.reverse = false;
        $scope.sort = function(){
            var items= $scope.lists.lal[$scope.lists.lal.activeList].items;
            $scope.lists.lal[$scope.lists.lal.activeList].items = orderBy(items, "product", $scope.reverse);
            $scope.reverse = !$scope.reverse
            Lists.saveList();
        }
    } else{
        UserLS.setRegState('Get token');
        $state.go('register');
    };   
}]);


stuffAppControllers.controller('UserCtrl', ['$scope', 'DbService', 'TokenService', 'Users', 'Lists', function ($scope, DbService,TokenService, Users,Lists) {
    if (TokenService.tokenExists()){
        console.log('in UserCtrl')
        $scope.lists = Lists;
        $scope.users= Users;
        $scope.active = Users.al.activeUser;
        DbService.ckIfOnline();
        $scope.makeActive=function(name){
            Users.makeActive(name);
        }
        $scope.makeDefListInfo =function(def){
            Users.makeDefLid(def.lid); 
        }        
    } else {
         var message = 'you seem to be lacking a token';
    }   
}]);

stuffAppControllers.controller('TemplCtrl', ['$scope', 'DbService', 'TokenService', 'UserLS', function ($scope, DbService, TokenService, UserLS) {
    if (TokenService.tokenExists()){
        var message = 'all set you are authorized and have token';
        $scope.state = UserLS.setRegState('Authenticated');
        $scope.message=UserLS.setRegMessage(message);
    } else {
         var message = 'you seem to be lacking a token';
        $scope.message=UserLS.setRegMessage(message);
    }    
}]);
stuffAppControllers.controller('ShopsCtrl', ['$scope', 'DbService', 'UserLS', '$rootScope',function ($scope, DbService, UserLS, $rootScope) {
    $scope.dog = 'fritz';
    $rootScope.online=false;
    //$scope.templ2 = 'partials/lists.html';
    //$scope.lists= UserLS.getLists();
}]);
stuffAppControllers.controller('ConfigCtrl', ['$scope', function ($scope) {
    $scope.dog = 'kazzy';

}]);
stuffAppControllers.controller('AdminCtrl', ['$scope', 'UserLS',  'TokenService', 'ListService', 'Lists', 'Users', 'Stores', function ($scope, UserLS, TokenService, ListService, Lists, Users, Stores) {
    $scope.users=Users;
    $scope.lists=Lists;
    $scope.username='';
    $scope.dog = 'piper';
    $scope.output = '';
    $scope.listAll = function(){
        console.log('in listall users')
        Users.LSget();
        console.log(JSON.stringify(Users.al))
        $scope.output=JSON.stringify(JSON.parse(localStorage.getItem('s2g_users')),undefined,2) || {};
        $scope.username='';
    }; 
    $scope.find = function(){
        $scope.output=JSON.stringify(Users.al[$scope.username],undefined,2);
    };  
    $scope.del = function(){
        $scope.output=Users.LSdel($scope.username);
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
    $scope.userL='';
    $scope.outputL= '';
    $scope.listAllL = function(){
        $scope.outputL=JSON.stringify(JSON.parse(localStorage.getItem('s2g_clists')),undefined,2) || {};
        $scope.userL='';
    }; 
    $scope.findL = function(){
        $scope.outputL=JSON.stringify(JSON.parse(localStorage.getItem('s2g_clists'))[$scope.userL],undefined, 2);
    };  
    $scope.delL = function(){
        $scope.outputL=TokenService.delUserToken($scope.usernameT);
        $scope.userL='';
    };  
    $scope.store='';
    $scope.outputS= '';
    $scope.listAllS = function(){
        $scope.outputS=JSON.parse(localStorage.getItem('s2g_stores')) || {};
        $scope.store='';
    }; 
    $scope.findS = function(){
        $scope.outputS='';
    };  
    $scope.delL = function(){
        $scope.outputS='';
        $scope.userL='';
    };      
    $scope.reset= function(){
        Users.reset();
        Lists.reset();
        Stores.reset();
    }; 
    $scope.clear= function(){
        localStorage.clear()
    };
}]);     