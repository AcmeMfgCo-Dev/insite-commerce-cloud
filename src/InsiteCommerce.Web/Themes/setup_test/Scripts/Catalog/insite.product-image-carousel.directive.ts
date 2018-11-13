module insite.catalog {
    "use strict";

    angular
        .module("insite")
        .directive("iscProductImageCarousel", () => ({
            restrict: "E",
            replace: true,
            scope: {
                productImages: "=",
                selectedImage: "=",
                prefix: "@",
                maxTries: "@",
                getCarouselWidth: "&"
            },
            templateUrl: "/PartialViews/Catalog-ProductImageCarousel",
            controller: "ProductImageCarouselController",
            controllerAs: "vm",
            bindToController: true
        }));
}