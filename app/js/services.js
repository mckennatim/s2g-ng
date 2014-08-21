'use strict';
var httpLoc = 'http://parleyvale.com:3000/api/';

/* Services */
/*
var underscore = angular.module('underscore', []);
underscore.factory('_', function() {
    return window._;
}); 
*/
var stuffAppServices = angular.module('stuffAppServices', []);
stuffAppServices.factory('ItemsData', function($http) {
    var lsid = 'groceries';
    var inidata = [
        {lid:'26',product:'banana', done:false},
        {lid:'26',product:'coffee', done:false},
        {lid:'26',product:'brown sugar', done:false},
        {lid:'26',product:'bacon', done:false},
        {lid:'26',product:'apples', done:false},
        {lid:'26',product:'brown gravy', done:true},
        {lid:'26',product:'bags', done:true},
        {lid:'26',product:'applesauce', done:true},
        {lid:'26',product:'sugar', done:true},
        {lid:'26',product:'baby back ribs', done:true},
        {lid:'26',product:'apple butter', done:true}
    ];
        return {
        get: function () {
            /*
            var url=httpLoc + 'products/4';
            var promise=$http.get(url).then(function(data) {
                console.log(data.data);
                return data;
            });
            return promise;
            */   
            var ret = JSON.parse(localStorage.getItem(lsid)) || inidata;
            return ret;
            
        },
        put: function(list){
            console.log('in put'+lsid);
            console.log(JSON.stringify(list));
            localStorage.setItem(lsid, JSON.stringify(list));
        },
        kitty: 'mabibi'
    };
});


