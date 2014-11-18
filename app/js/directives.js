'use strict';

/* Directives */


var stuffAppDirectives = angular.module('stuffAppDirectives', []);




 stuffAppDirectives.directive('itemEscape', function () {
		'use strict';
		var ESCAPE_KEY = 27;
		return function (scope, elem, attrs) {
			elem.bind('keydown', function (event) {
				if (event.keyCode === ESCAPE_KEY) {
					scope.$apply(attrs.itemEscape);
				}
			});
		};
	});
