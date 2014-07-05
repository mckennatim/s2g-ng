'use strict';
/* jasmine specs for services go here */

describe('service', function() {
    beforeEach(module('stuffAppServices'));
    describe('ItemsData', function() {
        it('should get first product on list', inject(function(ItemsData) {
            var tlist = ItemsData.get();
            console.log(tlist);
            var item1= tlist[0].product;
            expect(item1).toEqual('banana');
        }));
    });
});
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
    it('is {lastlive:0,"regState":"Register", userlist:[]} when LS is empty}', inject(function(UserLS){
        var uli = UserLS.getAll();
        //console.log(store['s2g_users']); 
        expect(uli.userList.length).toEqual(0);
        expect(JSON.stringify(uli)).toBe(JSON.stringify({lastLive:0,"regState":"Register", userList:[]})); 
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
});




