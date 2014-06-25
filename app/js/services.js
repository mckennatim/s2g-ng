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
  }
  var users = getAll();
  return {
    key: key,
    blankUsers: blankUsers,
    blankUser: {name: '', email: '', lists:[], role:'', timestamp: 1, apikey: ''},
    currentUser: this.blankUser,
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
    auth: function(apikey) {
      var url=httpLoc + 'authenticate/';
      var deferred = $q.defer();
      $http.post(url, {apikey:apikey}, {withCredentials:true}).   
        success(function(data, status) {
          //console.log(data);
          //console.log(status);
          deferred.resolve(data);
        }).
        error(function(data, status){
          //console.log(data || "Request failed");
          //console.log(status);
          deferred.reject({message: 'server is down'})
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
          console.log(status);
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
stuffAppServices.factory('TokenInterceptor', function ($q, $window, $location, AuthService) {
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
    request: function (config) {
      config.headers = config.headers || {};
      if ($window.sessionStorage.token) {
          config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
      }
      return config;
    },
    requestError: function(rejection) {
      return $q.reject(rejection);
    },
    /* Set Authentication.isAuthenticated to true if 200 received */
    response: function (response) {
      if (response != null && response.status == 200 && $window.sessionStorage.token && !AuthenticationService.isAuthenticated) {
        AuthenticationService.isAuthenticated = true;
      }
      return response || $q.when(response);
    },
    /* Revoke client authentication if 401 is received */
    responseError: function(rejection) {
      if (rejection != null && rejection.status === 401 && ($window.sessionStorage.token || AuthenticationService.isAuthenticated)) {
        delete $window.sessionStorage.token;
        AuthenticationService.isAuthenticated = false;
        $location.path("/admin/login");
      }
      return $q.reject(rejection);
    }
  };
});