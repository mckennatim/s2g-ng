'use strict';
/* jasmine specs for services go here */
var s2g_users={"lastLive":0,"regState":"Authenticated","userList":["tim"],"tim":{"name":"tim","email":"mckenna.tim@gmail.com","lists":[],"role":"","timestamp":1,"apikey":"Natacitipavuwunexelisaci"}};

describe('UserLS', function(){  
    var store= {};
    beforeEach(function() {
        module('stuffAppServices');
        // LocalStorage mock.
        var key = 's2g_users';
        spyOn(localStorage, 'getItem').andCallFake(function(key) {
                return store[key];
        });
        Object.defineProperty(sessionStorage, "setItem", { writable: true });
        spyOn(localStorage, 'setItem').andCallFake(function(key, value) {
                store[key] = value;
        });
    });
    it('is {lastlive:0,"regState":"Register", regMessage: "" , userlist:[]} when LS is empty}', inject(function(UserLS){
        var uli = UserLS.getAll();
        //console.log(store['s2g_users']); 
        expect(uli.userList.length).toEqual(0);
        expect(JSON.stringify(uli)).toBe(JSON.stringify({lastLive:0,"regState":"Register", "regMessage": "" , userList:[]})); 
    }));
    it('does not getUSER if not there', inject(function(UserLS){
        var uli = UserLS.getUser('tim');
        //console.log(uli)
        expect(uli).toBe(undefined)   
    }));
    it('counts the number of users to be 0', inject(function(UserLS){
        var uli = UserLS.numUsers();
        expect(uli).toBe(0)    
    }));   
    it('has a user named Tim if LS is full', inject(function(UserLS){ 
        var s2g_users ='{"lastLive":0,"userList":["tim","tim2"],"tim":{"name":"tim","email":"mckenna.tim@gmail.com","lists":[],"role":"admin","timestamp":1399208688,"apikey":"Natacitipavuwunexelisaci"},"tim2":{"name":"tim2","email":"mckt_jp@yahoo.com","lists":[],"role":"user","timestamp":1399208688,"apikiey":"Sobeqosevewacokejufozeki"}}';

        store = {storevars:['s2g_users','s2g_lists'], s2g_users: s2g_users};
        //console.log(store.s2g_users);

        /*
        {lastLive:0, userList:['tim','tim2'],
        tim: {name: 'tim', email: 'mckenna.tim@gmail.com', lists:[], role:'admin', timestamp:1399208688, apikey:'Natacitipavuwunexelisaci'}, 
        tim2: {name: 'tim2', email: 'mckt_jp@yahoo.com', lists:[], role:'user', timestamp:1399208688, apikiey: 'Sobeqosevewacokejufozeki'}}};
        */
        var uli = UserLS.getAll();
        //console.log(uli)
        expect(uli.tim.name).toBe('tim');
    }));
    it('get(s)User record for tim', inject(function(UserLS){
        var uli = UserLS.getUser('tim');
        //console.log(uli)
        expect(uli.email).toBe('mckenna.tim@gmail.com')
    }));
    it('post(s)User with apikey updated to donaldduck and updates userlist', inject(function(UserLS){
        var newtim = JSON.parse(store.s2g_users).tim;
        newtim.apikey='donaldduck'
        //console.log(newtim)
        var uli = UserLS.postUser(newtim);
        //console.log(uli)
        expect(uli.tim.apikey).toBe('donaldduck')
    }));
    it('counts the number of users to be 2', inject(function(UserLS){
        var uli = UserLS.numUsers();
        expect(uli).toBe(2)    
    }));
    it('get(s)lastLive as  tim', inject(function(UserLS){
        var uli = UserLS.getLastLive();
        //console.log(uli)
        expect(uli).toBe('tim')
    }));    
    it('set(s)lastLive as  tim2', inject(function(UserLS){
        UserLS.setLastLive('tim2');
        var uli = UserLS.getLastLive();
        //console.log(uli)
        expect(uli).toBe('tim2')
    }));  
});
describe('TokenService', function(){
    var UserLS; 
    var s2g_tokens = '{"userList":["tim2","tim"],"tim2":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoidGltMiJ9.5cwoHp4JSLhsX3G4ZFhhYsb9U_MHWHnGfDYEV8yhvNk","tim":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoidGltMiJ9.5cwoHp4JSLhsX3G4ZFhhYsb9U_MHWHnGfDYEV8yhvNk"}';
    var tokentim2 ='eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoidGltMiJ9.5cwoHp4JSLhsX3G4ZFhhYsb9U_MHWHnGfDYEV8yhvNk';
    var store= {};
    store = {storevars:['s2g_users','s2g_lists', 's2g_tokens'], s2g_tokens: s2g_tokens};
    beforeEach(function() {
        module('stuffAppServices');
        // LocalStorage mock.
        var key = 's2g_tokens';
        spyOn(localStorage, 'getItem').andCallFake(function(key) {
                return store[key];
        });
        Object.defineProperty(sessionStorage, "setItem", { writable: true });
        spyOn(localStorage, 'setItem').andCallFake(function(key, value) {
                store[key] = value;
        });
    });
    beforeEach(module(function ($provide) {
        $provide.value('UserLS', {
            getLastLive: function(){
                return 'tim2';
            }
        });
    })); 
    beforeEach(inject(function($injector) {
        UserLS = $injector.get('TokenService');
    })); 
    it('gets token for user tim', inject(function(TokenService){
        var tok = TokenService.getToken('tim');
        expect(tok.length).toBe(101);
    }));
    it('getall() ', inject(function(TokenService){
        var tok = TokenService.getAll();
        expect(tok.userList[0]).toBe('tim2');
    }));
    it('getToken(tim2) ', inject(function(TokenService){
        var tok = TokenService.getToken('tim2');
        expect(tok.length).toBe(101);
    }));    
    it('getActiveToken() ', inject(function(TokenService){
        var tok = TokenService.getActiveToken();
        expect(tok.length).toBe(101);
    })); 
    it('set(s)Token(fred, token)', inject(function(TokenService){
        var name = 'fred';
        var token ='ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
        TokenService.setToken(name,token);
        var tok = TokenService.getAll();
        console.log(tok.userList)
        expect(tok.userList.length).toBe(3);
    })); 
    it('sees if token exists', inject(function(TokenService){
        var tf = TokenService.tokenExists();
        expect(tf).toBe(true);
    }));
    it('deletes freds token', inject(function(TokenService){
        TokenService.delUserToken('fred');
        var tok = TokenService.getAll();
        console.log(tok.userList)
        expect(tok.userList.length).toBe(2);         
    }));
    it('deletes active token', inject(function(TokenService){
        TokenService.deleteActiveToken();
        var tok = TokenService.getAll();
        console.log(tok.userList)
        expect(tok.userList.length).toBe(1);     
    }));
    it('re-set(s)Token(tim2, token)', inject(function(TokenService){
        TokenService.setToken('tim2',tokentim2);
        var tok = TokenService.getAll();
        console.log(tok.userList)
        expect(tok.userList.length).toBe(2);
    }));     
    it('adds header to request', inject(function(TokenInterceptor){
        var config = {};
        config = TokenInterceptor.request(config);
        console.log(config.headers);
        expect(config.headers.Authorization).toBeDefined();
    }));
    it('returns a response', inject(function(TokenInterceptor){
        var res = {status: 200};
        var response =  TokenInterceptor.response(res);
        console.log(response);
        expect(response.status).toBe(200);
    }));    
    it('deletes active token on response error', inject(function(TokenInterceptor, TokenService){
        var rej = {status: 401};
        var response =  TokenInterceptor.responseError(rej);
        var tok = TokenService.getAll();
        expect(tok.userList.length).toBe(1);        
        expect(response.then).toBeDefined();
    }));       
}) ;  