stuffAppServices.factory( 'ListService', ['$q', '$http', '$log', 'DbService', 'UserLS', function($q, $http, $log, DbService, UserLS){
    var key = 's2g_lists';
    var blankLists = {listsList: []};
    return{    
        getDefault: function(){
            var name = UserLS.getLastLive();
            var dl= UserLS.getDefaultList();
            return dl;
            if(dl){return dl.lid;}           
        },
        getList: function(listInfo){
            //quickly send list in localStorage then update LS and send that
            console.log('in getList')
            var lid = listInfo.lid;
            var shops = listInfo.shops;
            var list = this.getLS(lid);
            // if(! list){
            //     list = this.getDB(lid);
            // }
            if (! list){
                list = {lid: lid, shops: shops, timestamp: 0, list: [] }
            };
            return list
        },
        getLS:  function(listInfo){
            console.log('in getLS')
            console.log(listInfo)
            var ax, lid, shops, list;
            ax = this.getAll();
            lid = listInfo.lid;
            shops = listInfo.shops;
            list = ax[lid];
            if (! list){
                list = {lid: lid, shops: shops, timestamp: 0, items: [] }
                this.putLS(list);
            };            
            return list;
        },
        putLS: function(list){
            console.log('in putLS')
            var ax = this.getAll();
            ax.listsList.push(list.lid)
            ax.listsList = _.uniq(ax.listsList)
            ax[list.lid]=list;
            //console.log(JSON.stringify(ax))
            localStorage.setItem(key, JSON.stringify(ax));
            return ax;         
        },
        getAll: function(){
            var ret = {};
            if(!localStorage.getItem(key) || localStorage.getItem(key).length <10 ){
                console.log('UH OH  RECREATING  '+key)
                ret = blankLists;
                localStorage.setItem(key, JSON.stringify(ret));
            } else {
                ret=JSON.parse(localStorage.getItem(key));
            }
            return ret;            
        },
        getDB: function(lid){

        },
        ckIfOnline: function(){
            $http.get(httpLoc).   
                success(function(data, status) {
                    if(status==200){
                        UserLS.setServerOnline(true);
                    }else{
                        UserLS.setServerOnline(false);
                    }
                    console.log('setServerOnline to tf')                    
                }).
                error(function(data, status){
                    console.log('checking if online, error')
                    deferred.reject(data)
                }); 
                           
        },
        update: function(list){            
            console.log('in update')
            var c, p, s, updItems, cts, pts, sts, deferred, lid;
            var serverIsOnline = UserLS.serverIsOnline();
            console.log(serverIsOnline);
            var instance =this;
            lid = list.lid
            c = list;
            //console.log(JSON.stringify(c.items))
            cts = Date.now();
            p = this.getLS(list);
            pts = p.timestamp;
            deferred = $q.defer();
            if(serverIsOnline){
                var url=httpLoc + 'lists/'+lid; 
                $http.get(url).   
                    success(function(data, status) {
                        console.log(UserLS.serverIsOnline());
                        if(!UserLS.serverIsOnline()){
                            console.log('no connection, just update LS');
                            list.timestamp = cts;
                            instance.putLS(list);
                            deferred.resolve(list);
                            return
                        }
                        console.log('connection exists')
                        UserLS.setServerOnline(true);
                        s = data;
                        sts = s.timestamp
                        console.log(sts)
                        console.log(pts)
                        console.log(sts-pts)
                        if (sts > pts){ //if server has been updated since prior LS
                            console.log('merging')
                            updItems=instance.merge(p.items, c.items, s.items);
                        } else {
                            console.log('just sending c ')
                            updItems=c.items;
                        }
                        //console.log(JSON.stringify(updItems));
                        s.items = updItems;
                        s.timestamp = cts;
                        instance.putLS(s);
                        $http.put(url, {timestamp:cts, items: updItems}).
                            success(function(data, status) {
                                console.log(status)
                            }).                
                            error(function(data, status){
                                console.log(status)
                            });

                        deferred.resolve(s);
                    }).
                    error(function(data, status){
                        deferred.reject(data)
                    });
                s = deferred.promise;   
                return s;                  
            } else{
                console.log('no connection, just update LS');
                list.timestamp = cts;
                instance.putLS(list);
                list = deferred.promise; 
                return list
            }
            console.log('returned here')
        },
        addList: function(shops){
            var s;
            var url=httpLoc + 'lists/' + shops ;
            var deferred = $q.defer();
            $http.post(url).
                success(function(data,status){
                    s=data
                    deferred.resolve(data)
                }).
                error(function(data,status){
                    s= data
                    deferred.reject(data)
                });
                s=deferred.promise;
                return s;
        },
        delList: function(lid){
            var s;
            var url=httpLoc + 'lists/' + lid ;
            var deferred = $q.defer();
            $http.delete(url).
                success(function(data,status){
                    s=data
                    deferred.resolve(data)
                }).
                error(function(data,status){
                    s= data
                    deferred.reject(data)
                });
                s=deferred.promise;
                return s;
        },
        joinList: function(lid){
            var s;
            var url=httpLoc + 'user/'+lid;      
            var deferred = $q.defer();     
            $http.put(url).
                success(function(data,status){
                    s=data
                    deferred.resolve(data)
                }).
                error(function(data,status){
                    s= data
                    deferred.reject(data)
                });
                s=deferred.promise;
                return s;
        },
        poll: function(list){            
            console.log('in poll')
            var p, s, updItems, pts, sts, deferred, lid;
            var serverIsOnline = UserLS.serverIsOnline();
            console.log(serverIsOnline);
            var instance =this;
            p = this.getLS(list);
            pts = p.timestamp;
            lid=list.lid
            //deferred = $q.defer();
            if(serverIsOnline){
                var url=httpLoc + 'lists/'+lid; 
                $http.get(url).   
                    success(function(data, status) {
                        console.log(UserLS.serverIsOnline());
                        if(!UserLS.serverIsOnline()){
                            console.log('no connection, should have known');
                            return
                        }
                        //console.log('connection exists')
                        UserLS.setServerOnline(true);
                        s = data;
                        sts = s.timestamp;
                        console.log(s.lists);
                        console.log(pts);
                        if (sts > pts){ //if server has been updated since prior LS
                            console.log('server has been updated')
                            updItems=instance.mergeps(s.items, p.items);
                            p.items = updItems;
                            p.timestamp = pts;
                            instance.putLS(p)
                        } 
                        //deferred.resolve(p);
                    }).
                    error(function(data, status){
                        //deferred.reject(data)
                    });
                //p = deferred.promise;   
                //return p;                  
            } else{
                console.log('no connection, should have noticed');
            }
        },        
         difference: function(array){
            var prop =arguments[2];
            var rest = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
            var containsEquals = function(obj, target) {
                if (obj == null) return false;
                return _.any(obj, function(value) {
                    return value[prop] === target[prop];
                });
            };
            return _.filter(array, function(value){
                return ! containsEquals(rest, value); 
            });
        }, 
        union: function (arr1, arr2, prop) {
            var sa1= JSON.stringify(arr1);
            var arr3 = JSON.parse(sa1);
            _.each(arr2, function(arr2obj) {
                var arr1obj = _.find(arr1, function(arr1obj) {
                    return arr1obj[prop] === arr2obj[prop];
                });
                arr1obj ? _.extend(arr3, arr2obj) : arr3.push(arr2obj);
            });
            return arr3
        },    
        merge: function(pz2,cz2,sz2){
            // (C\(P\S))U(S\(P\C))
            var condT = {'done': true};
            var condF = {'done': false};
            var p = _.filter(pz2, condF);
            var c = _.filter(cz2, condF);
            var s = _.filter(sz2, condF);
            var sT = _.filter(sz2, condT);
            var ps = this.difference(p,s, 'product');
            var pc = this.difference(p,c, 'product' );
            var cps = this.difference(c,ps, 'product');
            var spc = this.difference(s,pc, 'product');
            var arr3 = this.union(spc, cps, 'product');
            //(MERGED{'done':false}) U (Server,{'done': true})
            var arr4 = this.union(arr3, sT, 'product');
            return arr4
        },
        mergeps: function(pz2,sz2){
            var condT = {'done': true};
            var condF = {'done': false};
            var p = _.filter(pz2, condF);
            var s = _.filter(sz2, condF);
            var sT = _.filter(sz2, condT);
            var ps = this.union(p, s, 'product');
            var arr4 = this.union(ps, sT, 'product');
            console.log(JSON.stringify(arr4));
            return arr4
        }                  
    }
}]);

