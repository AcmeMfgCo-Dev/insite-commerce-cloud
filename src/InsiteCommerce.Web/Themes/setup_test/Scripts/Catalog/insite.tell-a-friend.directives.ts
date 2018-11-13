module insite.catalog {
    "use strict";

    angular
        .module("insite")
        .directive("iscTellAFriendPopup", () => ({
            restrict: "E",
            replace: true,
            scope: {
                product: "="
            },
            templateUrl: "productDetail_tellAFriend",
            controller: "TellAFriendController",
            controllerAs: "vm",
            bindToController: true
        }))
        .directive("iscTellAFriendField", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "productDetail_tellAFriendField",
            scope: {
                fieldLabel: "@",
                fieldName: "@",
                isRequired: "@",
                isEmail: "@",
                fieldValue: "="
            }
        }));
}