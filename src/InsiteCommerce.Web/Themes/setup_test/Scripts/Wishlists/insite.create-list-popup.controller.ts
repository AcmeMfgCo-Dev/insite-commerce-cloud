module insite.wishlist {
    import WishListModel = Insite.WishLists.WebApi.V1.ApiModels.WishListModel;
    "use strict";

    export class CreateListPopupController {
        listForm: any;
        listName: string;
        listDescription: string;
        errorMessage: string;
        list: WishListModel;

        static $inject = ["$scope", "$rootScope", "wishListService", "coreService"];

        constructor(
            protected $scope: ng.IScope,
            protected $rootScope: ng.IRootScopeService,
            protected wishListService: IWishListService,
            protected coreService: core.ICoreService) {
            this.init();
        }

        init(): void {
            this.initListPopupEvents();
        }

        protected closeModal(): void {
            this.coreService.closeModal("#popup-create-list");
        }

        protected clearMessages(): void {
            this.errorMessage = "";
        }

        protected initListPopupEvents(): void {
            const popup = angular.element("#popup-create-list");

            popup.on("closed", () => {
                    this.clearMessages();
                    this.listName = "";
                    this.listDescription = "";
                    this.listForm.$setPristine();
                    this.listForm.$setUntouched();
                    this.$scope.$apply();
                });

            popup.on("open", () => {
                if (this.list) {
                    this.clearMessages();
                    this.listName = this.list.name;
                    this.listDescription = this.list.description;
                    this.$scope.$apply();
                }
            });
        }

        validForm(): boolean {
            this.clearMessages();

            if (!this.listForm.$valid) {
                return false;
            }

            return true;
        }

        createWishList(): void {
            if (!this.validForm()) {
                return;
            }

            this.wishListService.addWishList(this.listName, this.listDescription).then(
                (wishList: WishListModel) => { this.addWishListCompleted(wishList); },
                (error: any) => { this.addWishListFailed(error); });
        }

        protected addWishListCompleted(wishList: WishListModel): void {
            this.closeModal();
            this.$rootScope.$broadcast("list-was-created", wishList);
        }

        protected addWishListFailed(error: any): void {
            if (error && error.message) {
                this.errorMessage = error.message;
            }
        }

        updateWishList(): void {
            if (!this.validForm()) {
                return;
            }

            const list = {
                name: this.listName,
                description: this.listDescription,
                uri: this.list.uri
            } as WishListModel;

            this.wishListService.updateWishList(list).then(
                (wishList: WishListModel) => { this.updateWishListCompleted(wishList); },
                (error: any) => { this.updateWishListFailed(error); });
        }

        protected updateWishListCompleted(wishList: WishListModel): void {
            this.closeModal();
            this.$rootScope.$broadcast("list-was-saved", wishList);
        }

        protected updateWishListFailed(error: any): void {
            if (error && error.message) {
                this.errorMessage = error.message;
            }
        }
    }

    angular
        .module("insite")
        .controller("CreateListPopupController", CreateListPopupController)
        .directive("iscCreateListPopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/List-CreateListPopup",
            scope: {
                list: "="
            },
            controller: "CreateListPopupController",
            controllerAs: "vm",
            bindToController: true
        }));
}