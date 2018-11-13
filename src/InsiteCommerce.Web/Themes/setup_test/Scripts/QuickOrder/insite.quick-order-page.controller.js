var insite;
(function (insite) {
    var quickorder;
    (function (quickorder) {
        "use strict";
        var QuickOrderPageController = /** @class */ (function () {
            function QuickOrderPageController($scope, $filter, coreService, cartService, productService, searchService, settingsService, addToWishlistPopupService) {
                this.$scope = $scope;
                this.$filter = $filter;
                this.coreService = coreService;
                this.cartService = cartService;
                this.productService = productService;
                this.searchService = searchService;
                this.settingsService = settingsService;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.canAddAllToList = false;
                this.init();
            }
            QuickOrderPageController.prototype.init = function () {
                this.products = [];
                this.getSettings();
                this.initializeAutocomplete();
                this.initCanAddAllToList();
            };
            QuickOrderPageController.prototype.initCanAddAllToList = function () {
                var _this = this;
                this.$scope.$watch(function () { return _this.products; }, function (newValue) {
                    _this.canAddAllToList = _this.products.every(function (l) { return l.canAddToWishlist; });
                }, true);
            };
            QuickOrderPageController.prototype.addAllToList = function () {
                var products = [];
                for (var i = 0; i < this.products.length; i++) {
                    if (!this.products[i].canAddToWishlist) {
                        continue;
                    }
                    products.push(this.products[i]);
                }
                this.addToWishlistPopupService.display(products);
            };
            QuickOrderPageController.prototype.initializeAutocomplete = function () {
                var _this = this;
                this.autocompleteOptions = this.searchService.getProductAutocompleteOptions(function () { return _this.searchTerm; });
                this.autocompleteOptions.template = this.searchService.getProductAutocompleteTemplate(function () { return _this.searchTerm; }, "tst_quickOrder_autocomplete");
                this.autocompleteOptions.select = this.onAutocompleteOptionsSelect();
            };
            QuickOrderPageController.prototype.onAutocompleteOptionsSelect = function () {
                var _this = this;
                return function (evt) {
                    var dataItem = evt.sender.dataItem(evt.item.index());
                    _this.lookupAndAddProductById(dataItem.id);
                };
            };
            QuickOrderPageController.prototype.getSettings = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
            };
            QuickOrderPageController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.productSettings;
                this.orderSettings = settingsCollection.orderSettings;
            };
            QuickOrderPageController.prototype.getSettingsFailed = function (error) {
            };
            QuickOrderPageController.prototype.onEnterKeyPressedInAutocomplete = function () {
                var autocomplete = $("#qo-search-view").data("kendoAutoComplete");
                if (autocomplete._last === kendo.keys.ENTER && autocomplete.listView.selectedDataItems().length === 0) {
                    this.lookupAndAddProductBySearchTerm(this.searchTerm);
                }
            };
            QuickOrderPageController.prototype.lookupAndAddProductById = function (id) {
                var _this = this;
                var expandParameter = ["pricing"];
                this.productService.getProduct(null, id, expandParameter).then(function (product) { _this.getProductCompleted(product); }, function (error) { _this.getProductFailed(error); });
            };
            QuickOrderPageController.prototype.getProductCompleted = function (product) {
                // TODO ISC-4519
                // TODO we may need to refresh the foundation tooltip, used to be insite.core.refreshFoundationUI
                this.addProduct(product.product);
            };
            QuickOrderPageController.prototype.getProductFailed = function (error) {
                this.errorMessage = angular.element("#messageNotFound").val();
            };
            QuickOrderPageController.prototype.lookupAndAddProductBySearchTerm = function (searchTerm) {
                var _this = this;
                var parameter = { extendedNames: [searchTerm] };
                var expandParameter = ["pricing"];
                this.productService.getProducts(parameter, expandParameter).then(function (productCollection) { _this.getProductsCompleted(productCollection); }, function (error) { _this.getProductsFailed(error); });
            };
            QuickOrderPageController.prototype.getProductsCompleted = function (productCollection) {
                // TODO ISC-4519
                // TODO we may need to refresh the foundation tooltip, used to be insite.core.refreshFoundationUI
                this.addProduct(productCollection.products[0]);
            };
            QuickOrderPageController.prototype.getProductsFailed = function (error) {
                this.errorMessage = angular.element("#messageNotFound").val();
            };
            QuickOrderPageController.prototype.addProduct = function (product) {
                var _this = this;
                if (!this.canProductBeQuickOrdered(product)) {
                    return;
                }
                var productExists = false;
                for (var i = 0; i < this.products.length; i++) {
                    if (this.products[i].id === product.id && this.products[i].unitOfMeasure === product.unitOfMeasure) {
                        this.products[i].qtyOrdered++;
                        productExists = true;
                        if (this.settings.realTimePricing) {
                            this.showPriceSpinner(this.products[i]);
                            this.productService.getProductRealTimePrices([this.products[i]]).then(function (realTimePricing) { _this.getProductRealTimePricesCompleted(realTimePricing); }, function (error) { _this.getProductRealTimePricesFailed(error); });
                        }
                        else {
                            this.productService.getProductPrice(this.products[i]).then(function (productPrice) { _this.getProductPriceCompleted(productPrice); }, function (error) { _this.getProductPriceFailed(error); });
                        }
                        break;
                    }
                }
                if (!productExists) {
                    product.qtyOrdered = product.minimumOrderQty || 1;
                    product.uuid = guidHelper.generateGuid(); // tack on a guid to use as an id for the quantity break pricing tooltip
                    this.products.push(product);
                }
                this.searchTerm = "";
                this.errorMessage = "";
                if (this.settings.realTimePricing && !product.quoteRequired && !productExists) {
                    this.productService.getProductRealTimePrices([product]).then(function (pricingResult) { return _this.getProductRealTimePricesCompleted(pricingResult); }, function (reason) { return _this.getProductRealTimePricesFailed(reason); });
                }
            };
            QuickOrderPageController.prototype.canProductBeQuickOrdered = function (product) {
                if (product.canConfigure || (product.isConfigured && !product.isFixedConfiguration)) {
                    this.errorMessage = angular.element("#messageConfigurableProduct").val();
                    return false;
                }
                if (product.isStyleProductParent) {
                    this.errorMessage = angular.element("#messageStyledProduct").val();
                    return false;
                }
                if (!product.canAddToCart) {
                    if (product.isDiscontinued && product.replacementProductId) {
                        this.lookupAndAddProductById(product.replacementProductId.toString());
                    }
                    else {
                        this.errorMessage = angular.element("#messageUnavailable").val();
                    }
                    return false;
                }
                return true;
            };
            QuickOrderPageController.prototype.changeUnitOfMeasure = function (product) {
                var _this = this;
                if (!product.productUnitOfMeasures) {
                    return;
                }
                for (var i = 0; i < this.products.length; i++) {
                    if (this.products[i].id === product.id && this.products[i].unitOfMeasure === product.selectedUnitOfMeasure) {
                        product.qtyOrdered = parseFloat(product.qtyOrdered.toString()) + parseFloat(this.products[i].qtyOrdered.toString());
                        this.products.splice(i, 1);
                        break;
                    }
                }
                // this calls to get a new price and updates the product which updates the ui
                this.productService.changeUnitOfMeasure(product).then(function (productResult) { _this.changeUnitOfMeasureCompleted(productResult); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            QuickOrderPageController.prototype.changeUnitOfMeasureCompleted = function (product) {
            };
            QuickOrderPageController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            QuickOrderPageController.prototype.quantityInput = function (product) {
                var _this = this;
                if (this.settings.realTimePricing) {
                    this.showPriceSpinner(product);
                    this.productService.getProductRealTimePrices([product]).then(function (realTimePricing) { _this.getProductRealTimePricesCompleted(realTimePricing); }, function (error) { _this.getProductRealTimePricesFailed(error); });
                }
                else {
                    this.productService.getProductPrice(product).then(function (productPrice) { _this.getProductPriceCompleted(productPrice); }, function (error) { _this.getProductPriceFailed(error); });
                }
            };
            QuickOrderPageController.prototype.getProductRealTimePricesCompleted = function (realTimePricing) {
            };
            QuickOrderPageController.prototype.getProductRealTimePricesFailed = function (error) {
                this.products.forEach(function (p) { return p.pricing.failedToGetRealTimePrices = true; });
            };
            QuickOrderPageController.prototype.getProductPriceCompleted = function (productPrice) {
            };
            QuickOrderPageController.prototype.getProductPriceFailed = function (error) {
            };
            QuickOrderPageController.prototype.showPriceSpinner = function (product) {
                if (product.pricing === null) {
                    product.pricing = {
                        requiresRealTimePrice: true
                    };
                }
                else {
                    product.pricing.requiresRealTimePrice = true;
                }
            };
            QuickOrderPageController.prototype.addAllToCart = function (redirectUrl) {
                var _this = this;
                this.cartService.addLineCollectionFromProducts(this.products, true).then(function (cartLines) { _this.addAllToCartCompleted(cartLines, redirectUrl); }, function (error) { _this.addAllToCartFailed(error); });
            };
            QuickOrderPageController.prototype.addAllToCartCompleted = function (cartLines, redirectUrl) {
                this.coreService.redirectToPath(redirectUrl);
            };
            QuickOrderPageController.prototype.addAllToCartFailed = function (error) {
            };
            QuickOrderPageController.prototype.allQtysIsValid = function () {
                return this.products.every(function (product) {
                    return product.qtyOrdered && parseFloat(product.qtyOrdered.toString()) > 0;
                });
            };
            QuickOrderPageController.prototype.removeProduct = function (product) {
                this.products.splice(this.products.indexOf(product), 1);
            };
            QuickOrderPageController.prototype.getTotal = function () {
                var total = 0;
                angular.forEach(this.products, function (product) {
                    if (!product.quoteRequired) {
                        total += product.pricing.extendedUnitNetPrice;
                    }
                });
                return total;
            };
            QuickOrderPageController.prototype.getCurrencySymbol = function () {
                var currencySymbol = "";
                var productsWithPricing = this.$filter("filter")(this.products, { quoteRequired: false });
                if (productsWithPricing.length) {
                    currencySymbol = productsWithPricing[0].currencySymbol;
                }
                return currencySymbol;
            };
            QuickOrderPageController.prototype.getDecimalSymbol = function () {
                var decimalSymbol = ".";
                var productsWithPricing = this.$filter("filter")(this.products, { quoteRequired: false, pricing: { extendedUnitNetPriceDisplay: !null } });
                if (productsWithPricing.length) {
                    var productPriceDisplay = productsWithPricing[0].pricing.extendedUnitNetPriceDisplay;
                    decimalSymbol = productPriceDisplay[productPriceDisplay.length - 3];
                }
                return decimalSymbol;
            };
            QuickOrderPageController.prototype.getDelimiterSymbol = function () {
                var delimiterSymbol = ".";
                var productsWithPricing = this.$filter("filter")(this.products, { quoteRequired: false, pricing: { extendedUnitNetPriceDisplay: !null } });
                if (productsWithPricing.length) {
                    var productPriceDisplay = productsWithPricing[0].pricing.extendedUnitNetPriceDisplay;
                    var matches = productPriceDisplay.substring(1, productPriceDisplay.length - 3).match(/[\D]/g);
                    if (matches && matches.length > 0) {
                        delimiterSymbol = matches[0] !== String.fromCharCode(160) ? matches[0] : " ";
                    }
                }
                return delimiterSymbol;
            };
            // returns the grand total of all lines prices, in the same currency format
            QuickOrderPageController.prototype.grandTotal = function () {
                var total = this.getTotal();
                var currencySymbol = this.getCurrencySymbol();
                var decimalSymbol = this.getDecimalSymbol();
                var delimiterSymbol = this.getDelimiterSymbol();
                var formattedTotal = currencySymbol + total.toFixed(2);
                if (decimalSymbol === ".") {
                    formattedTotal = formattedTotal.replace(/(\d)(?=(\d{3})+\.)/g, delimiterSymbol !== " " ? "$1," : "$1 ");
                }
                else {
                    formattedTotal = formattedTotal.replace(".", ",");
                    formattedTotal = formattedTotal.replace(/(\d)(?=(\d{3})+\,)/g, delimiterSymbol !== " " ? "$1." : "$1 ");
                }
                return formattedTotal;
            };
            QuickOrderPageController.prototype.showUnitOfMeasureLabel = function (product) {
                return product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !product.quoteRequired;
            };
            QuickOrderPageController.prototype.openWishListPopup = function (product) {
                this.addToWishlistPopupService.display([product]);
            };
            QuickOrderPageController.$inject = ["$scope", "$filter", "coreService", "cartService", "productService", "searchService", "settingsService", "addToWishlistPopupService"];
            return QuickOrderPageController;
        }());
        quickorder.QuickOrderPageController = QuickOrderPageController;
        angular
            .module("insite")
            .controller("QuickOrderPageController", QuickOrderPageController);
    })(quickorder = insite.quickorder || (insite.quickorder = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.quick-order-page.controller.js.map