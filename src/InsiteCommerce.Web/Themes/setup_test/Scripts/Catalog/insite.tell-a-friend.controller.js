var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var TellAFriendController = /** @class */ (function () {
            function TellAFriendController($scope, emailService) {
                this.$scope = $scope;
                this.emailService = emailService;
                this.init();
            }
            TellAFriendController.prototype.init = function () {
                var _this = this;
                angular.element("#TellAFriendDialogContainer").on("closed", function () {
                    _this.onTellAFriendPopupClosed();
                });
            };
            TellAFriendController.prototype.onTellAFriendPopupClosed = function () {
                this.resetPopup();
                this.$scope.$apply();
            };
            TellAFriendController.prototype.resetPopup = function () {
                this.tellAFriendModel = this.tellAFriendModel || {};
                this.tellAFriendModel.friendsName = "";
                this.tellAFriendModel.friendsEmailAddress = "";
                this.tellAFriendModel.yourName = "";
                this.tellAFriendModel.yourEmailAddress = "";
                this.tellAFriendModel.yourMessage = "";
                this.isSuccess = false;
                this.isError = false;
            };
            TellAFriendController.prototype.shareWithFriend = function () {
                var _this = this;
                var valid = angular.element("#tellAFriendForm").validate().form();
                if (!valid) {
                    return;
                }
                this.tellAFriendModel.productId = this.product.id.toString();
                this.tellAFriendModel.productImage = this.product.mediumImagePath;
                this.tellAFriendModel.productShortDescription = this.product.shortDescription;
                this.tellAFriendModel.altText = this.product.altText;
                this.tellAFriendModel.productUrl = this.product.productDetailUrl;
                this.emailService.tellAFriend(this.tellAFriendModel).then(function (tellAFriendModel) { _this.tellAFriendCompleted(tellAFriendModel); }, function (error) { _this.tellAFriendFailed(error); });
            };
            TellAFriendController.prototype.tellAFriendCompleted = function (tellAFriendModel) {
                this.isSuccess = true;
                this.isError = false;
            };
            TellAFriendController.prototype.tellAFriendFailed = function (error) {
                this.isSuccess = false;
                this.isError = true;
            };
            TellAFriendController.$inject = ["$scope", "emailService"];
            return TellAFriendController;
        }());
        catalog.TellAFriendController = TellAFriendController;
        angular
            .module("insite")
            .controller("TellAFriendController", TellAFriendController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.tell-a-friend.controller.js.map