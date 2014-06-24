'use strict';

/* jasmine specs for controllers go here */
describe('stuffApp', function(){
  describe('stuffApp stuffAppControllers', function(){
    beforeEach(module('stuffAppControllers'));
    describe('UserCtrl', function(){
      it('should have a dog scope thats petey', inject(function($rootScope, $controller){
        var scope = $rootScope.$new();
        var ctrl = $controller("UserCtrl", {$scope: scope });
        expect(scope.dog).toBe('petey');        
      }));
    });
    describe('IsregCtrl', function() {
      var ctrl, UserLS, $scope, $state;
      //beforeEach(module('stuffApp'));    
      beforeEach(inject(function($rootScope, $controller) {
        UserLS = {
          numUsers: function(key) {}
        };      
        spyOn(UserLS, 'numUsers').andReturn("2");      
        $scope = $rootScope.$new();      
        ctrl = $controller('IsregCtrl', {$scope: $scope , $state: $state, UserLS: UserLS });
      }));    
      it('Should call UserLS numUsers and get 2', function() {
        expect($scope.numUsers).toBe('2');
      });
    });
  });
});

