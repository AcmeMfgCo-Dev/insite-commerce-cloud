var insite;
(function (insite) {
    var quickorder;
    (function (quickorder) {
        "use strict";
        var QuickOrderController = /** @class */ (function () {
            function QuickOrderController(cartService, productService, searchService, settingsService) {
                this.cartService = cartService;
                this.productService = productService;
                this.searchService = searchService;
                this.settingsService = settingsService;
                this.addingToCart = false;
                this.init();
            }
            QuickOrderController.prototype.init = function () {
                this.product = null;
                this.alternateUnitsOfMeasure = true;
                this.canAddToCart = true;
                this.findingProduct = false;
                this.selectedUnitOfMeasure = "EA";
                this.selectedQty = 1;
                this.getSettings();
                this.initializeAutocomplete();
            };
            QuickOrderController.prototype.initializeAutocomplete = function () {
                var _this = this;
                this.autocompleteOptions = this.searchService.getProductAutocompleteOptions(function () { return _this.searchTerm; });
                this.autocompleteOptions.template = this.searchService.getProductAutocompleteTemplate(function () { return _this.searchTerm; }, "tst_quickOrderWidget_autocomplete");
                this.autocompleteOptions.select = this.onAutocompleteOptionsSelect();
            };
            QuickOrderController.prototype.onAutocompleteOptionsSelect = function () {
                var _this = this;
                return function (event) {
                    var dataItem = event.sender.dataItem(event.item.index());
                    _this.addProduct(dataItem.erpNumber);
                };
            };
            QuickOrderController.prototype.getSettings = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settings) { _this.getSettingsCompleted(settings); }, function (error) { _this.getSettingsFailed(error); });
            };
            QuickOrderController.prototype.getSettingsCompleted = function (settings) {
                this.orderSettings = settings.orderSettings;
                this.alternateUnitsOfMeasureFromSettings = settings.productSettings.alternateUnitsOfMeasure;
            };
            QuickOrderController.prototype.getSettingsFailed = function (error) {
            };
            QuickOrderController.prototype.addProduct = function (erpNumber) {
                var _this = this;
                if (!erpNumber || erpNumber.length === 0) {
                    return;
                }
                this.findProduct(erpNumber).then(function (productCollection) { _this.addProductCompleted(productCollection); }, function (error) { _this.addProductFailed(error); });
            };
            QuickOrderController.prototype.addProductCompleted = function (productCollection) {
                this.findingProduct = false;
                this.validateAndSetProduct(productCollection);
            };
            QuickOrderController.prototype.addProductFailed = function (error) {
                this.findingProduct = false;
                this.errorMessage = angular.element("#messageNotFound").val();
            };
            QuickOrderController.prototype.validateAndSetProduct = function (productCollection) {
                var product = productCollection.products[0];
                if (this.validateProduct(product)) {
                    product.qtyOrdered = product.minimumOrderQty || 1;
                    this.selectedQty = product.qtyOrdered;
                    this.product = product;
                    this.errorMessage = "";
                    return true;
                }
                else {
                    return false;
                }
            };
            QuickOrderController.prototype.findProduct = function (erpNumber) {
                this.findingProduct = true;
                var parameters = { extendedNames: [erpNumber] };
                var expand = ["pricing"];
                return this.productService.getProducts(parameters, expand);
            };
            QuickOrderController.prototype.validateProduct = function (product) {
                if (product.canConfigure || (product.isConfigured && !product.isFixedConfiguration)) {
                    this.errorMessage = angular.element("#messageConfigurableProduct").val();
                    return false;
                }
                if (product.isStyleProductParent) {
                    this.errorMessage = angular.element("#messageStyledProduct").val();
                    return false;
                }
                if (!product.canAddToCart) {
                    this.errorMessage = angular.element("#messageUnavailable").val();
                    return false;
                }
                return true;
            };
            QuickOrderController.prototype.onEnterKeyPressedInAutocomplete = function () {
                var autocomplete = $("#qo-search-widget").data("kendoAutoComplete");
                if (autocomplete._last === kendo.keys.ENTER && autocomplete.listView.selectedDataItems().length === 0) {
                    this.addProduct(this.searchTerm);
                }
            };
            QuickOrderController.prototype.changeUnitOfMeasure = function (product) {
                var _this = this;
                if (!product.productUnitOfMeasures) {
                    return;
                }
                // this calls to get a new price and updates the product which updates the ui
                product.selectedUnitOfMeasure = this.selectedUnitOfMeasure;
                this.productService.changeUnitOfMeasure(product).then(function (productResult) { _this.changeUnitOfMeasureCompleted(productResult); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            QuickOrderController.prototype.changeUnitOfMeasureCompleted = function (product) {
            };
            QuickOrderController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            QuickOrderController.prototype.addToCart = function (product) {
                var _this = this;
                this.addingToCart = true;
                if (!product) {
                    if (!this.searchTerm) {
                        this.errorMessage = angular.element("#messageEnterProduct").val();
                        this.addingToCart = false;
                        return;
                    }
                    // get the product and add it all at once
                    this.findProduct(this.searchTerm).then(function (productCollection) { _this.addToCartCompleted(productCollection); }, function (error) { _this.addToCartFailed(error); });
                }
                else {
                    this.product.qtyOrdered = this.selectedQty;
                    this.addToCartAndClearInput(this.product);
                }
            };
            QuickOrderController.prototype.addToCartCompleted = function (productCollection) {
                this.findingProduct = false;
                this.addingToCart = false;
                if (this.validateAndSetProduct(productCollection)) {
                    this.product.qtyOrdered = this.selectedQty;
                    this.addToCartAndClearInput(this.product);
                }
            };
            QuickOrderController.prototype.addToCartFailed = function (error) {
                this.findingProduct = false;
                this.addingToCart = false;
                this.errorMessage = angular.element("#messageNotFound").val();
            };
            QuickOrderController.prototype.addToCartAndClearInput = function (product) {
                if (product.qtyOrdered === 0) {
                    product.qtyOrdered = product.minimumOrderQty || 1;
                }
                this.addLineFromProduct(product, null, null, true);
            };
            QuickOrderController.prototype.addLineFromProduct = function (product, configuration, productSubscription, toCurrentCart) {
                var _this = this;
                this.cartService.addLineFromProduct(product, configuration, productSubscription, toCurrentCart).then(function (cartLine) { _this.addLineFromProductCompleted(cartLine); }, function (error) { _this.addLineFromProductFailed(error); });
            };
            QuickOrderController.prototype.addLineFromProductCompleted = function (cartLine) {
                this.addingToCart = false;
                this.searchTerm = "";
                this.selectedUnitOfMeasure = "EA";
                this.product = null;
                this.selectedQty = 1;
            };
            QuickOrderController.prototype.addLineFromProductFailed = function (error) {
                this.addingToCart = false;
            };
            QuickOrderController.$inject = ["cartService", "productService", "searchService", "settingsService"];
            return QuickOrderController;
        }());
        quickorder.QuickOrderController = QuickOrderController;
        angular
            .module("insite")
            .controller("QuickOrderController", QuickOrderController);
    })(quickorder = insite.quickorder || (insite.quickorder = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.quick-order.controller.js.map