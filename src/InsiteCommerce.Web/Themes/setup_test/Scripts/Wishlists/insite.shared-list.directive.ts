module insite.wishlist {
    "use strict";

    angular
        .module("insite")
        .controller("SharedListController", SharedListController)
        .directive("iscSharedList", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-SharedList",
            scope: {
                list: "=",
                session: "=",
                listSettings: "="
            },
            controller: "SharedListController",
            controllerAs: "vm"
        }));
}