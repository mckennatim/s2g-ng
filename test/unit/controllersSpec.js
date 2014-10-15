
'use strict';

/* jasmine specs for controllers go here */

describe('stuffAppControllers', function(){
	var scope, ctrl;
	beforeEach(module('stuffAppControllers'));
	describe('UserCtrl', function(){
		beforeEach(inject(function($rootScope, $controller){
			scope = $rootScope.$new();
			var dbService = {updateUser: function(){}};
			var tokenService ={tokenExists: function(){}};
			var users = {al: {activeUser: 'tim'}};
			var lists ={}
			ctrl = $controller("UserCtrl", {'$scope': scope, DbService: dbService, TokenService: tokenService, Users: users, Lists: lists });
		}));
		it('should have scope.active thats tim', function(){
			console.log(scope,active)
			expect(scope.active).toBe('tim');        
		});
	});
});


