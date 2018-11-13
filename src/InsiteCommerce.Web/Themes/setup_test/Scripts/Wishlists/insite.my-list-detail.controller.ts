module insite.wishlist {
    "use strict";

    export class MyListDetailController {
        listId: string;
        invite: string;
        listModel: WishListModel;
        listSettings: WishListSettingsModel;
        productSettings: ProductSettingsModel;
        inProgress = false;
        checkStorage: {} = {};
        checkedItemsCount = 0;
        canPutAnySelectedToCart = false;
        currencySymbol: string;
        listTotal: number = 0;
        selectedListLines: WishListLineModel[];
        session: SessionModel;
        failedToGetRealTimePrices = false;
        failedToGetRealTimeInventory = false;
        sortableOptions: any;
        sort: string = "custom";
        sortProperty: string = "sortOrder";
        reverse: boolean = false;
        searchTerm: string = "";
        inviteIsNotAvailable: boolean;

        addingSearchTerm: string = "";
        successMessage: string;
        errorMessage: string;
        itemToAdd: ProductDto;
        selectedQty: number;
        autocompleteOptions: AutoCompleteOptions;
        isAddToListSectionVisible: boolean = false;
        isAddingToList: boolean = false;
        messageTimeout: ng.IPromise<any>;

        notAvailableProducts: WishListLineModel[];
        notVisibleProducts: WishListLineModel[];
        hideNotVisibleProducts: boolean;

        noteForm: any;
        editNote: boolean;
        listLineNote: string;
        noteErrorMessage: string;
        orderIsSaving: boolean;

        static $inject = [
            "$scope",
            "settingsService",
            "queryString",
            "wishListService",
            "cartService",
            "productService",
            "sessionService",
            "$timeout",
            "$interval",
            "coreService",
            "spinnerService",
            "$location",
            "shareListPopupService",
            "uploadToListPopupService",
            "$localStorage",
            "searchService",
            "productPriceService"
        ];

        constructor(
            protected $scope: ng.IScope,
            protected settingsService: core.ISettingsService,
            protected queryString: common.IQueryStringService,
            protected wishListService: IWishListService,
            protected cartService: cart.ICartService,
            protected productService: catalog.IProductService,
            protected sessionService: account.ISessionService,
            protected $timeout: ng.ITimeoutService,
            protected $interval: ng.IIntervalService,
            protected coreService: core.ICoreService,
            protected spinnerService: core.ISpinnerService,
            protected $location: ng.ILocationService,
            protected shareListPopupService: IShareListPopupService,
            protected uploadToListPopupService: IUploadToListPopupService,
            protected $localStorage: common.IWindowStorage,
            protected searchService: catalog.ISearchService,
            protected productPriceService: catalog.IProductPriceService
        ) {
            this.init();
        }

        init(): void {
            this.listId = this.queryString.get("id") || this.queryString.get("wishListId");
            this.invite = this.queryString.get("invite");

            if (!this.listId && this.invite) {
                this.wishListService.activateInvite(this.invite).then(
                    (wishList: WishListModel) => { this.updateWishListInviteCompleted(wishList); },
                    (error: any) => { this.updateWishListInviteFailed(error); });
                return;
            }

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); }
            );

            this.updateBreadcrumbs();
            this.initCheckStorageWatcher();
            this.initListUpdate();
            this.initSort();
            this.initFilter();
            this.$scope.$on("UploadingItemsToListCompleted", () => this.getList());
            this.initializeAutocomplete();
            this.calculateListHeight();

            this.$scope.$on("sessionUpdated", (event: ng.IAngularEvent, session: SessionModel) => {
                this.onSessionUpdated(session);
            });
        }

        protected updateWishListInviteCompleted(wishList: WishListModel): void {
            this.$location.search({
                id: wishList.id,
                invite: null
            });
        }

        protected updateWishListInviteFailed(error: any): void {
            this.inviteIsNotAvailable = true;
        }

        protected calculateListHeight(): void {
            const interval = this.$interval(() => {
                const list = angular.element("ul.item-list[ui-sortable]:visible");
                if (list.length > 0) {
                    list.css("height", "auto");
                    list.height(list.height());
                } else if (!this.inProgress) {
                    this.$interval.cancel(interval);
                }
            }, 300);
        }

        protected onSessionUpdated(session: SessionModel): void {
            this.getList();
        }

        updateBreadcrumbs(): void {
            this.$scope.$watch(() => this.listModel && this.listModel.name,
                (newValue) => {
                    if (newValue) {
                        angular.element(".breadcrumbs > .current").text(newValue);
                    }
                },
                true);
        }

        initCheckStorageWatcher(): void {
            this.$scope.$watch(() => this.checkStorage, () => this.calculateCheckedItems(), true);
        }

        initListUpdate(): void {
            this.$scope.$on("list-was-saved",
                (event: ng.IAngularEvent, list: WishListModel) => {
                    this.listModel.name = list.name;
                    this.listModel.description = list.description;
                });
        }

        protected initSort(): void {
            this.sortableOptions = {
                axis: "y",
                handle: ".handle",
                tolerance: "pointer",
                containment: ".sort-parent-container",
                "ui-floating": false,
                stop: this.updateSortOrder.bind(this)
            };

            this.$scope.$watch(() => this.sort,
                () => {
                    this.updateSort();
                },
                true);

            this.sort = this.$localStorage.get(`listDetailsSort-${this.listId}`) || "custom";
        }

        protected updateSort(): void {
            if (this.sort === "custom") {
                this.sortProperty = "sortOrder";
                this.reverse = false;
            } else if (this.sort === "dateAdded") {
                this.sortProperty = "createdOn";
                this.reverse = true;
            } else if (this.sort === "productAsc") {
                this.sortProperty = "shortDescription";
                this.reverse = false;
            } else if (this.sort === "productDesc") {
                this.sortProperty = "shortDescription";
                this.reverse = true;
            }

            this.$localStorage.set(`listDetailsSort-${this.listId}`, this.sort);
        }

        protected initFilter(): void {
            (this.$scope as any).filter = (wishListLine: WishListLineModel): boolean => {
                var searchTermInLowerCase = this.searchTerm.toLowerCase();
                return wishListLine.shortDescription.toLowerCase().indexOf(searchTermInLowerCase) > -1 ||
                    wishListLine.erpNumber.toLowerCase().indexOf(searchTermInLowerCase) > -1 ||
                    wishListLine.manufacturerItem.toLowerCase().indexOf(searchTermInLowerCase) > -1;
            }
        }

        protected updateSortOrder(): void {
            this.listModel.wishListLineCollection.forEach((line, index) => {
                line.sortOrder = index;
            });

            this.orderIsSaving = true;
            this.wishListService.updateWishList(this.listModel).then(
                (wishList: WishListModel) => { this.orderIsSaving = false; },
                (error: any) => { this.orderIsSaving = false; });
        }

        openSharePopup(): void {
            this.shareListPopupService.display({
                step: "",
                list: this.listModel,
                session: this.session,
                customBackStep: null
            });
        }

        calculateCheckedItems(): void {
            this.checkedItemsCount = 0;
            this.canPutAnySelectedToCart = false;

            if (!this.listModel || !this.listModel.wishListLineCollection) {
                return;
            }

            for (let i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                if (this.checkStorage[this.listModel.wishListLineCollection[i].id.toString()]) {
                    this.checkedItemsCount++;

                    if (this.listModel.wishListLineCollection[i].canAddToCart) {
                        this.canPutAnySelectedToCart = true;
                    }
                }
            }
        }

        protected closeModal(selector: string): void {
            this.coreService.closeModal(selector);
        }

        setListItem(wishListLine: WishListLineModel): void {
            this.selectedListLines = [wishListLine];
            this.editNote = !!wishListLine.notes;
            this.listLineNote = wishListLine.notes;
        }

        deleteListItem(): void {
            this.spinnerService.show();
            this.closeModal("#popup-delete-item");
            if (this.selectedListLines.length === 1) {
                this.deleteLine(this.selectedListLines[0]);
            } else {
                this.deleteLines(this.listModel, this.selectedListLines);
            }
        }

        deleteLines(list: WishListModel, lines: WishListLineModel[]): void {
            if (this.inProgress) {
                return;
            }

            this.inProgress = true;
            this.wishListService.deleteLineCollection(list, lines).then(
                (wishListLineCollection: WishListLineCollectionModel) => {
                    this.deleteLineCollectionCompleted(wishListLineCollection);
                },
                (error: any) => { this.deleteLineCollectionFailed(error); });
        }

        protected deleteLineCollectionCompleted(wishListLineCollection: WishListLineCollectionModel): void {
            this.getList();
        }

        protected deleteLineCollectionFailed(error: any): void {
        }

        deleteSelectedItems(): void {
            this.selectedListLines = [];
            for (let i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                if (this.checkStorage[this.listModel.wishListLineCollection[i].id.toString()]) {
                    this.selectedListLines.push(this.listModel.wishListLineCollection[i]);
                }
            }
        }

        deleteList(navigateTo: string): void {
            this.wishListService.deleteWishList(this.listModel).then(
                (wishList: WishListModel) => { this.deleteWishListCompleted(navigateTo, wishList); },
                (error: any) => { this.deleteWishListFailed(error); });
        }

        protected deleteWishListCompleted(navigateTo: string, wishList: WishListModel): void {
            this.closeModal("#popup-delete-list");
            this.spinnerService.show();
            this.coreService.redirectToPath(navigateTo);
        }

        protected deleteWishListFailed(error: any): void {
        }

        selectAll(): void {
            if (this.isAllSelected()) {
                this.checkStorage = {};
            } else {
                for (let i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                    this.checkStorage[this.listModel.wishListLineCollection[i].id.toString()] = true;
                }
            }
        }

        isAllSelected(): boolean {
            return this.checkedItemsCount === this.listModel.wishListLineCollection.length;
        }

        checkProduct(productLineId: System.Guid): void {
            if (this.checkStorage[productLineId.toString()]) {
                delete this.checkStorage[productLineId.toString()];
            } else {
                this.checkStorage[productLineId.toString()] = true;
            }
        }

        isProductChecked(productLineId: System.Guid): boolean {
            return !!this.checkStorage[productLineId.toString()];
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.productSettings = settingsCollection.productSettings;
            this.listSettings = settingsCollection.wishListSettings;
            if (this.listId) {
                this.getList();
            }
        }

        protected getSettingsFailed(error: any): void {
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.currencySymbol = session.currency.currencySymbol;
            this.session = session;
        }

        protected getSessionFailed(error: any): void {
        }

        getList(): void {
            this.inProgress = true;
            this.spinnerService.show();
            this.wishListService.getListById(this.listId, "hiddenproducts,getalllines").then(
                (listModel: WishListModel) => { this.getListCompleted(listModel); },
                (error: any) => { this.getListFailed(error); });
        }

        calculateListTotal(): void {
            this.listTotal = 0;
            for (let i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                const product = this.wishListService.mapWishlistLineToProduct(this.listModel.wishListLineCollection[i]);

                if (product.pricing) {
                    const unitNetPrice = this.productPriceService.getUnitNetPrice(product).price;
                    const extendedNetPrice = Math.round(unitNetPrice *
                            product.qtyOrdered *
                            100) /
                        100;

                    this.listTotal += extendedNetPrice;
                }
            }

            this.listTotal = Math.round(this.listTotal * 100) / 100;
        }

        removeHiddenProducts(): void {
            const outOfStock = 2;
            this.notAvailableProducts = [];
            this.notVisibleProducts = [];

            if (!this.listModel.wishListLineCollection || this.listModel.wishListLineCollection.length === 0) {
                return;
            }

            this.notAvailableProducts =
                this.listModel.wishListLineCollection.filter(o => !o.isActive || (o.isDiscontinued && (<any>o.availability).messageType === outOfStock));
            const inactiveProductIds = this.notAvailableProducts.map(o => o.id);
            this.notVisibleProducts =
                this.listModel.wishListLineCollection.filter(o => !o.isVisible &&
                    inactiveProductIds.indexOf(o.id) === -1);
            this.listModel.wishListLinesCount -= (this.notAvailableProducts.length + this.notVisibleProducts.length);

            this.listModel.wishListLineCollection =
                this.listModel.wishListLineCollection.filter(o => o.isActive && (!o.isDiscontinued || (<any>o.availability).messageType !== outOfStock) && o.isVisible);
        }

        protected getListCompleted(listModel: WishListModel): void {
            this.inProgress = false;
            this.spinnerService.hide();

            this.listModel = listModel;
            this.removeHiddenProducts();
            this.calculateCheckedItems();

            this.getRealTimePrices();
            if (!this.productSettings.inventoryIncludedWithPricing) {
                this.getRealTimeInventory();
            }

            this.calculateListTotal();

            // refresh foundation tip hover
            this.$timeout(() => (angular.element(document) as any).foundation("dropdown", "reflow"), 0);
        }

        protected getListFailed(error: any): void {
            this.spinnerService.hide();
        }

        protected getRealTimePrices(): void {
            if (this.productSettings.realTimePricing && this.listModel.wishListLineCollection != null) {
                const products = this.wishListService.mapWishListLinesToProducts(this.listModel.wishListLineCollection);

                this.productService.getProductRealTimePrices(products).then(
                    (pricingResult: RealTimePricingModel) => { this.handleRealTimePricesCompleted(pricingResult); },
                    (reason: any) => { this.handleRealtimePricesFailed(reason); });
            }
        }

        protected handleRealTimePricesCompleted(result: RealTimePricingModel): void {
            result.realTimePricingResults.forEach((productPrice: ProductPriceDto) => {
                const wishlistLine = this.listModel.wishListLineCollection.find(
                    (p: WishListLineModel) => p.productId === productPrice.productId &&
                    p.unitOfMeasure === productPrice.unitOfMeasure);
                wishlistLine.pricing = productPrice;
            });

            this.calculateListTotal();

            if (this.productSettings.inventoryIncludedWithPricing) {
                this.getRealTimeInventory();
            }
        }

        protected handleRealtimePricesFailed(reason: any): void {
            this.failedToGetRealTimePrices = true;

            if (this.productSettings.inventoryIncludedWithPricing) {
                this.failedToGetRealTimeInventory = true;
            }
        }

        protected getRealTimeInventory(): void {
            if (this.productSettings.realTimeInventory && this.listModel.wishListLineCollection != null) {
                const products =
                    this.listModel.wishListLineCollection.map(
                        wishlistLine => this.wishListService.mapWishlistLineToProduct(wishlistLine));

                this.productService.getProductRealTimeInventory(products).then(
                    (inventoryResult: RealTimeInventoryModel) => {
                        this.handleRealTimeInventoryCompleted(inventoryResult);
                    },
                    (reason: any) => { this.handleRealtimeInventoryFailed(reason); });
            }
        }

        protected handleRealTimeInventoryCompleted(result: RealTimeInventoryModel): void {
            this.wishListService.applyRealTimeInventoryResult(this.listModel, result);
        }

        protected handleRealtimeInventoryFailed(reason: any): void {
            this.failedToGetRealTimeInventory = true;
        }

        addAllToCart(wishList: WishListModel): void {
            this.inProgress = true;
            this.cartService.addWishListToCart(wishList.id, true).then(
                (cartLineCollection: CartLineCollectionModel) => {
                    this.addLineCollectionCompleted(cartLineCollection);
                },
                (error: any) => { this.addLineCollectionFailed(error); });
        }

        protected addLineCollectionCompleted(cartLineCollection: CartLineCollectionModel): void {
            this.inProgress = false;
        }

        protected addLineCollectionFailed(error: any): void {
            this.inProgress = false;
        }

        updateLine(line: WishListLineModel): void {
            if (line.qtyOrdered > 0) {
                this.wishListService.updateLine(line).then(
                    (wishListLine: WishListLineModel) => { this.updateLineCompleted(wishListLine); },
                    (error: any) => { this.updateLineFailed(error); });
            }
        }

        deleteLine(line: WishListLineModel): void {
            if (this.inProgress) {
                return;
            }

            this.inProgress = true;
            this.wishListService.deleteLine(line).then(
                (wishListLine: WishListLineModel) => { this.deleteLineCompleted(wishListLine); },
                (error: any) => { this.deleteLineFailed(error); });
        }

        protected deleteLineCompleted(wishListLine: WishListLineModel): void {
            this.getList();
        }

        protected deleteLineFailed(error: any): void {
        }

        protected updateLineCompleted(wishListLine: WishListLineModel): void {
            this.getList();
        }

        protected updateLineFailed(error: any): void {
        }

        quantityKeyPress(line: WishListLineModel): void {
            this.updateLine(line);
        }

        addSelectedToCart(): void {
            let lines = [];
            for (let i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                if (this.listModel.wishListLineCollection[i].canAddToCart &&
                    this.checkStorage[this.listModel.wishListLineCollection[i].id.toString()]) {
                    lines.push(this.listModel.wishListLineCollection[i]);
                }
            }

            this.cartService.addLineCollection(lines, true).then(
                (cartLineCollection: CartLineCollectionModel) => {
                    this.addLineCollectionCompleted(cartLineCollection);
                },
                (error: any) => { this.addLineCollectionFailed(error); });
        }

        addLineToCart(line: any): void {
            this.cartService.addLine(line, true).then(
                (cartLine: CartLineModel) => { this.addLineCompleted(cartLine); },
                (error: any) => { this.addLineFailed(error); });
        }

        protected addLineCompleted(cartLine: CartLineModel): void {
        }

        protected addLineFailed(error: any): void {
        }

        allQtysIsValid(): boolean {
            if (!this.listModel || !this.listModel.wishListLineCollection) {
                return false;
            }

            return this.listModel.wishListLineCollection.every((wishListLine: WishListLineModel) => {
                return wishListLine.qtyOrdered && parseFloat(wishListLine.qtyOrdered.toString()) > 0;
            });
        }

        changeUnitOfMeasure(line: WishListLineModel): void {
            const product = this.wishListService.mapWishlistLineToProduct(line);
            this.productService.changeUnitOfMeasure(product).then(
                (productDto: ProductDto) => { this.changeUnitOfMeasureCompleted(line, productDto); },
                (error: any) => { this.changeUnitOfMeasureFailed(error); });
        }

        protected changeUnitOfMeasureCompleted(line: WishListLineModel, productDto: ProductDto): void {
            line = this.wishListService.mapProductToWishlistLine(productDto, line);
            if (!productDto.quoteRequired) {
                line.pricing = productDto.pricing;
            }

            this.updateLine(line);
            this.wishListService.updateAvailability(line);
        }

        protected changeUnitOfMeasureFailed(error: any): void {
        }

        deleteNote(): void {
            this.listLineNote = "";
            this.saveNote();
        }

        saveNote(): void {
            this.noteErrorMessage = "";
            if (!this.noteForm.$valid) {
                return;
            }

            this.spinnerService.show();
            this.selectedListLines[0].notes = this.listLineNote;
            this.wishListService.updateLine(this.selectedListLines[0]).then(
                (wishListLine: WishListLineModel) => { this.updateLineNoteCompleted(wishListLine); },
                (error: any) => { this.updateLineNoteFailed(error); });
        }

        protected updateLineNoteCompleted(wishListLine: WishListLineModel): void {
            this.closeModal("#popup-line-note");
            this.selectedListLines[0].notes = wishListLine.notes;
            this.spinnerService.hide();
        }

        protected updateLineNoteFailed(error: any): void {
            this.spinnerService.hide();
        }

        protected leaveList(navigateTo: string): void {
            this.wishListService.deleteWishListShare(this.listModel).then(
                (wishList: WishListModel) => { this.leaveListCompleted(navigateTo, wishList); },
                (error: any) => { this.leaveListFailed(error); });
        }

        protected leaveListCompleted(navigateTo: string, wishList: WishListModel): void {
            this.closeModal("#popup-leave-list");
            this.spinnerService.show();
            this.coreService.redirectToPath(navigateTo);
        }

        protected leaveListFailed(error: any): void {
        }

        removeProducts(productLines: WishListLineModel[]): void {
            this.spinnerService.show();
            if (productLines.length === 1) {
                this.deleteLine(productLines[0]);
            } else {
                this.deleteLines(this.listModel, productLines);
            }
        }

        hideNotVisibleProductsNotification(): void {
            this.hideNotVisibleProducts = true;
            this.notVisibleProducts = [];
        }

        openUploadListPopup(wishList: WishListModel): void {
            this.uploadToListPopupService.display(wishList);
        }

        onEnterKeyPressedInAutocomplete(): void {
            const autocomplete = $("#qo-search-widget").data("kendoAutoComplete") as any;
            if (autocomplete && autocomplete._last === kendo.keys.ENTER && autocomplete.listView.selectedDataItems().length === 0) {
                this.searchProduct(this.addingSearchTerm);
            }
        }

        protected searchProduct(erpNumber: string): void {
            if (!erpNumber || erpNumber.length === 0) {
                return;
            }

            this.findProduct(erpNumber).then(
                (productCollection: ProductCollectionModel) => { this.addProductCompleted(productCollection); },
                (error: any) => { this.addProductFailed(error); });
        }

        protected findProduct(erpNumber: string): ng.IPromise<ProductCollectionModel> {
            const parameters: catalog.IProductCollectionParameters = { extendedNames: [erpNumber] };

            return this.productService.getProducts(parameters);
        }

        protected addProductCompleted(productCollection: ProductCollectionModel): void {
            this.validateAndSetProduct(productCollection);
        }

        protected addProductFailed(error: any): void {
            this.setErrorMessage(angular.element("#messageNotFound").val());
        }

        protected initializeAutocomplete(): void {
            this.autocompleteOptions = this.searchService.getProductAutocompleteOptions(() => this.addingSearchTerm);

            this.autocompleteOptions.template =
                this.searchService.getProductAutocompleteTemplate(() => this.addingSearchTerm,
                    "tst_ListWidget_autocomplete");
            this.autocompleteOptions.select = this.onAutocompleteOptionsSelect();
        }

        protected onAutocompleteOptionsSelect(): (event: kendo.ui.AutoCompleteSelectEvent) => void {
            return (event: kendo.ui.AutoCompleteSelectEvent) => {
                const dataItem = event.sender.dataItem(event.item.index());
                this.searchProduct(dataItem.erpNumber);
            };
        }

        protected toggleAddToListSection() {
            this.isAddToListSectionVisible = !this.isAddToListSectionVisible;
        }

        addProductToList(productToAdd: ProductDto): void {
            if (!productToAdd || !productToAdd.id) {
                if (this.addingSearchTerm) {
                    this.findProduct(this.addingSearchTerm).then(
                        (productCollection: ProductCollectionModel) => { this.findProductCompleted(productCollection); },
                        (error: any) => { this.findProductFailed(error); });
                } else {
                    this.setErrorMessage(angular.element("#messageEnterProductName").val());
                }

                return;
            }

            this.addToList(productToAdd);
        }

        protected findProductCompleted(productCollection: ProductCollectionModel): void {
            if (this.validateAndSetProduct(productCollection)) {
                this.addToList(this.itemToAdd);
            }
        }

        protected findProductFailed(error: any): void {
            this.setErrorMessage(angular.element("#messageNotFound").val());
        }

        protected addToList(productToAdd: ProductDto): void {
            const listLineContainsCurrentProduct = this.listModel.wishListLineCollection.filter((item) => {
                return item.productId === productToAdd.id && item.unitOfMeasure === productToAdd.selectedUnitOfMeasure;
            });

            if (listLineContainsCurrentProduct && listLineContainsCurrentProduct.length > 0) {
                this.setErrorMessage(angular.element("#alreadyInList").val());
                return;
            }

            this.isAddingToList = true;
            this.wishListService.addWishListLine(this.listModel, productToAdd).then(
                (data: WishListLineModel) => { this.addProductToListCompleted(data) },
                (error) => { this.addProductToListFailed(error) });
        }

        protected validateAndSetProduct(productCollection: ProductCollectionModel): boolean {
            const product = productCollection.products[0];

            if (this.validateProduct(product)) {
                const originalQty = (this.itemToAdd ? this.itemToAdd.qtyOrdered : 1) || 1;
                product.qtyOrdered = originalQty < product.minimumOrderQty ? product.minimumOrderQty : originalQty;
                this.selectedQty = product.qtyOrdered;
                this.itemToAdd = product;
                this.errorMessage = "";
                this.successMessage = "";
                return true;
            }

            return false;
        }

        protected validateProduct(product: ProductDto): boolean {
            if (product.canConfigure || (product.isConfigured && !product.isFixedConfiguration)) {
                this.setErrorMessage(angular.element("#messageConfigurableProduct").val());
                return false;
            }
            if (product.isStyleProductParent) {
                this.setErrorMessage(angular.element("#messageStyledProduct").val());
                return false;
            }

            return true;
        }

        addProductToListCompleted(wishListLineModel: WishListLineModel) {
            this.getList();
            this.isAddingToList = false;
            this.addingSearchTerm = "";
            this.itemToAdd = { qtyOrdered: (this.itemToAdd ? this.itemToAdd.qtyOrdered : 1) } as ProductDto;
            this.setSuccessMessage(angular.element("#messageAddedProduct").val());
        }

        addProductToListFailed(error) {
            this.isAddingToList = false;
        }

        protected setErrorMessage(message: string) {
            this.errorMessage = message;
            this.successMessage = "";
            this.initHideMessageTimeout();
        }

        protected setSuccessMessage(message: string) {
            this.errorMessage = "";
            this.successMessage = message;
            this.initHideMessageTimeout();
        }

        protected initHideMessageTimeout(): void {
            this.$timeout.cancel(this.messageTimeout);
            this.messageTimeout = this.$timeout(() => {
                this.successMessage = "";
                this.errorMessage = "";
            }, 2000);
        }

        getUomDisplayValue(uom: any): string {
            if (!uom) {
                return "";
            }

            const name = uom.description ? uom.description : uom.unitOfMeasureDisplay;
            const qtyPerBaseUnitOfMeasure = uom.qtyPerBaseUnitOfMeasure !== 1 ? "/" + uom.qtyPerBaseUnitOfMeasure : "";
            return `${name}${qtyPerBaseUnitOfMeasure}`;
        }

        addingSearchTermChanged(): void {
            this.successMessage = "";
            this.errorMessage = "";
            const originalQty = this.itemToAdd ? this.itemToAdd.qtyOrdered : 1;
            this.itemToAdd = { qtyOrdered: originalQty } as ProductDto;
        }

        checkPrint(event: ng.IAngularEvent): void {
            if (this.orderIsSaving) {
                event.preventDefault();
            }
        }
    }

    angular
        .module("insite")
        .controller("MyListDetailController", MyListDetailController);
}