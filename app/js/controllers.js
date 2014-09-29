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

stuffAppControllers.controller('RegisterCtrl', ['$scope', '$http', 'AuthService', 'UserLS',  'TokenService', 'DbService', 'ListService', '$rootScope', function ($scope, $http, AuthService, UserLS, TokenService, DbService, ListService, $rootScope) {
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
    console.log(UserLS.serverIsOnline())
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
                $scope.message = UserLS.setRegMessage(data.message);
                $scope.apikey = '';
            } else if (data.token.length>40){  
                //$scope.state=UserLS.getRegState(); 
                UserLS.setActiveUser(name);
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

stuffAppControllers.controller('IsregCtrl', function (TokenService, $state) {
     if (TokenService.tokenExists()){
        $state.go('list');
    } else{
        UserLS.setRegState('Get token');
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
        Users.dBget().then(function(){});
        $scope.makeActive=function(name){
            Users.makeActive(name);
        }
        $scope.makeDefListInfo =function(def){
            Users.makeDefLid(def.lid);
            $state.go('list');
        }        
        /*-------event driven-------*/
        var onFocus = function(){
            console.log('focused')
            DbService.ckIfOnline().then(function(status){
                if (status==200){
                    console.log('in onFocus about to dBget ')
                    Users.dBget().then(function(){});
                }
                console.log(status)
            });
        }
        $window.onfocus = onFocus;           

        $rootScope.$watch('online', function(newValue, oldValue){
            console.log('watched')
            console.log(newValue)
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
        // $scope.goList = function(listInfo){
        //     console.log(listInfo)
        //     UserLS.setDefaultLid(listInfo);
        //     $state.go('list');
        // };            
        // $scope.add = function(){
        //     if ($scope.listsInput) {
        //         console.log($scope.listsInput)
        //         ListService.addList($scope.listsInput).then(function(data){
        //             if (data==undefined){
        //                 console.log(data);
        //                 $scope.message=', either you or the server is offline, try later.'
        //             }else{
        //                 $scope.lists.push(data)
        //                 console.log(JSON.stringify($scope.lists))
        //                 UserLS.updLists($scope.lists);                     
        //             }
        //         },function(data){
        //             console.log(data);
        //         });
        //         $scope.listsInput = '';
        //      }
        // };  

        // $scope.remove = function(list){
        //     console.log(list)
        //     alert('Are you sure you want to resign from this list?')
        //     ListService.delList(list.lid).then(function(data){
        //         console.log(data);
        //         DbService.updateUser().then(function(){
        //             $scope.lists= UserLS.getLists();
        //             $scope.originalItem = angular.extend({}, list);
        //         });
        //     })
        // };
        // $scope.edit =function(list){
        //     $scope.editedList=list;
        //     $scope.originalItem = angular.extend({}, list);
        //     if(!UserLS.serverIsOnline()){
        //         $scope.message=', either you or server are offline, update later';
        //         $scope.revertEdit(list);
        //     }
        // };
        // $scope.revertEdit = function(list){
        //     console.log('escaped into revertEdit')
        //     $scope.lists[$scope.lists.indexOf(list)] = $scope.originalItem;
        //     $scope.doneEditing($scope.originalItem);           
        // };
        // $scope.doneEditing = function(list){
        //     console.log('in doneEditing')
        //     $scope.editedList = null;
        //     list.shops = list.shops.trim();
        //     var lists = UserLS.updList(list);
        //     var stuff = {$set: {lists: lists}};
        //     DbService.putUser(stuff);
        // };        
        // $scope.join = function(){
        //     console.log($scope.listsInput)
        //      if ($scope.listsInput) {
        //         ListService.joinList($scope.listsInput).then(function(data){
        //             console.log(data);
        //             DbService.updateUser().then(function(){
        //                 $scope.lists= UserLS.getLists();
        //             });
        //         });                
        //     }
        // }        
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
        $scope.makeActive=function(name){
            Users.makeActive(name);
        }
        $scope.makeDefListInfo =function(def){
            Users.makeDefLid(def.lid);
        }
        $scope.editBuffer={} 
        /*----------event driven----------*/ 
        $scope.$watch('lists', function(newValue,oldValue){
            $scope.cnt=filter($scope.lists.lal[$scope.lists.lal.activeList].items, ({done: false})).length;
            if(newValue!== oldValue){
                console.log('watch $scope.items changed ');
                Lists.saveLists();
            }
        },true );   /*----!important-for deep copy---*/ 
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
            if(buffer.tags.length>0){$scope.editedItem.tags = buffer.tags;}
            if (buffer.amt){
                if(buffer.amt.qty){$scope.editedItem.amt.qty = buffer.amt.qty.trim()};
                if(buffer.amt.unit){$scope.editedItem.amt.unit = buffer.amt.unit.trim()};        
            }
            if (!buffer.product) {
                $scope.remove($scope.editedItem);
            } 
            console.log($scope.editedItem)
            $scope.editedItem = null;
        };
        $scope.revertEdit = function(item){
            console.log('escaped into revertEdit')
            $scope.editedItem = null;
            //items[items.indexOf(item)] = $scope.originalItem;
            //$scope.doneEditing($scope.originalItem);           
        };                 
        $scope.rubmit = function(){
            if ($scope.query) {
                $scope.lists.lal[$scope.lists.lal.activeList].items.push({product:this.query, done:false});
                $scope.query = '';
             }
        };
        $scope.remove= function(item){
            var idx = $scope.lists.lal[$scope.lists.lal.activeList].items.indexOf(item);
            $scope.lists.lal[$scope.lists.lal.activeList].items.splice(idx,1);
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
        };

        $scope.reverse = false;
        $scope.sort = function(){
            var items= $scope.lists.lal[$scope.lists.lal.activeList].items;
            $scope.lists.lal[$scope.lists.lal.activeList].items = orderBy(items, "product", $scope.reverse);
            $scope.reverse = !$scope.reverse
        }
    } else{
        UserLS.setRegState('Get token');
        $state.go('register');
    };   
}]);


stuffAppControllers.controller('UserCtrl', ['$scope', 'DbService', 'TokenService', 'UserLS', 'Users', 'Lists', function ($scope, DbService,TokenService, UserLS, Users,Lists) {
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
        // $scope.templUser = 'partials/user.html';    
        // $scope.state = UserLS.setRegState('Authenticated');
        // $scope.message=UserLS.setRegMessage(message);
        // $scope.users= UserLS.getUsers();
        // console.log($scope.users)
        // */------------events------------*/
        // $scope.makeActive = function(user){
        //     UserLS.setActiveUser(user);
        //     console.log(user)
        // }
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
    $scope.userL='';
    $scope.outputL= '';
    $scope.listAllL = function(){
        $scope.outputL=JSON.parse(localStorage.getItem('s2g_clists')) || {};
        $scope.userL='';
    }; 
    $scope.findL = function(){
        $scope.outputL=TokenService.getToken($scope.usernameT);
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