'use strict';

app
.directive('buttonCollapse', function() {
    return {
        // Restrict it to be an attribute in this case
        restrict: 'C',
        // responsible for registering DOM listeners as well as updating the DOM
        link: function(scope, element, attrs) {
            $(element).sideNav();
        }
    };
}).directive('modalTrigger', function() {
    return {
        // Restrict it to be an attribute in this case
        restrict: 'C',
        // responsible for registering DOM listeners as well as updating the DOM
        link: function(scope, element, attrs) {
            $(element).leanModal();
        }
    };
});
