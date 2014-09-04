/*
 * If we assume that the philosophy of a provider is only configuration then it makes more sense in most cases to test that "it" is configured. As the "it" in this case is the resulting service, using module to do the configuration and then inject to test that the configuration worked seems to make sense.
 * The trick to understanding these tests is to realize that the function passed to module() does not get called until inject() does it's thing. So assigning to a closure variable in the module initialization function ensures that the Provider is defined before control passes to the injected function. Then you're free to interact with the Provider's configuration interface. The technique is a little bit broken in that the Provider has already provided it's Service. But, if you can tolerate that limitation it works.
 * 
 * Most of this I learned from https://github.com/angular/angular.js/issues/2274
 *
 * There are multiple describe() suites and it() tests, just to help us trace what's going on.
 * Hopefully, that makes this spec a good learning tool.
 */

describe('httpProvider', function () {


    // describe('config: with module callback in beforeEach', function () {

    //     var httpProvider;

    //     beforeEach(module('stuffApp', function ($httpProvider) {
    //         console.log('BEGIN: module callback');
    //         httpProvider = $httpProvider;
    //         console.log('END: module callback');
    //     }));

    //     it('should show that beforeEach module callback is not executed when test does not need module', function () {
    //         console.log('BEGIN: it test - no module');
    //         expect(true).toBeTruthy();
    //         console.log('END: it test - no module');
    //     });

    //     it('should have added authTokenHttpInterceptor as http interceptor (inject calls module callback before run test)', inject(function () {
    //         console.log('BEGIN: it test');
    //         expect(httpProvider.interceptors).toContain('TokenInterceptor');
    //         console.log('END: it test');
    //     }));

    // });

    //     describe('config: do everything inside the test', function () {

    //         it('should be able to test provider with module inside it()', function () {
    //             console.log('BEGIN: it test: all-in-it');
    //             var httpProviderIt;
    //             module('stuffApp', function ($httpProvider) {
    //                 console.log('BEGIN: module callback');
    //                 httpProviderIt = $httpProvider;
    //                 console.log('END: module callback');
    //             });
    //             inject(function () {
    //                 console.log('BEGIN: it test - inject');
    //                 // Works inside inject()
    //                 expect(httpProviderIt.interceptors).toContain('TokenInterceptor');
    //                 console.log('END: it test - inject');
    //             });
    //             // Also works after/outside inject()
    //             expect(httpProviderIt.interceptors).toContain('TokenInterceptor');
    //             console.log('END: it test: all-in-it');
    //         });

    // });

});