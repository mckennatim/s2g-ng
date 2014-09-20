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


stuffAppServices.factory( 'ListService', ['$q', '$http', '$log', 'DbService', 'UserLS', '$rootScope', function($q, $http, $log, DbService, UserLS, $rootScope){
    var key = 's2g_lists';
    var blankLists = {};
    return{ 
        getClist: function(listInfo){
            var key = 's2g_clists';
            var al=JSON.parse(localStorage.getItem(key)) || {};
            var user = UserLS.activeUser();
            var list={}
            if(!al[listInfo.lid]){
                list = {lid: listInfo.lid, shops: listInfo.shops, timestamp: 0, items: [], users: [user]}
                al[list.lid]=list;
                localStorage.setItem(key, JSON.stringify(al));
            }else{
                list=al[listInfo.lid]
            }
            return list
        },   
        setClist: function(list){
            var key = 's2g_clists'
            var al=JSON.parse(localStorage.getItem(key)) || {};
            al[list.lid]=list;
            localStorage.setItem(key, JSON.stringify(al));
        },
        getPlist: function(listInfo){
            var key = 's2g_plists';
            var al=JSON.parse(localStorage.getItem(key)) || {};
            var user = UserLS.activeUser();
            var list= al[listInfo.lid]
            if(!list){
                list = {lid: listInfo.lid, shops: listInfo.shops, timestamp: 0, items: [], users: [user]}
                al[list.lid]=list;
                localStorage.setItem(key, JSON.stringify(al));
            }
            return list;
        },   
        setPlist: function(list){
            var key = 's2g_plists'
            var al=JSON.parse(localStorage.getItem(key)) || {};
            al[list.lid]=list;
            localStorage.setItem(key, JSON.stringify(al));
        }, 
        updList: function(list){
            var deferred =$q.defer();
            this.setClist(list)
            var instance =this;
            var listInfo = {lid: list.lid, shops: list.shops}
            console.log('in updList, $rootScope.online: ' +$rootScope.online)
            if(!$rootScope.online){
                deferred.resolve(list)
            }else{  
                var c, p, s, cts, sts, pts,updItems;
                c = list;
                cts = c.timestamp;
                //console.log(JSON.stringify(c))
                p = this.getPlist(listInfo);
                pts = p.timestamp;
                var url=httpLoc + 'lists/'+listInfo.lid; 
                $http.get(url).   
                    success(function(data, status) {
                        console.log('GET list from server: '+status)
                        s=data;
                        sts = s.timestamp
                        if (sts > pts){ //if server has been updated since prior LS
                            console.log('merging')
                            updItems=instance.merge(p.items, c.items, s.items);
                        } else {
                            console.log('just sending c ')
                            updItems=c.items;
                        }     
                        p.items = updItems;
                        p.timestamp = cts;
                        instance.setPlist(p);
                        $http.put(url, {timestamp:cts, items: updItems}).
                            success(function(data, status) {
                                console.log('PUT updated list on server: ' +status)
                            }).                
                            error(function(data, status){
                                console.log(status)
                            });
                         deferred.resolve(p);                                                                      
                    }).
                    error(function(data, status){
                        deferred.reject(data)
                    });
            }
            return deferred.promise
        },       
        getDefault: function(){
            var name = UserLS.activeUser();
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
            console.log('in ListService.getLS')
            var ax, lid, shops, list;
            ax = this.getAll();
            lid = listInfo.lid;
            shops = listInfo.shops;
            list = ax[lid];
            if (! list){
                list = {lid: lid, shops: shops, timestamp: 0, items: [], users: []}
                this.putLS(list);
            };            
            return list;
        },
        putLS: function(list){
            console.log('in putLS')
            var ax = this.getAll();
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
        // ckIfOnline: function(){
        //     console.log('in ListsService.ckifOnline')
        //     var s;
        //     var deferred = $q.defer();
        //     $http.get(httpLoc).   
        //         success(function(data, status) {
        //             if(status==200){
        //                 $rootScope.online=true;
        //                 UserLS.setServerOnline(true);
        //                 s=data
        //                 deferred.resolve(data)
        //             }else{
        //                 $rootScope.online=false;
        //                 UserLS.setServerOnline(false);
        //                 s= data
        //                 deferred.reject(data)                        
        //             }
        //             console.log('setServerOnline to tf') 
        //             s=deferred.promise;
        //             return s;                      
        //         }).
        //         error(function(data, status){
        //             $rootScope.online=false;
        //             UserLS.setServerOnline(false);
        //             console.log('checking if online, error')
        //             console.log(UserLS.serverIsOnline())
        //             s=data
        //             deferred.reject(data)
        //         }); 
        //         s=deferred.promise;
        //         return s;                          
        // },
        update: function(list){            
            console.log('in update')
            var c, p, s, updItems, cts, pts, sts, deferred, lid;
            console.log('serverIsOnline: '+$rootScope.online);
            var instance =this;
            lid = list.lid
            c = list;
            cts=Date.now();
            if (!c.items){
                c.timestamp=0;
            }else{
                c.timestamp = cts;
            }            
            //console.log(JSON.stringify(c.items))
            cts = Date.now();
            p = this.getLS(list);
            //console.log(c)
            pts = p.timestamp;
            deferred = $q.defer();
            if($rootScope.online){
                var url=httpLoc + 'lists/'+lid; 
                $http.get(url).   
                    success(function(data, status) {
                        if(!$rootScope.online){
                            console.log('no connection, shouldnt be here');
                            instance.putLS(c);
                            deferred.resolve(c);
                            return
                        }
                        console.log('connection exists')
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
                if (list.items.length==0){
                    list.timestamp=0
                }else{
                    list.timestamp = cts;
                }
                instance.putLS(list);
                list = deferred.promise; 
                return list
            }
        },
        addList: function(shops){
            var s;
            var url=httpLoc + 'lists/' + shops ;
            var deferred = $q.defer();
            $http.post(url).
                success(function(data,status){
                    s=data
                    console.log(data)
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
                    console.log(data)
                    this.putLS(data)
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
        activeUser: function(){
            var al=this.getAll();
            return al.activeUser;
        },
        setActiveUser: function(username){
            var al=this.getAll();
            al.activeUser=username;
            localStorage.setItem(this.key, JSON.stringify(al));
        },
        serverOnline: serverOnline,
        setServerOnline: function(tf){
            serverOnline = tf;
            console.log('serverIsOnline: '+serverOnline)
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
        // setLastLive: function(name){
        //     var ret = this.getAll();
        //     console.log(ret.userList.indexOf(name))
        //     var idx = ret.userList.indexOf(name)
        //     ret.lastLive=idx;
        //     localStorage.setItem(this.key, JSON.stringify(ret));
        //     return idx;
        // },
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
            var usr = al.activeUser
            var ret= al[usr].lists;
            return ret;
        },
        getDefaultList : function(){
            var al = this.getAll();
            var usr =al.activeUser
            var lists= usr.lists;
            var def = usr.defaultList;
            var ret = lists[def];
            //console.log(usr);
            return ret;
        },
        getDefaultListInfo: function(){
            var al = this.getAll();
            var usr = al.activeUser
            var lists= al[usr].lists;
            var lid = al[usr].defaultLid;

            var res  = lists.filter(function(obj){
                return obj.lid==lid;
            })
            return res[0];
        },
        // getDefaultListIdx: function(){
        //     var al = this.getAll();
        //     return al[al.userList[al.activeUser]].defaultList
        // },
        // setDefaultList: function(idx){
        //     var al = this.getAll();
        //     al[al.userList[al.activeUser]].defaultList= idx
        //     localStorage.setItem(this.key, JSON.stringify(al));
        // },
        setDefaultLid: function(listInfo){
            var al = this.getAll();
            al[al.activeUser].defaultLid= listInfo.lid
            localStorage.setItem(this.key, JSON.stringify(al));
        },        
        pushList: function(list){
            var al = this.getAll();
            al[al.userList[al.activeUser]].lists.push(list)
            localStorage.setItem(this.key, JSON.stringify(al));
        },
        updLists: function(lists){
            var al = this.getAll();
            al[al.activeUser].lists=lists
            localStorage.setItem(this.key, JSON.stringify(al));
        },
        updList: function(list){
            var al = this.getAll();
            var lid = list.lid;
            var oldRem = al[al.userList[al.activeUser]].lists.filter(function(e){return e.lid !==list.lid});
            oldRem.push(list)
            al[al.userList[al.activeUser]].lists=oldRem;
            localStorage.setItem(this.key, JSON.stringify(al));
            return oldRem;
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
            al.activeUser = user.name
            al.regState = regState //'Enter apikey', 'Register' or 'Authenticated or Get token'
            al[user.name]=user 
            localStorage.setItem(this.key, JSON.stringify(al));
            return al
        },
        numUsers: function(){
            var bl = this.getAll();
            //console.log(bl)
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
        },
        getUsers: function(){
            var al = this.getAll();
            return al.userList;
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
        ckIfOnline: function(){
            var deferred =$q.defer()
            $http.get(httpLoc).
                success(function(data,status){
                    deferred.resolve(status);
                }).
                error(function(data,status){
                    deferred.reject(status);
                }); 
            return deferred.promise;                         
        },          
        updateUser: function(){ 
            var uname = UserLS.activeUser()
            var url=httpLoc + 'users/'+uname;      
            var deferred = $q.defer();
            $http.get(url, {withCredentials:true}).   
                success(function(data, status) {
                    if(data != undefined && status==200){
                        //console.log(data)
                        UserLS.postUser(data, 'Authenticated');                      
                    };
                    //console.log(status);
                    deferred.resolve(data);
                }).
                error(function(data, status){
                    console.log(data || "Request failed");
                    console.log(status);
                    deferred.reject({message: 'server is down'})
                });
            return deferred.promise;
        },
        putUser: function(stuff){
            var uname = UserLS.activeUser()
            var url=httpLoc + 'users/'+uname;    
            var deferred = $q.defer();
            $http.put(url, stuff ).   
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
            //     var name = UserLS.activeUser();
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
            //console.log('token is undefineserver is offline')
            //UserLS.setServerOnline(false);            
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
            var name = UserLS.activeUser();
            //console.log(name)
            return this.getToken(name);
        },
        tokenExists: function(){
            var name = UserLS.activeUser();
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
            //console.log(al);
            localStorage.setItem(this.key, JSON.stringify(al));
        },
        deleteActiveToken: function(){
            var name = UserLS.activeUser();
            this.delUserToken(name);
        }
    };
}]);

stuffAppServices.factory('OnlineInterceptor', function($rootScope, $q){
        var Interceptor ={
            responseError: function(response){
                $rootScope.status = response.status;
                $rootScope.online = false;
                //console.log('inter error ' +$rootScope.online +response.status)
                return $q.when(response);
            },
            response: function(response){
                $rootScope.status = response.status;
                $rootScope.online = true;
                //console.log('inter resp '+$rootScope.online+ response.status)
                return $q.when(response);           
            }
        };
        return Interceptor;
})


stuffAppServices.factory('Lists', function(){
    var lal = JSON.parse(localStorage.getItem('s2g_clists'));
    return{ 
        lal: lal,
        makeDefLid: function(lid){
            console.log(lid)
            lal.activeList = lid;
            localStorage.setItem('s2g_clists', JSON.stringify(lal));
        },
        reset: function(){
            localStorage.setItem('s2g_clists', JSON.stringify(lists));
        },
        saveLists: function(){
            localStorage.setItem('s2g_clists', JSON.stringify(lal));
            var newLal = JSON.parse(localStorage.getItem('s2g_clists'));
            angular.copy(newLal, lal);
        }
    }   
})

stuffAppServices.factory('Users', function(Lists){
    var al = JSON.parse(localStorage.getItem('s2g_users'))
    return{
        al:al,
        makeDefLid: function(lid){
            console.log(lid)
            al[al.activeUser].defaultLid = lid;
            localStorage.setItem('s2g_users', JSON.stringify(al));
            Lists.makeDefLid(lid);
        },
        makeActive: function(name){
            al.activeUser=name;
            Lists.makeDefLid(al[al.activeUser].defaultLid)
            localStorage.setItem('s2g_users', JSON.stringify(al)); 
        },
        reset: function(){
            localStorage.setItem('s2g_users', JSON.stringify(users));
        },

   }
})

var tokens = {"userList":["tim","tim7"],"tim":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoidGltIn0.LmoK1Nr8uA4hrGr25L2AlKXs6U832Z_lE6JGznHJfFs","tim7":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoidGltNyJ9.puFMhr9kjiRfyRzlYDLdD7rOveQO5KgR6TkDqLmMYk0"}

var users = {"activeUser":"tim7","regState":"Authenticated","regMessage":"all set you are authorized and have token","userList":["tim","tim7"],"tim":{"_id":"5409c803d7a626d671297331","apikey":"Natacitipavuwunexelisaci","defaultLid":"Kidoju","defaultList":2,"email":"mckenna.tim@gmail.com","id":1,"lists":[{"lid":"Tamaki","shops":"down center"},{"lid":"Jutebi","shops":"groceries"},{"lid":"Kidoju","shops":"hardware"}],"name":"tim","role":"admin","timestamp":1409936908725},"tim7":{"_id":"5409ee0cc4cd771572c29335","apikey":"Qemavohegoburuxosuqujoga","defaultList":1,"email":"tim@sitebuilt.net","id":5,"lists":[{"lid":"Jutebi","shops":"groceries"},{"lid":"Woduvu","shops":"drugs"}],"name":"tim7","role":"user","timestamp":1410027284251,"defaultLid":"Jutebi"},"lastLive":0}

var lists = {
  "activeList": "Jutebi",       
  "Jutebi": {
    "lid": "Jutebi",
    "shops": "groceries",
    "timestamp": 1410019842776,
    "items": [
      {
        "product": "butter",
        "done": false,
        "tags": [],
        "amt": {
          "qty": ""
        }
      },
      {
        "product": "coffee",
        "done": false,
        "tags": [],
        "amt": {
          "qty": ""
        }
      },
      {
        "product": "milk",
        "done": false,
        "tags": [
          "orgainic",
          "dairy"
        ],
        "amt": {
          "qty": "",
          "unit": "1/2 gal"
        }
      },
      {
        "product": "frog legs",
        "done": false,
        "amt": {
          "qty": ""
        }
      },
      {
        "product": "apples",
        "done": false,
        "tags": [
          "produce"
        ],
        "amt": {
          "qty": "",
          "unit": "3lb bag"
        }
      },
      {
        "product": "seltzer",
        "done": true,
        "amt": {
          "qty": ""
        }
      },
      {
        "product": "banana",
        "done": true,
        "tags": [],
        "amt": {
          "qty": ""
        }
      },
      {
        "product": "cat food",
        "done": true,
        "amt": {
          "qty": ""
        }
      },
      {
        "product": "teff flour",
        "done": true,
        "tags": [],
        "amt": {}
      }
    ],
    "stores": [
      {
        "id": "s_Bereti",
        "name": "Stop&Shop"
      }
    ],
    "users": [
      "tim"
    ]
  },
  "Guvupa": {
    "lid": "Guvupa",
    "shops": "groceries",
    "timestamp": 1395763172175,
    "items": [],
    "users": []
  },
  "Kidoju": {
    "lid": "Kidoju",
    "shops": "hardware",
    "timestamp": 1409966611033,
    "items": [
      {
        "product": "12-2",
        "done": false
      },
      {
        "product": "pipe hangers",
        "done": true,
        "amt": {
          "qty": ""
        }
      },
      {
        "product": "fuzz balls",
        "done": true,
        "tags": [],
        "amt": {}
      }
    ],
    "users": [
      "tim7",
      "tim"
    ]
  },
  "Woduvu": {
    "lid": "Woduvu",
    "shops": "drugs",
    "timestamp": 1395763172175,
    "items": [
      {
        "product": "dental floss",
        "done": true,
        "amt": {
          "qty": ""
        }
      },
      {
        "product": "hydrogen peroxide",
        "done": true,
        "tags": [],
        "amt": {}
      }        
    ],
    "users": []
  },
  "Tamaki": {
    "lid": "Tamaki",
    "shops": "down center",
    "timestamp": 1410011606582,
    "items": [
      {
        "product": "coffee",
        "done": false
      }
    ],
    "users": [
      "tim"
    ]
  }
}









var dog = {"Jutebi":{"lid":"Jutebi","shops":"groceries","timestamp":1410019842776,"items":[{"product":"butter","done":false,"tags":[],"amt":{"qty":""}},{"product":"coffee","done":false,"tags":[],"amt":{"qty":""}},{"product":"milk","done":false,"tags":["orgainic","dairy"],"amt":{"qty":"","unit":"1/2 gal"}},{"product":"frog legs","done":false,"amt":{"qty":""}},{"product":"apples","done":false,"tags":["produce"],"amt":{"qty":"","unit":"3lb bag"}},{"product":"seltzer","done":true,"amt":{"qty":""}},{"product":"banana","done":true,"tags":[],"amt":{"qty":""}},{"product":"cat food","done":true,"amt":{"qty":""}},{"product":"teff flour","done":true,"tags":[],"amt":{}}],"stores":[{"id":"s_Bereti","name":"Stop&Shop"}],"users":["tim"]},"Guvupa":{"lid":"Guvupa","shops":"groceries","timestamp":1395763172175,"items":[],"users":[]},"Kidoju":{"lid":"Kidoju","shops":"hardware","timestamp":1409966611033,"items":[{"product":"12-2","done":false},{"product":"pipe hangers","done":true,"amt":{"qty":""}},{"product":"fuzz balls","done":true,"tags":[],"amt":{}}],"users":["tim7","tim"]},"Woduvu":{"lid":"Woduvu","shops":"drugs","timestamp":1395763172175,"items":[],"users":[]},"Tamaki":{"lid":"Tamaki","shops":"down center","timestamp":1410011606582,"items":[{"product":"coffee","done":false}],"users":["tim"]}}

