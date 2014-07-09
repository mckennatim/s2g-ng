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
        var blankUsers= {lastLive:0, regState: 'Register', userList:[]};
        var getAll=function(){
        var ret = {};
        if(!localStorage.getItem(key)){
                ret = blankUsers;
                localStorage.setItem(key, JSON.stringify(ret));
        } else {
                ret=JSON.parse(localStorage.getItem(key));
        }
        return ret;    
        console.log(getAll())
    }
    var users = getAll();
    return {
        key: key,
        blankUsers: blankUsers,
        blankUser: {name: '', email: '', lists:[], role:'', timestamp: 1, apikey: ''},
        currentUser: this.blankUser,
        getLastLive: function(){
            var users =   this.getAll();
            console.log( users);
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
            //console.log(localStorage)    
            var ret = {};
            if(!localStorage.getItem(this.key)){
                ret = this.blankUsers;
                //console.log(JSON.stringify(ret))
                localStorage.setItem(this.key, JSON.stringify(ret));
            } else {
                //console.log(localStorage.getItem(this.key));
                //console.log(JSON.parse(localStorage.getItem(key)).userList);
                ret=JSON.parse(localStorage.getItem(this.key));
            }
            return ret;
        },
        users: users,
        setRegState: function(st){
            var ret = this.getAll();
            ret.regState = st;
            localStorage.setItem(this.key, JSON.stringify(ret));
        },
        getRegState: function(){
            var ret = this.getAll();
            return ret.regState;
        },
        getUser: function (user) {   
            var ret = this.getAll()
            return ret[user];
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
            al.regState = regState //'Enter apikey', 'Register' or 'Authenticated'
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
            localStorage.setItem(this.key, JSON.stringify(ulist));
            return ulist;
        }
    }
});
stuffAppServices.factory('AuthService', function($http, $q) {
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
                    deferred.reject({message: 'server is down'})
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
});
stuffAppServices.factory('ListService', function($http, $q) {
    return {
        aList: function(list) {
            var url=httpLoc + 'lists/'+list;      
            var deferred = $q.defer();
            $http.get(url, {withCredentials:true}).   
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
});
stuffAppServices.factory('TokenInterceptor', function ($q, $state, AuthService, UserLS) {
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
            return this.getToken(name);
        },
        tokenExists: function(){
            var name = UserLS.getLastLive();
            var al =this.getAll();
            if (al.userList.indexOf(name) >   -1){
                return true;
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
        },
        request: function (config) {
            var tok = this.getActiveToken();
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
            if (rejection != null && rejection.status === 401) {
                this.deleteActiveToken();
                $state.go('register');
            }
            return $q.reject(rejection);
        }
    };
});