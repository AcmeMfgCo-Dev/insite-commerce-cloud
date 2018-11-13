var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        angular
            .module("insite")
            .directive("iscDeleteListPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-DeleteListPopup",
            scope: {
                list: "=",
                deleteList: "&",
                closeModal: "&",
                redirectToUrl: "@"
            }
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.delete-list-popup.directive.js.map