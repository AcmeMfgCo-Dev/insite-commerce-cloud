var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        var AddToWishlistPopupController = /** @class */ (function () {
            function AddToWishlistPopupController(wishListService, coreService, settingsService, addToWishlistPopupService, accessToken, sessionService) {
                this.wishListService = wishListService;
                this.coreService = coreService;
                this.settingsService = settingsService;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.accessToken = accessToken;
                this.sessionService = sessionService;
                this.init();
            }
            AddToWishlistPopupController.prototype.init = function () {
                var _this = this;
                this.productsToAdd = [];
                this.settingsService.getSettings().then(function (settings) { _this.getSettingsCompleted(settings); }, function (error) { _this.getSettingsFailed(error); });
            };
            AddToWishlistPopupController.prototype.getSettingsCompleted = function (settings) {
                var _this = this;
                this.allowMultipleWishLists = settings.wishListSettings.allowMultipleWishLists;
                this.sessionService.getSession().then(function (session) {
                    _this.isAuthenticated = session.isAuthenticated;
                    _this.isRememberedUser = session.rememberMe;
                    _this.isGuest = session.isGuest;
                    _this.addToWishlistPopupService.registerDisplayFunction(function (data) {
                        _this.productsToAdd = data;
                        _this.initialize();
                        _this.coreService.displayModal(angular.element("#popup-add-wishlist"));
                    });
                });
            };
            AddToWishlistPopupController.prototype.getSettingsFailed = function (error) {
            };
            AddToWishlistPopupController.prototype.initialize = function () {
                var _this = this;
                if (this.isAuthenticated || this.isRememberedUser) {
                    this.clearMessages();
                    this.newWishListName = "";
                    var pagination = { pageSize: 999 };
                    if (this.allowMultipleWishLists) {
                        this.wishListService.getWishLists(null, null, null, pagination).then(function (wishListCollection) { _this.getWishListCollectionCompleted(wishListCollection); }, function (error) { _this.getWishListCollectionFailed(error); });
                    }
                    else {
                        this.addWishList(this.newWishListName);
                    }
                }
            };
            AddToWishlistPopupController.prototype.getWishListCollectionCompleted = function (wishListCollection) {
                this.wishListCollection = wishListCollection.wishListCollection.filter(function (o) { return o.allowEdit || !o.isSharedList; });
            };
            AddToWishlistPopupController.prototype.getWishListCollectionFailed = function (error) {
                this.errorMessage = error.message;
            };
            AddToWishlistPopupController.prototype.clearMessages = function () {
                this.addToWishlistCompleted = false;
                this.errorMessage = "";
                this.showWishlistNameErrorMessage = false;
            };
            AddToWishlistPopupController.prototype.changeWishList = function () {
                this.newWishListName = "";
                this.clearMessages();
            };
            AddToWishlistPopupController.prototype.addWishList = function (wishListName) {
                var _this = this;
                this.addingToList = true;
                this.wishListService.addWishList(wishListName).then(function (newWishList) { _this.addWishListCompleted(newWishList); }, function (error) { _this.addWishListFailed(error); });
            };
            AddToWishlistPopupController.prototype.addWishListCompleted = function (newWishList) {
                this.addProductsToWishList(newWishList);
            };
            AddToWishlistPopupController.prototype.addWishListFailed = function (error) {
                this.addingToList = false;
                this.errorMessage = error.message;
            };
            AddToWishlistPopupController.prototype.addToWishList = function () {
                if (this.addingToList) {
                    return;
                }
                this.clearMessages();
                if (this.selectedWishList) {
                    this.addProductsToWishList(this.selectedWishList);
                }
                else {
                    if (this.newWishListName && this.newWishListName.trim().length > 0) {
                        this.addWishList(this.newWishListName);
                    }
                    else {
                        this.showWishlistNameErrorMessage = true;
                    }
                }
            };
            AddToWishlistPopupController.prototype.addProductsToWishList = function (wishList) {
                this.addingToList = true;
                if (this.productsToAdd.length === 1) {
                    this.addLineToWishList(wishList);
                }
                else {
                    this.addLineCollectionToWishList(wishList);
                }
            };
            AddToWishlistPopupController.prototype.addLineToWishList = function (wishList) {
                var _this = this;
                this.wishListService.addWishListLine(wishList, this.productsToAdd[0]).then(function (wishListLine) { _this.addWishListLineCompleted(wishListLine); }, function (error) { _this.addWishListLineFailed(error); });
            };
            AddToWishlistPopupController.prototype.addWishListLineCompleted = function (wishListLine) {
                this.addToWishlistCompleted = true;
                this.addingToList = false;
            };
            AddToWishlistPopupController.prototype.addWishListLineFailed = function (error) {
                this.addingToList = false;
                this.errorMessage = error.message;
            };
            AddToWishlistPopupController.prototype.addLineCollectionToWishList = function (wishList) {
                var _this = this;
                this.wishListService.addWishListLines(wishList, this.productsToAdd).then(function (wishListLineCollection) { _this.addWishListLineCollectionCompleted(wishListLineCollection); }, function (error) { _this.addWishListLineCollectionFailed(error); });
            };
            AddToWishlistPopupController.prototype.addWishListLineCollectionCompleted = function (wishListLineCollection) {
                this.addToWishlistCompleted = true;
                this.addingToList = false;
            };
            AddToWishlistPopupController.prototype.addWishListLineCollectionFailed = function (error) {
                this.errorMessage = error.message;
            };
            AddToWishlistPopupController.$inject = ["wishListService", "coreService", "settingsService", "addToWishlistPopupService", "accessToken", "sessionService"];
            return AddToWishlistPopupController;
        }());
        wishlist.AddToWishlistPopupController = AddToWishlistPopupController;
        var AddToWishlistPopupService = /** @class */ (function (_super) {
            __extends(AddToWishlistPopupService, _super);
            function AddToWishlistPopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            AddToWishlistPopupService.prototype.getDirectiveHtml = function () {
                return "<isc-add-to-wishlist-popup></isc-add-to-wishlist-popup>";
            };
            return AddToWishlistPopupService;
        }(base.BasePopupService));
        wishlist.AddToWishlistPopupService = AddToWishlistPopupService;
        angular
            .module("insite")
            .controller("AddToWishlistPopupController", AddToWishlistPopupController)
            .service("addToWishlistPopupService", AddToWishlistPopupService)
            .directive("iscAddToWishlistPopup", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                popupId: "@"
            },
            templateUrl: "/PartialViews/WishList-AddToWishlistPopup",
            controller: "AddToWishlistPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.add-to-wishlist-popup.controller.js.map