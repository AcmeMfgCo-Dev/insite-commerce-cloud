module insite.wishlist {
    "use strict";

    export class MyListsController {
        wishListCount: number;
        myListDetailUrl: string;
        wishListCollection: WishListModel[] = [];
        listSettings: WishListSettingsModel;
        hasAnyWishListsLine: boolean;
        session: SessionModel;
        inProgress = false;
        pagination: PaginationModel;
        paginationStorageKey = "DefaultPagination-WishList";

        sort: string = "ModifiedOn DESC";
        popupWishListModel: WishListModel;

        static $inject = ["$scope", "coreService", "wishListService", "cartService", "settingsService", "spinnerService", "$timeout", "sessionService", "paginationService"];

        constructor(
            protected $scope: ng.IScope,
            protected coreService: core.ICoreService,
            protected wishListService: IWishListService,
            protected cartService: cart.ICartService,
            protected settingsService: core.ISettingsService,
            protected spinnerService: core.ISpinnerService,
            protected $timeout: ng.ITimeoutService,
            protected sessionService: account.ISessionService,
            protected paginationService: core.IPaginationService) {
            this.init();
        }

        init(): void {
            this.restoreHistory();
            this.getWishLists(false);
            this.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); }
            );

            this.$scope.$on("list-was-created", () => {
                this.getWishLists();
            });

            this.$scope.$on("leaveListPopupContext", (event, list: WishListModel) => {
                this.popupWishListModel = list;
            });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.listSettings = settingsCollection.wishListSettings;
            this.$timeout(() => (angular.element(document) as any).foundation(), 0);
            this.redirectToMyListDetails();
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.session = session;
        }

        protected getSessionFailed(error: any): void {
        }

        mapData(data: any): void {
            this.wishListCount = data.wishListCollection.length;
            this.pagination = data.pagination;
            this.hasAnyWishListsLine = data.wishListCollection.some(e => e.hasAnyLines);
            if (this.wishListCount > 0) {
                this.wishListCollection = data.wishListCollection;
            }
        }

        protected changeSortBy(): void {
            this.coreService.replaceState({ sort: this.sort });
            this.getWishLists();
        }

        protected restoreHistory(): void {
            const state = this.coreService.getHistoryState();
            if (state) {
                if (state.pagination) {
                    this.pagination = state.pagination;
                }

                if (state.sort) {
                    this.sort = state.sort;
                }
            }
        }

        getWishLists(storeHistory: boolean = true): void {
            this.spinnerService.show();
            if (storeHistory) {
                this.updateHistory();
            }

            this.wishListService.getWishLists(this.sort, "top3products", null, this.pagination).then(
                (wishListCollection: WishListCollectionModel) => { this.getWishListsCompleted(wishListCollection); },
                (error: any) => { this.getWishListsFailed(error); });
        }

        protected getWishListsCompleted(wishListCollection: WishListCollectionModel): void {
            this.mapData(wishListCollection);
            this.spinnerService.hide();
            this.redirectToMyListDetails();

            // refresh foundation tip hover
            this.$timeout(() => (angular.element(document) as any).foundation("dropdown", "reflow"), 0);
        }

        protected getWishListsFailed(error: any): void {
            this.spinnerService.hide();
        }

        protected closeModal(selector: string): void {
            this.coreService.closeModal(selector);
        }

        setWishList(wishList: WishListModel): void {
            this.popupWishListModel = wishList;
        }

        deleteList(navigateTo: string): void {
            this.wishListService.deleteWishList(this.popupWishListModel).then(
                (wishList: WishListModel) => { this.deleteWishListCompleted(wishList); },
                (error: any) => { this.deleteWishListFailed(error); });
        }

        protected deleteWishListCompleted(wishList: WishListModel): void {
            this.closeModal("#popup-delete-list");
            this.getWishLists();
        }

        protected deleteWishListFailed(error: any): void {
        }

        leaveList(): void {
            this.wishListService.deleteWishListShare(this.popupWishListModel).then(
                (wishList: WishListModel) => { this.leaveListCompleted(wishList); },
                (error: any) => { this.leaveListFailed(error); });
        }

        protected leaveListCompleted(wishList: WishListModel): void {
            this.closeModal("#popup-leave-list");
            this.getWishLists();
        }

        protected leaveListFailed(error: any): void {
        }

        addAllToCart(wishList: WishListModel): void {
            this.inProgress = true;
            this.cartService.addWishListToCart(wishList.id, true).then(
                (cartLineCollection: CartLineCollectionModel) => { this.addLineCollectionCompleted(cartLineCollection); },
                (error: any) => { this.addLineCollectionFailed(error); });
        }

        protected addLineCollectionCompleted(cartLineCollection: CartLineCollectionModel): void {
            this.inProgress = false;
        }

        protected addLineCollectionFailed(error: any): void {
            this.inProgress = false;
        }

        protected isSharedByCustomer(list: WishListModel): boolean {
            return list.shareOption === ShareOptionEnum[ShareOptionEnum.AllCustomerUsers];
        }

        redirectToMyListDetails(): void {
            // skip redirect for cms widget
            if (!this.myListDetailUrl) {
                return;
            }

            if (this.listSettings && !this.listSettings.allowMultipleWishLists && this.wishListCollection && this.wishListCollection.length > 0) {
                this.spinnerService.show();
                this.coreService.redirectToPath(this.myListDetailUrl + "?id=" + this.wishListCollection[0].id);
            }
        }

        protected updateHistory(): void {
            this.coreService.pushState({ sort: this.sort, pagination: this.pagination });
        }
    }

    angular
        .module("insite")
        .controller("MyListsController", MyListsController);
}