var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        var CreateListPopupController = /** @class */ (function () {
            function CreateListPopupController($scope, $rootScope, wishListService, coreService) {
                this.$scope = $scope;
                this.$rootScope = $rootScope;
                this.wishListService = wishListService;
                this.coreService = coreService;
                this.init();
            }
            CreateListPopupController.prototype.init = function () {
                this.initListPopupEvents();
            };
            CreateListPopupController.prototype.closeModal = function () {
                this.coreService.closeModal("#popup-create-list");
            };
            CreateListPopupController.prototype.clearMessages = function () {
                this.errorMessage = "";
            };
            CreateListPopupController.prototype.initListPopupEvents = function () {
                var _this = this;
                var popup = angular.element("#popup-create-list");
                popup.on("closed", function () {
                    _this.clearMessages();
                    _this.listName = "";
                    _this.listDescription = "";
                    _this.listForm.$setPristine();
                    _this.listForm.$setUntouched();
                    _this.$scope.$apply();
                });
                popup.on("open", function () {
                    if (_this.list) {
                        _this.clearMessages();
                        _this.listName = _this.list.name;
                        _this.listDescription = _this.list.description;
                        _this.$scope.$apply();
                    }
                });
            };
            CreateListPopupController.prototype.validForm = function () {
                this.clearMessages();
                if (!this.listForm.$valid) {
                    return false;
                }
                return true;
            };
            CreateListPopupController.prototype.createWishList = function () {
                var _this = this;
                if (!this.validForm()) {
                    return;
                }
                this.wishListService.addWishList(this.listName, this.listDescription).then(function (wishList) { _this.addWishListCompleted(wishList); }, function (error) { _this.addWishListFailed(error); });
            };
            CreateListPopupController.prototype.addWishListCompleted = function (wishList) {
                this.closeModal();
                this.$rootScope.$broadcast("list-was-created", wishList);
            };
            CreateListPopupController.prototype.addWishListFailed = function (error) {
                if (error && error.message) {
                    this.errorMessage = error.message;
                }
            };
            CreateListPopupController.prototype.updateWishList = function () {
                var _this = this;
                if (!this.validForm()) {
                    return;
                }
                var list = {
                    name: this.listName,
                    description: this.listDescription,
                    uri: this.list.uri
                };
                this.wishListService.updateWishList(list).then(function (wishList) { _this.updateWishListCompleted(wishList); }, function (error) { _this.updateWishListFailed(error); });
            };
            CreateListPopupController.prototype.updateWishListCompleted = function (wishList) {
                this.closeModal();
                this.$rootScope.$broadcast("list-was-saved", wishList);
            };
            CreateListPopupController.prototype.updateWishListFailed = function (error) {
                if (error && error.message) {
                    this.errorMessage = error.message;
                }
            };
            CreateListPopupController.$inject = ["$scope", "$rootScope", "wishListService", "coreService"];
            return CreateListPopupController;
        }());
        wishlist.CreateListPopupController = CreateListPopupController;
        angular
            .module("insite")
            .controller("CreateListPopupController", CreateListPopupController)
            .directive("iscCreateListPopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-CreateListPopup",
            scope: {
                list: "="
            },
            controller: "CreateListPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.create-list-popup.controller.js.map