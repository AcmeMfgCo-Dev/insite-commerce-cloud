module insite.catalog {
    "use strict";

    angular
        .module("insite")
        .directive("iscProductImages", () => ({
            restrict: "E",
            replace: true,
            scope: {
                product: "="
            },
            templateUrl: "/PartialViews/Catalog-ProductImages",
            controller: "ProductImagesController",
            controllerAs: "vm",
            bindToController: true
        }));
}