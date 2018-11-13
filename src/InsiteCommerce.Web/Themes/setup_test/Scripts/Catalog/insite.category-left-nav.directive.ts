module insite.catalog {
    "use strict";

    angular
        .module("insite")
        .directive("iscCategoryLeftNav", () => ({
            restrict: "E",
            replace: true,
            scope: {
                products: "=",
                breadCrumbs: "=",
                attributeValueIds: "=",
                filterCategory: "=",
                priceFilterMinimums: "=",
                searchWithinTerms: "=",
                category: "="
            },
            templateUrl: "productList_categoryLeftNav",
            controller: "CategoryLeftNavController",
            controllerAs: "vm",
            bindToController: true
        }));
}