stuffAppServices.factory('UsersData', function($http) {
    return {
        post: function () {
            var usr = {name:'tim9', email:"tim@sitebuilt.net", lists:[]};
            var url=httpLoc + 'users';
            var promise=$http.post(url, usr).then(function(data) {
                console.log(data.data);
                return data;
            });
            return promise;
            /*     
            var ret = JSON.parse(localStorage.getItem(lsid)) || inidata;
            return ret;
            */
        }
    }
});
stuffAppServices.factory('UserLS', function() {
    var key = 's2g_users';
    var state = 's2g_state';
    var blankUsers= {lastLive:0, regState: 'Register', regMessage: '', userList:[]};
    var serverOnline = true;    
    return{
        setServerOnline: function(tf){
            serverOnline = tf;
        },
        serverIsOnline: function(){
            return serverOnline;
        },  
        key: key,
        blankUsers: blankUsers,
        blankUser: {name: '', email: '', lists:[], role:'', timestamp: 1, apikey: ''},
        currentUser: this.blankUser,
        getLastLive: function(){
            var users =   this.getAll();
            //console.log( users.userList[users.lastLive]);
            //console.log(users.lastLive)
            return users.userList[users.lastLive];
        },
        setLastLive: function(name){
            var ret = this.getAll();
            console.log(ret.userList.indexOf(name))
            var idx = ret.userList.indexOf(name)
            ret.lastLive=idx;
            localStorage.setItem(this.key, JSON.stringify(ret));
            return idx;
        },
        getAll: function () {
            //console.log(localStorage.getItem(this.key).length)    
            var ret = {};
            if(!localStorage.getItem(this.key) || localStorage.getItem(this.key).length <10 ){
                console.log('UH OH  RECREATING  s2g_users')
                ret = this.blankUsers;
                console.log(JSON.stringify(ret))
                localStorage.setItem(this.key, JSON.stringify(ret));
            } else {
                //console.log(localStorage.getItem(this.key));
                //console.log(JSON.parse(localStorage.getItem(key)).userList);
                ret=JSON.parse(localStorage.getItem(this.key));
            }
            return ret;
        },
        getLists: function(){
            var al = this.getAll();
            var usr = al[al.userList[al.lastLive]]
            var ret= usr.lists;
            console.log(ret);
            return ret;
        },
        getDefaultList : function(){
            var al = this.getAll();
            var usr = al[al.userList[al.lastLive]]
            var lists= usr.lists;
            var def = usr.defaultList;
            var ret = lists[def];
            //console.log(usr);
            return ret;
        },
        setDefaultList: function(idx){
            var al = this.getAll();
            al[al.userList[al.lastLive]].defaultList= idx
            localStorage.setItem(this.key, JSON.stringify(al));
        },
        pushList: function(list){
            var al = this.getAll();
            al[al.userList[al.lastLive]].lists.push(list)
            localStorage.setItem(this.key, JSON.stringify(al));
        },
        updLists: function(lists){
            var al = this.getAll();
            al[al.userList[al.lastLive]].lists=lists
            localStorage.setItem(this.key, JSON.stringify(al));
        },
        setRegState: function(st){
            var ret = this.getAll();
            ret.regState = st;
            localStorage.setItem(this.key, JSON.stringify(ret));
            return st;
        },
        getRegState: function(){
            var ret = this.getAll();
            return ret.regState;
        },
        getRegMessage: function(){
            var ax = this.getAll();
            return ax.regMessage;
        },
        setRegMessage: function(message){
            var ax = this.getAll();
            ax.regMessage=message;
            localStorage.setItem(this.key, JSON.stringify(ax));
            return message
        },

        getUser: function (user) {   
            var ret = this.getAll()
            return ret[user];
        },
        getLastLiveUserRec: function(){
            var name = this.getLastLive();
            return this.getUser(name);
        },  
        getUserIdx: function(idx){
            var ret = this.getAll();
            this.currentUser = ret[ret.userList[idx]];
            return this.currentUser;
        },  
        postUser: function(user, regState) {
            var al = this.getAll();
            //console.log(user.name)
            al.userList.push(user.name)
            al.userList = _.uniq(al.userList)
            al.lastLive = al.userList.indexOf(user.name)
            al.regState = regState //'Enter apikey', 'Register' or 'Authenticated or Get token'
            al[user.name]=user 
            localStorage.setItem(this.key, JSON.stringify(al));
            return al
        },
        numUsers: function(){
            var bl = this.getAll();
            console.log(bl)
            return bl.userList.length;
        },
        delUser: function(name){
            var ulist = this.getAll();
            delete ulist[name]
            var index = ulist.userList.indexOf(name);    
            if (index !== -1) {
                    ulist.userList.splice(index, 1);
            }
            if (this.getLastLive==name){
                ulist.lastLive=0;
            }
            localStorage.setItem(this.key, JSON.stringify(ulist));
            return ulist;
        }
    }
});
stuffAppServices.factory('AuthService', ['$http', '$q', 'DbService',  function($http, $q, DbService) {
    return {
        auth: function(apikey, name) {
            var url=httpLoc + 'authenticate/' + name;
            var deferred = $q.defer();
            $http.post(url, {apikey:apikey}, {withCredentials:true}).   
                success(function(data, status) {
                    //console.log(data);
                    //console.log(status);
                    deferred.resolve(data);
                }).
                error(function(data, status){
                    console.log(data || "Request failed");
                    console.log(status);
                    if (status==0){
                        deferred.reject({message: 'server is down'})
                    } else if(status==401){
                        deferred.reject({message: 'Authorization failed, try re-entering apikey'})               
                    } else if(status==404){
                        deferred.reject({message: '404, try re-entering apikey'})
                    }else{
                        deferred.reject({message: 'no clue on what is wrong'})
                    }
                });
            return deferred.promise;
        },
        isUser: function(name) {
            var url=httpLoc + 'isUser/'+name;
            var deferred = $q.defer();
            $http.get(url).   
                success(function(data, status) {
                    console.log(data);
                    console.log(status);
                    deferred.resolve(data);
                }).
                error(function(data, status){
                    console.log(data || "Request failed");
                    if (status==0){
                        deferred.reject({message: 'user not found'});
                    } else {
                        deferred.reject({message: 'server is down'});
                    }
                });
            return deferred.promise;
        },
        isMatch: function(name, email) {
            var url=httpLoc + 'isMatch/?user='+name+'&email='+email;      
            var deferred = $q.defer();
            $http.get(url).   
                success(function(data, status) {
                    console.log(data);
                    console.log(status);
                    deferred.resolve(data);
                }).
                error(function(data, status){
                    console.log(data || "Request failed");
                    console.log(status);
                    deferred.reject({message: 'server is down'})
                });
            return deferred.promise;
        }    
    }
}]);
stuffAppServices.factory('DbService', ['$http', '$q', 'UserLS','TokenInterceptor' , function($http, $q, UserLS, TokenInterceptor) {
    return {
        updateUser: function(){ 
            var uname = UserLS.getLastLive()
            var url=httpLoc + 'users/'+uname;      
            var deferred = $q.defer();
            $http.get(url, {withCredentials:true}).   
                success(function(data, status) {
                    if(data != undefined){
                        console.log(data)
                        UserLS.postUser(data, 'Authenticated');                      
                    };
                    console.log(status);
                    deferred.resolve(data);
                }).
                error(function(data, status){
                    console.log(data || "Request failed");
                    console.log(status);
                    deferred.reject({message: 'server is down'})
                });
            return deferred.promise;
        },
        getList: function(list) {
            var url=httpLoc + 'lists/'+list;      
            var deferred = $q.defer();
            //var config = {};
            //config = TokenInterceptor.request(config);
            //console.log(config);
            $http.get(url).   
            //$http.get(url, config).   
            //$http.get(url, {headers: {Authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoidGltIn0.LmoK1Nr8uA4hrGr25L2AlKXs6U832Z_lE6JGznHJfFs'}}).   
                success(function(data, status) {
                    deferred.resolve(data);
                }).
                error(function(data, status){
                    deferred.reject(data)
                });
            return deferred.promise;
        }
    }
}]);
stuffAppServices.factory('TokenInterceptor', ['$q', '$injector', function ($q, $injector) {
    var UserLS=$injector.get('UserLS');
    var TokenService = $injector.get('TokenService');
    //var ListService = $injector.get('ListService');
    var key = 's2g_tokens';
    var blankTokens= {userList:[]};
    return { 
        request: function (config) {
            var blankTokens= {userList:[]};
            // var getActiveToken = function(){
            //     var name = UserLS.getLastLive();
            //     //console.log(name)
            //     var getAll= function(){
            //         //console.log(localStorage)    
            //         var ret = {};
            //         if(!localStorage.getItem('s2g_tokens')){
            //             ret = blankTokens;
            //             //console.log(JSON.stringify(ret))
            //             localStorage.setItem('s2g_tokens', JSON.stringify(ret));
            //         } else {
            //             //console.log(localStorage.getItem(this.key));
            //             //console.log(JSON.parse(localStorage.getItem(key)).userList);
            //             ret=JSON.parse(localStorage.getItem("s2g_tokens"));
            //         }
            //         return ret;
            //     }
            //     var ax = getAll();
            //     return ax[name];
            // }
            var tok = TokenService.getActiveToken();
            //var tok = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoidGltIn0.LmoK1Nr8uA4hrGr25L2AlKXs6U832Z_lE6JGznHJfFd'; //broken token should cause error
            //console.log(tok);
            config.headers = config.headers || {};
            if (tok) {
                    config.headers.Authorization = 'Bearer ' + tok
            }
            return config;
        },
        requestError: function(rejection) {
            return $q.reject(rejection);
        },
        /* Set Authentication.isAuthenticated to true if 200 received */
        response: function (response) {
            // if (response != null && response.status == 200 && this.getActiveToken() && !AuthenticationService.isAuthenticated) {
            //     AuthenticationService.isAuthenticated = true;
            // }
            return response || $q.when(response);
        },
        /* Revoke client authentication if 401 is received */
        responseError: function(rejection) {
            var tok = TokenService.getActiveToken();
            console.log(tok)
            if (tok) {
                console.log(rejection)
                if (rejection != null && rejection.status === 401) {
                    TokenService.deleteActiveToken();
                    //$state.go('register');
                }else{
                    console.log('server is offline, proceed anyway')
                    UserLS.setServerOnline(false);
                    return true
                }
            }
            return $q.reject(rejection);               
        }
    };
}]);

