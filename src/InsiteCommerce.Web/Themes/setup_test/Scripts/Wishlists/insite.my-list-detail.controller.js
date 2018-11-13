var insite;
(function (insite) {
    var wishlist;
    (function (wishlist) {
        "use strict";
        var MyListDetailController = /** @class */ (function () {
            function MyListDetailController($scope, settingsService, queryString, wishListService, cartService, productService, sessionService, $timeout, $interval, coreService, spinnerService, $location, shareListPopupService, uploadToListPopupService, $localStorage, searchService, productPriceService) {
                this.$scope = $scope;
                this.settingsService = settingsService;
                this.queryString = queryString;
                this.wishListService = wishListService;
                this.cartService = cartService;
                this.productService = productService;
                this.sessionService = sessionService;
                this.$timeout = $timeout;
                this.$interval = $interval;
                this.coreService = coreService;
                this.spinnerService = spinnerService;
                this.$location = $location;
                this.shareListPopupService = shareListPopupService;
                this.uploadToListPopupService = uploadToListPopupService;
                this.$localStorage = $localStorage;
                this.searchService = searchService;
                this.productPriceService = productPriceService;
                this.inProgress = false;
                this.checkStorage = {};
                this.checkedItemsCount = 0;
                this.canPutAnySelectedToCart = false;
                this.listTotal = 0;
                this.failedToGetRealTimePrices = false;
                this.failedToGetRealTimeInventory = false;
                this.sort = "custom";
                this.sortProperty = "sortOrder";
                this.reverse = false;
                this.searchTerm = "";
                this.addingSearchTerm = "";
                this.isAddToListSectionVisible = false;
                this.isAddingToList = false;
                this.init();
            }
            MyListDetailController.prototype.init = function () {
                var _this = this;
                this.listId = this.queryString.get("id") || this.queryString.get("wishListId");
                this.invite = this.queryString.get("invite");
                if (!this.listId && this.invite) {
                    this.wishListService.activateInvite(this.invite).then(function (wishList) { _this.updateWishListInviteCompleted(wishList); }, function (error) { _this.updateWishListInviteFailed(error); });
                    return;
                }
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                this.updateBreadcrumbs();
                this.initCheckStorageWatcher();
                this.initListUpdate();
                this.initSort();
                this.initFilter();
                this.$scope.$on("UploadingItemsToListCompleted", function () { return _this.getList(); });
                this.initializeAutocomplete();
                this.calculateListHeight();
                this.$scope.$on("sessionUpdated", function (event, session) {
                    _this.onSessionUpdated(session);
                });
            };
            MyListDetailController.prototype.updateWishListInviteCompleted = function (wishList) {
                this.$location.search({
                    id: wishList.id,
                    invite: null
                });
            };
            MyListDetailController.prototype.updateWishListInviteFailed = function (error) {
                this.inviteIsNotAvailable = true;
            };
            MyListDetailController.prototype.calculateListHeight = function () {
                var _this = this;
                var interval = this.$interval(function () {
                    var list = angular.element("ul.item-list[ui-sortable]:visible");
                    if (list.length > 0) {
                        list.css("height", "auto");
                        list.height(list.height());
                    }
                    else if (!_this.inProgress) {
                        _this.$interval.cancel(interval);
                    }
                }, 300);
            };
            MyListDetailController.prototype.onSessionUpdated = function (session) {
                this.getList();
            };
            MyListDetailController.prototype.updateBreadcrumbs = function () {
                var _this = this;
                this.$scope.$watch(function () { return _this.listModel && _this.listModel.name; }, function (newValue) {
                    if (newValue) {
                        angular.element(".breadcrumbs > .current").text(newValue);
                    }
                }, true);
            };
            MyListDetailController.prototype.initCheckStorageWatcher = function () {
                var _this = this;
                this.$scope.$watch(function () { return _this.checkStorage; }, function () { return _this.calculateCheckedItems(); }, true);
            };
            MyListDetailController.prototype.initListUpdate = function () {
                var _this = this;
                this.$scope.$on("list-was-saved", function (event, list) {
                    _this.listModel.name = list.name;
                    _this.listModel.description = list.description;
                });
            };
            MyListDetailController.prototype.initSort = function () {
                var _this = this;
                this.sortableOptions = {
                    axis: "y",
                    handle: ".handle",
                    tolerance: "pointer",
                    containment: ".sort-parent-container",
                    "ui-floating": false,
                    stop: this.updateSortOrder.bind(this)
                };
                this.$scope.$watch(function () { return _this.sort; }, function () {
                    _this.updateSort();
                }, true);
                this.sort = this.$localStorage.get("listDetailsSort-" + this.listId) || "custom";
            };
            MyListDetailController.prototype.updateSort = function () {
                if (this.sort === "custom") {
                    this.sortProperty = "sortOrder";
                    this.reverse = false;
                }
                else if (this.sort === "dateAdded") {
                    this.sortProperty = "createdOn";
                    this.reverse = true;
                }
                else if (this.sort === "productAsc") {
                    this.sortProperty = "shortDescription";
                    this.reverse = false;
                }
                else if (this.sort === "productDesc") {
                    this.sortProperty = "shortDescription";
                    this.reverse = true;
                }
                this.$localStorage.set("listDetailsSort-" + this.listId, this.sort);
            };
            MyListDetailController.prototype.initFilter = function () {
                var _this = this;
                this.$scope.filter = function (wishListLine) {
                    var searchTermInLowerCase = _this.searchTerm.toLowerCase();
                    return wishListLine.shortDescription.toLowerCase().indexOf(searchTermInLowerCase) > -1 ||
                        wishListLine.erpNumber.toLowerCase().indexOf(searchTermInLowerCase) > -1 ||
                        wishListLine.manufacturerItem.toLowerCase().indexOf(searchTermInLowerCase) > -1;
                };
            };
            MyListDetailController.prototype.updateSortOrder = function () {
                var _this = this;
                this.listModel.wishListLineCollection.forEach(function (line, index) {
                    line.sortOrder = index;
                });
                this.orderIsSaving = true;
                this.wishListService.updateWishList(this.listModel).then(function (wishList) { _this.orderIsSaving = false; }, function (error) { _this.orderIsSaving = false; });
            };
            MyListDetailController.prototype.openSharePopup = function () {
                this.shareListPopupService.display({
                    step: "",
                    list: this.listModel,
                    session: this.session,
                    customBackStep: null
                });
            };
            MyListDetailController.prototype.calculateCheckedItems = function () {
                this.checkedItemsCount = 0;
                this.canPutAnySelectedToCart = false;
                if (!this.listModel || !this.listModel.wishListLineCollection) {
                    return;
                }
                for (var i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                    if (this.checkStorage[this.listModel.wishListLineCollection[i].id.toString()]) {
                        this.checkedItemsCount++;
                        if (this.listModel.wishListLineCollection[i].canAddToCart) {
                            this.canPutAnySelectedToCart = true;
                        }
                    }
                }
            };
            MyListDetailController.prototype.closeModal = function (selector) {
                this.coreService.closeModal(selector);
            };
            MyListDetailController.prototype.setListItem = function (wishListLine) {
                this.selectedListLines = [wishListLine];
                this.editNote = !!wishListLine.notes;
                this.listLineNote = wishListLine.notes;
            };
            MyListDetailController.prototype.deleteListItem = function () {
                this.spinnerService.show();
                this.closeModal("#popup-delete-item");
                if (this.selectedListLines.length === 1) {
                    this.deleteLine(this.selectedListLines[0]);
                }
                else {
                    this.deleteLines(this.listModel, this.selectedListLines);
                }
            };
            MyListDetailController.prototype.deleteLines = function (list, lines) {
                var _this = this;
                if (this.inProgress) {
                    return;
                }
                this.inProgress = true;
                this.wishListService.deleteLineCollection(list, lines).then(function (wishListLineCollection) {
                    _this.deleteLineCollectionCompleted(wishListLineCollection);
                }, function (error) { _this.deleteLineCollectionFailed(error); });
            };
            MyListDetailController.prototype.deleteLineCollectionCompleted = function (wishListLineCollection) {
                this.getList();
            };
            MyListDetailController.prototype.deleteLineCollectionFailed = function (error) {
            };
            MyListDetailController.prototype.deleteSelectedItems = function () {
                this.selectedListLines = [];
                for (var i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                    if (this.checkStorage[this.listModel.wishListLineCollection[i].id.toString()]) {
                        this.selectedListLines.push(this.listModel.wishListLineCollection[i]);
                    }
                }
            };
            MyListDetailController.prototype.deleteList = function (navigateTo) {
                var _this = this;
                this.wishListService.deleteWishList(this.listModel).then(function (wishList) { _this.deleteWishListCompleted(navigateTo, wishList); }, function (error) { _this.deleteWishListFailed(error); });
            };
            MyListDetailController.prototype.deleteWishListCompleted = function (navigateTo, wishList) {
                this.closeModal("#popup-delete-list");
                this.spinnerService.show();
                this.coreService.redirectToPath(navigateTo);
            };
            MyListDetailController.prototype.deleteWishListFailed = function (error) {
            };
            MyListDetailController.prototype.selectAll = function () {
                if (this.isAllSelected()) {
                    this.checkStorage = {};
                }
                else {
                    for (var i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                        this.checkStorage[this.listModel.wishListLineCollection[i].id.toString()] = true;
                    }
                }
            };
            MyListDetailController.prototype.isAllSelected = function () {
                return this.checkedItemsCount === this.listModel.wishListLineCollection.length;
            };
            MyListDetailController.prototype.checkProduct = function (productLineId) {
                if (this.checkStorage[productLineId.toString()]) {
                    delete this.checkStorage[productLineId.toString()];
                }
                else {
                    this.checkStorage[productLineId.toString()] = true;
                }
            };
            MyListDetailController.prototype.isProductChecked = function (productLineId) {
                return !!this.checkStorage[productLineId.toString()];
            };
            MyListDetailController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.productSettings = settingsCollection.productSettings;
                this.listSettings = settingsCollection.wishListSettings;
                if (this.listId) {
                    this.getList();
                }
            };
            MyListDetailController.prototype.getSettingsFailed = function (error) {
            };
            MyListDetailController.prototype.getSessionCompleted = function (session) {
                this.currencySymbol = session.currency.currencySymbol;
                this.session = session;
            };
            MyListDetailController.prototype.getSessionFailed = function (error) {
            };
            MyListDetailController.prototype.getList = function () {
                var _this = this;
                this.inProgress = true;
                this.spinnerService.show();
                this.wishListService.getListById(this.listId, "hiddenproducts,getalllines").then(function (listModel) { _this.getListCompleted(listModel); }, function (error) { _this.getListFailed(error); });
            };
            MyListDetailController.prototype.calculateListTotal = function () {
                this.listTotal = 0;
                for (var i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                    var product = this.wishListService.mapWishlistLineToProduct(this.listModel.wishListLineCollection[i]);
                    if (product.pricing) {
                        var unitNetPrice = this.productPriceService.getUnitNetPrice(product).price;
                        var extendedNetPrice = Math.round(unitNetPrice *
                            product.qtyOrdered *
                            100) /
                            100;
                        this.listTotal += extendedNetPrice;
                    }
                }
                this.listTotal = Math.round(this.listTotal * 100) / 100;
            };
            MyListDetailController.prototype.removeHiddenProducts = function () {
                var outOfStock = 2;
                this.notAvailableProducts = [];
                this.notVisibleProducts = [];
                if (!this.listModel.wishListLineCollection || this.listModel.wishListLineCollection.length === 0) {
                    return;
                }
                this.notAvailableProducts =
                    this.listModel.wishListLineCollection.filter(function (o) { return !o.isActive || (o.isDiscontinued && o.availability.messageType === outOfStock); });
                var inactiveProductIds = this.notAvailableProducts.map(function (o) { return o.id; });
                this.notVisibleProducts =
                    this.listModel.wishListLineCollection.filter(function (o) { return !o.isVisible &&
                        inactiveProductIds.indexOf(o.id) === -1; });
                this.listModel.wishListLinesCount -= (this.notAvailableProducts.length + this.notVisibleProducts.length);
                this.listModel.wishListLineCollection =
                    this.listModel.wishListLineCollection.filter(function (o) { return o.isActive && (!o.isDiscontinued || o.availability.messageType !== outOfStock) && o.isVisible; });
            };
            MyListDetailController.prototype.getListCompleted = function (listModel) {
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
                this.$timeout(function () { return angular.element(document).foundation("dropdown", "reflow"); }, 0);
            };
            MyListDetailController.prototype.getListFailed = function (error) {
                this.spinnerService.hide();
            };
            MyListDetailController.prototype.getRealTimePrices = function () {
                var _this = this;
                if (this.productSettings.realTimePricing && this.listModel.wishListLineCollection != null) {
                    var products = this.wishListService.mapWishListLinesToProducts(this.listModel.wishListLineCollection);
                    this.productService.getProductRealTimePrices(products).then(function (pricingResult) { _this.handleRealTimePricesCompleted(pricingResult); }, function (reason) { _this.handleRealtimePricesFailed(reason); });
                }
            };
            MyListDetailController.prototype.handleRealTimePricesCompleted = function (result) {
                var _this = this;
                result.realTimePricingResults.forEach(function (productPrice) {
                    var wishlistLine = _this.listModel.wishListLineCollection.find(function (p) { return p.productId === productPrice.productId &&
                        p.unitOfMeasure === productPrice.unitOfMeasure; });
                    wishlistLine.pricing = productPrice;
                });
                this.calculateListTotal();
                if (this.productSettings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
            };
            MyListDetailController.prototype.handleRealtimePricesFailed = function (reason) {
                this.failedToGetRealTimePrices = true;
                if (this.productSettings.inventoryIncludedWithPricing) {
                    this.failedToGetRealTimeInventory = true;
                }
            };
            MyListDetailController.prototype.getRealTimeInventory = function () {
                var _this = this;
                if (this.productSettings.realTimeInventory && this.listModel.wishListLineCollection != null) {
                    var products = this.listModel.wishListLineCollection.map(function (wishlistLine) { return _this.wishListService.mapWishlistLineToProduct(wishlistLine); });
                    this.productService.getProductRealTimeInventory(products).then(function (inventoryResult) {
                        _this.handleRealTimeInventoryCompleted(inventoryResult);
                    }, function (reason) { _this.handleRealtimeInventoryFailed(reason); });
                }
            };
            MyListDetailController.prototype.handleRealTimeInventoryCompleted = function (result) {
                this.wishListService.applyRealTimeInventoryResult(this.listModel, result);
            };
            MyListDetailController.prototype.handleRealtimeInventoryFailed = function (reason) {
                this.failedToGetRealTimeInventory = true;
            };
            MyListDetailController.prototype.addAllToCart = function (wishList) {
                var _this = this;
                this.inProgress = true;
                this.cartService.addWishListToCart(wishList.id, true).then(function (cartLineCollection) {
                    _this.addLineCollectionCompleted(cartLineCollection);
                }, function (error) { _this.addLineCollectionFailed(error); });
            };
            MyListDetailController.prototype.addLineCollectionCompleted = function (cartLineCollection) {
                this.inProgress = false;
            };
            MyListDetailController.prototype.addLineCollectionFailed = function (error) {
                this.inProgress = false;
            };
            MyListDetailController.prototype.updateLine = function (line) {
                var _this = this;
                if (line.qtyOrdered > 0) {
                    this.wishListService.updateLine(line).then(function (wishListLine) { _this.updateLineCompleted(wishListLine); }, function (error) { _this.updateLineFailed(error); });
                }
            };
            MyListDetailController.prototype.deleteLine = function (line) {
                var _this = this;
                if (this.inProgress) {
                    return;
                }
                this.inProgress = true;
                this.wishListService.deleteLine(line).then(function (wishListLine) { _this.deleteLineCompleted(wishListLine); }, function (error) { _this.deleteLineFailed(error); });
            };
            MyListDetailController.prototype.deleteLineCompleted = function (wishListLine) {
                this.getList();
            };
            MyListDetailController.prototype.deleteLineFailed = function (error) {
            };
            MyListDetailController.prototype.updateLineCompleted = function (wishListLine) {
                this.getList();
            };
            MyListDetailController.prototype.updateLineFailed = function (error) {
            };
            MyListDetailController.prototype.quantityKeyPress = function (line) {
                this.updateLine(line);
            };
            MyListDetailController.prototype.addSelectedToCart = function () {
                var _this = this;
                var lines = [];
                for (var i = 0; i < this.listModel.wishListLineCollection.length; i++) {
                    if (this.listModel.wishListLineCollection[i].canAddToCart &&
                        this.checkStorage[this.listModel.wishListLineCollection[i].id.toString()]) {
                        lines.push(this.listModel.wishListLineCollection[i]);
                    }
                }
                this.cartService.addLineCollection(lines, true).then(function (cartLineCollection) {
                    _this.addLineCollectionCompleted(cartLineCollection);
                }, function (error) { _this.addLineCollectionFailed(error); });
            };
            MyListDetailController.prototype.addLineToCart = function (line) {
                var _this = this;
                this.cartService.addLine(line, true).then(function (cartLine) { _this.addLineCompleted(cartLine); }, function (error) { _this.addLineFailed(error); });
            };
            MyListDetailController.prototype.addLineCompleted = function (cartLine) {
            };
            MyListDetailController.prototype.addLineFailed = function (error) {
            };
            MyListDetailController.prototype.allQtysIsValid = function () {
                if (!this.listModel || !this.listModel.wishListLineCollection) {
                    return false;
                }
                return this.listModel.wishListLineCollection.every(function (wishListLine) {
                    return wishListLine.qtyOrdered && parseFloat(wishListLine.qtyOrdered.toString()) > 0;
                });
            };
            MyListDetailController.prototype.changeUnitOfMeasure = function (line) {
                var _this = this;
                var product = this.wishListService.mapWishlistLineToProduct(line);
                this.productService.changeUnitOfMeasure(product).then(function (productDto) { _this.changeUnitOfMeasureCompleted(line, productDto); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            MyListDetailController.prototype.changeUnitOfMeasureCompleted = function (line, productDto) {
                line = this.wishListService.mapProductToWishlistLine(productDto, line);
                if (!productDto.quoteRequired) {
                    line.pricing = productDto.pricing;
                }
                this.updateLine(line);
                this.wishListService.updateAvailability(line);
            };
            MyListDetailController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            MyListDetailController.prototype.deleteNote = function () {
                this.listLineNote = "";
                this.saveNote();
            };
            MyListDetailController.prototype.saveNote = function () {
                var _this = this;
                this.noteErrorMessage = "";
                if (!this.noteForm.$valid) {
                    return;
                }
                this.spinnerService.show();
                this.selectedListLines[0].notes = this.listLineNote;
                this.wishListService.updateLine(this.selectedListLines[0]).then(function (wishListLine) { _this.updateLineNoteCompleted(wishListLine); }, function (error) { _this.updateLineNoteFailed(error); });
            };
            MyListDetailController.prototype.updateLineNoteCompleted = function (wishListLine) {
                this.closeModal("#popup-line-note");
                this.selectedListLines[0].notes = wishListLine.notes;
                this.spinnerService.hide();
            };
            MyListDetailController.prototype.updateLineNoteFailed = function (error) {
                this.spinnerService.hide();
            };
            MyListDetailController.prototype.leaveList = function (navigateTo) {
                var _this = this;
                this.wishListService.deleteWishListShare(this.listModel).then(function (wishList) { _this.leaveListCompleted(navigateTo, wishList); }, function (error) { _this.leaveListFailed(error); });
            };
            MyListDetailController.prototype.leaveListCompleted = function (navigateTo, wishList) {
                this.closeModal("#popup-leave-list");
                this.spinnerService.show();
                this.coreService.redirectToPath(navigateTo);
            };
            MyListDetailController.prototype.leaveListFailed = function (error) {
            };
            MyListDetailController.prototype.removeProducts = function (productLines) {
                this.spinnerService.show();
                if (productLines.length === 1) {
                    this.deleteLine(productLines[0]);
                }
                else {
                    this.deleteLines(this.listModel, productLines);
                }
            };
            MyListDetailController.prototype.hideNotVisibleProductsNotification = function () {
                this.hideNotVisibleProducts = true;
                this.notVisibleProducts = [];
            };
            MyListDetailController.prototype.openUploadListPopup = function (wishList) {
                this.uploadToListPopupService.display(wishList);
            };
            MyListDetailController.prototype.onEnterKeyPressedInAutocomplete = function () {
                var autocomplete = $("#qo-search-widget").data("kendoAutoComplete");
                if (autocomplete && autocomplete._last === kendo.keys.ENTER && autocomplete.listView.selectedDataItems().length === 0) {
                    this.searchProduct(this.addingSearchTerm);
                }
            };
            MyListDetailController.prototype.searchProduct = function (erpNumber) {
                var _this = this;
                if (!erpNumber || erpNumber.length === 0) {
                    return;
                }
                this.findProduct(erpNumber).then(function (productCollection) { _this.addProductCompleted(productCollection); }, function (error) { _this.addProductFailed(error); });
            };
            MyListDetailController.prototype.findProduct = function (erpNumber) {
                var parameters = { extendedNames: [erpNumber] };
                return this.productService.getProducts(parameters);
            };
            MyListDetailController.prototype.addProductCompleted = function (productCollection) {
                this.validateAndSetProduct(productCollection);
            };
            MyListDetailController.prototype.addProductFailed = function (error) {
                this.setErrorMessage(angular.element("#messageNotFound").val());
            };
            MyListDetailController.prototype.initializeAutocomplete = function () {
                var _this = this;
                this.autocompleteOptions = this.searchService.getProductAutocompleteOptions(function () { return _this.addingSearchTerm; });
                this.autocompleteOptions.template =
                    this.searchService.getProductAutocompleteTemplate(function () { return _this.addingSearchTerm; }, "tst_ListWidget_autocomplete");
                this.autocompleteOptions.select = this.onAutocompleteOptionsSelect();
            };
            MyListDetailController.prototype.onAutocompleteOptionsSelect = function () {
                var _this = this;
                return function (event) {
                    var dataItem = event.sender.dataItem(event.item.index());
                    _this.searchProduct(dataItem.erpNumber);
                };
            };
            MyListDetailController.prototype.toggleAddToListSection = function () {
                this.isAddToListSectionVisible = !this.isAddToListSectionVisible;
            };
            MyListDetailController.prototype.addProductToList = function (productToAdd) {
                var _this = this;
                if (!productToAdd || !productToAdd.id) {
                    if (this.addingSearchTerm) {
                        this.findProduct(this.addingSearchTerm).then(function (productCollection) { _this.findProductCompleted(productCollection); }, function (error) { _this.findProductFailed(error); });
                    }
                    else {
                        this.setErrorMessage(angular.element("#messageEnterProductName").val());
                    }
                    return;
                }
                this.addToList(productToAdd);
            };
            MyListDetailController.prototype.findProductCompleted = function (productCollection) {
                if (this.validateAndSetProduct(productCollection)) {
                    this.addToList(this.itemToAdd);
                }
            };
            MyListDetailController.prototype.findProductFailed = function (error) {
                this.setErrorMessage(angular.element("#messageNotFound").val());
            };
            MyListDetailController.prototype.addToList = function (productToAdd) {
                var _this = this;
                var listLineContainsCurrentProduct = this.listModel.wishListLineCollection.filter(function (item) {
                    return item.productId === productToAdd.id && item.unitOfMeasure === productToAdd.selectedUnitOfMeasure;
                });
                if (listLineContainsCurrentProduct && listLineContainsCurrentProduct.length > 0) {
                    this.setErrorMessage(angular.element("#alreadyInList").val());
                    return;
                }
                this.isAddingToList = true;
                this.wishListService.addWishListLine(this.listModel, productToAdd).then(function (data) { _this.addProductToListCompleted(data); }, function (error) { _this.addProductToListFailed(error); });
            };
            MyListDetailController.prototype.validateAndSetProduct = function (productCollection) {
                var product = productCollection.products[0];
                if (this.validateProduct(product)) {
                    var originalQty = (this.itemToAdd ? this.itemToAdd.qtyOrdered : 1) || 1;
                    product.qtyOrdered = originalQty < product.minimumOrderQty ? product.minimumOrderQty : originalQty;
                    this.selectedQty = product.qtyOrdered;
                    this.itemToAdd = product;
                    this.errorMessage = "";
                    this.successMessage = "";
                    return true;
                }
                return false;
            };
            MyListDetailController.prototype.validateProduct = function (product) {
                if (product.canConfigure || (product.isConfigured && !product.isFixedConfiguration)) {
                    this.setErrorMessage(angular.element("#messageConfigurableProduct").val());
                    return false;
                }
                if (product.isStyleProductParent) {
                    this.setErrorMessage(angular.element("#messageStyledProduct").val());
                    return false;
                }
                return true;
            };
            MyListDetailController.prototype.addProductToListCompleted = function (wishListLineModel) {
                this.getList();
                this.isAddingToList = false;
                this.addingSearchTerm = "";
                this.itemToAdd = { qtyOrdered: (this.itemToAdd ? this.itemToAdd.qtyOrdered : 1) };
                this.setSuccessMessage(angular.element("#messageAddedProduct").val());
            };
            MyListDetailController.prototype.addProductToListFailed = function (error) {
                this.isAddingToList = false;
            };
            MyListDetailController.prototype.setErrorMessage = function (message) {
                this.errorMessage = message;
                this.successMessage = "";
                this.initHideMessageTimeout();
            };
            MyListDetailController.prototype.setSuccessMessage = function (message) {
                this.errorMessage = "";
                this.successMessage = message;
                this.initHideMessageTimeout();
            };
            MyListDetailController.prototype.initHideMessageTimeout = function () {
                var _this = this;
                this.$timeout.cancel(this.messageTimeout);
                this.messageTimeout = this.$timeout(function () {
                    _this.successMessage = "";
                    _this.errorMessage = "";
                }, 2000);
            };
            MyListDetailController.prototype.getUomDisplayValue = function (uom) {
                if (!uom) {
                    return "";
                }
                var name = uom.description ? uom.description : uom.unitOfMeasureDisplay;
                var qtyPerBaseUnitOfMeasure = uom.qtyPerBaseUnitOfMeasure !== 1 ? "/" + uom.qtyPerBaseUnitOfMeasure : "";
                return "" + name + qtyPerBaseUnitOfMeasure;
            };
            MyListDetailController.prototype.addingSearchTermChanged = function () {
                this.successMessage = "";
                this.errorMessage = "";
                var originalQty = this.itemToAdd ? this.itemToAdd.qtyOrdered : 1;
                this.itemToAdd = { qtyOrdered: originalQty };
            };
            MyListDetailController.prototype.checkPrint = function (event) {
                if (this.orderIsSaving) {
                    event.preventDefault();
                }
            };
            MyListDetailController.$inject = [
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
            return MyListDetailController;
        }());
        wishlist.MyListDetailController = MyListDetailController;
        angular
            .module("insite")
            .controller("MyListDetailController", MyListDetailController);
    })(wishlist = insite.wishlist || (insite.wishlist = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.my-list-detail.controller.js.map