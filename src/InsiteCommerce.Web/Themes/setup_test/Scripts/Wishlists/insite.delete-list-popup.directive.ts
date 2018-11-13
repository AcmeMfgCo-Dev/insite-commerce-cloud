module insite.wishlist {
    "use strict";

    angular
        .module("insite")
        .directive("iscDeleteListPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-DeleteListPopup",
            scope: {
                list: "=",
                deleteList: "&",
                closeModal: "&",
                redirectToUrl: "@"
            }
        }));
}