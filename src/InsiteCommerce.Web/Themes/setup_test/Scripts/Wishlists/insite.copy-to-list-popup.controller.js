var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        var CopyToListPopupController = /** @class */ (function () {
            function CopyToListPopupController(wishListService, coreService) {
                this.wishListService = wishListService;
                this.coreService = coreService;
                this.init();
            }
            CopyToListPopupController.prototype.init = function () {
                this.initializePopup();
            };
            CopyToListPopupController.prototype.closeModal = function () {
                this.coreService.closeModal("#popup-copy-list");
            };
            CopyToListPopupController.prototype.initializePopup = function () {
                var _this = this;
                var popup = angular.element("#popup-copy-list");
                popup.on("open", function () {
                    var pagination = { pageSize: 999 };
                    _this.clearMessages();
                    _this.newListName = "";
                    _this.wishListService.getWishLists(null, null, null, pagination).then(function (listCollection) { _this.getListCollectionCompleted(listCollection); }, function (error) { _this.getListCollectionFailed(error); });
                });
            };
            CopyToListPopupController.prototype.getListCollectionCompleted = function (listCollection) {
                var _this = this;
                this.listCollection = listCollection.wishListCollection.filter(function (o) { return o.id !== _this.mylistDetailModel.id; });
            };
            CopyToListPopupController.prototype.getListCollectionFailed = function (error) {
                this.errorMessage = error.message;
            };
            CopyToListPopupController.prototype.clearMessages = function () {
                this.copyInProgress = false;
                this.copyToListCompleted = false;
                this.errorMessage = "";
                this.showListNameErrorMessage = false;
            };
            CopyToListPopupController.prototype.changeList = function () {
                this.newListName = "";
                this.clearMessages();
            };
            CopyToListPopupController.prototype.addList = function (listName) {
                var _this = this;
                this.wishListService.addWishList(listName).then(function (list) { _this.addListCompleted(list); }, function (error) { _this.addListFailed(error); });
            };
            CopyToListPopupController.prototype.addListCompleted = function (list) {
                this.addProductsToList(list);
            };
            CopyToListPopupController.prototype.addListFailed = function (error) {
                this.errorMessage = error.message;
                this.copyInProgress = false;
            };
            CopyToListPopupController.prototype.copyToList = function () {
                this.clearMessages();
                this.copyInProgress = true;
                if (this.selectedList) {
                    this.listName = this.selectedList.name;
                    this.addProductsToList(this.selectedList);
                }
                else {
                    if (this.newListName && this.newListName.trim().length > 0) {
                        this.listName = this.newListName;
                        this.addList(this.newListName);
                    }
                    else {
                        this.showListNameErrorMessage = true;
                        this.copyInProgress = false;
                    }
                }
            };
            CopyToListPopupController.prototype.addProductsToList = function (list) {
                if (this.mylistDetailModel.wishListLinesCount === 1) {
                    this.addLineToList(list);
                }
                else {
                    this.addLineCollectionToList(list);
                }
            };
            CopyToListPopupController.prototype.addLineToList = function (list) {
                var _this = this;
                this.wishListService.addWishListLine(list, this.wishListService.mapWishListLinesToProducts(this.mylistDetailModel.wishListLineCollection)[0]).then(function (listLine) { _this.addListLineCompleted(listLine); }, function (error) { _this.addListLineFailed(error); });
            };
            CopyToListPopupController.prototype.addListLineCompleted = function (listLine) {
                this.copyToListCompleted = true;
            };
            CopyToListPopupController.prototype.addListLineFailed = function (error) {
                this.errorMessage = error.message;
                this.copyInProgress = false;
            };
            CopyToListPopupController.prototype.addLineCollectionToList = function (list) {
                var _this = this;
                this.wishListService.addWishListLines(list, this.wishListService.mapWishListLinesToProducts(this.mylistDetailModel.wishListLineCollection)).then(function (listLineCollection) { _this.addListLineCollectionCompleted(listLineCollection); }, function (error) { _this.addListLineCollectionFailed(error); });
            };
            CopyToListPopupController.prototype.addListLineCollectionCompleted = function (listLineCollection) {
                this.copyToListCompleted = true;
            };
            CopyToListPopupController.prototype.addListLineCollectionFailed = function (error) {
                this.errorMessage = error.message;
                this.copyInProgress = false;
            };
            CopyToListPopupController.$inject = ["wishListService", "coreService"];
            return CopyToListPopupController;
        }());
        wishlist.CopyToListPopupController = CopyToListPopupController;
        angular
            .module("insite")
            .controller("CopyToListPopupController", CopyToListPopupController)
            .directive("iscCopyToListPopup", function () { return ({
            restrict: "E",
            replace: true,
            scope: {
                mylistDetailModel: "=list"
            },
            templateUrl: "/PartialViews/List-CopyToListPopup",
            controller: "CopyToListPopupController",
            controllerAs: "vm",
            bindToController: true
        }); });
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.copy-to-list-popup.controller.js.map