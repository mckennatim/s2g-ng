'use strict';

/* jasmine specs for directives go here */

describe('directives', function() {
  beforeEach(module('stuffAppDirectives'));

  describe('app-version', function() {
    it('should print current version', function() {
      module(function($provide) {
        $provide.value('version', 'TEST_VER');
      });
      inject(function($compile, $rootScope) {
        var element = $compile('<span app-version></span>')($rootScope);
        console.log(element);
        expect(element.text()).toEqual('TEST_VER');
      });
    });
  });
});