stuffAppServices.factory('TokenService', ['$q', 'UserLS', function ($q, UserLS) {
    var key = 's2g_tokens';
    var blankTokens= {userList:[]};
    return { 
        key: key,
        blankTokens: blankTokens,
        getAll: function(){
            //console.log(localStorage)    
            var ret = {};
            if(!localStorage.getItem(this.key)){
                ret = this.blankTokens;
                //console.log(JSON.stringify(ret))
                localStorage.setItem(this.key, JSON.stringify(ret));
            } else {
                //console.log(localStorage.getItem(this.key));
                //console.log(JSON.parse(localStorage.getItem(key)).userList);
                ret=JSON.parse(localStorage.getItem(this.key));
            }
            return ret;
        },
        setToken: function(name, token){
            var al = this.getAll();
            //console.log(user.name)
            al.userList.push(name)
            al.userList = _.uniq(al.userList)
            al[name]=token 
            localStorage.setItem(this.key, JSON.stringify(al));
            return al
        },  
        getToken: function(name){
            var al =this.getAll();
            return al[name];            
        },
        getActiveToken: function(){
            var name = UserLS.getLastLive();
            //console.log(name)
            return this.getToken(name);
        },
        tokenExists: function(){
            var name = UserLS.getLastLive();
            //console.log(name==undefined)
            if (typeof name != 'undefined'){
                //console.log('damn stil here')
                var al =this.getAll();
                if (al.userList.indexOf(name) >   -1){
                    return true;
                }
                return false                 
            }   
            return false; 
        },
        delUserToken: function(name){
            var al = this.getAll();
            var idx = al.userList.indexOf(name);
            if (idx > -1){
                al.userList.splice(idx, 1);
            }
            delete al[name]
            console.log(al);
            localStorage.setItem(this.key, JSON.stringify(al));
        },
        deleteActiveToken: function(){
            var name = UserLS.getLastLive();
            this.delUserToken(name);
        }
    };
}]);