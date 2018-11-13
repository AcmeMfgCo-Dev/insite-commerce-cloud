var insite;
(function (insite) {
    var order;
    (function (order_1) {
        "use strict";
        var RecentlyPurchasedController = /** @class */ (function () {
            function RecentlyPurchasedController(settingsService, orderService, productService, cartService, $scope) {
                this.settingsService = settingsService;
                this.orderService = orderService;
                this.productService = productService;
                this.cartService = cartService;
                this.$scope = $scope;
                this.pageSize = 5;
                this.maxProducts = 5;
                this.productItems = [];
                this.addingToCart = false;
                this.realTimePricing = false;
                this.failedToGetRealTimePrices = false;
                this.init();
            }
            RecentlyPurchasedController.prototype.init = function () {
                var _this = this;
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.$scope.$on("fulfillmentMethodChanged", function () {
                    _this.isOrdersLoaded = false;
                    _this.productItems = [];
                    if (_this.showOrders) {
                        _this.getRecentlyPurchasedItems();
                    }
                });
            };
            RecentlyPurchasedController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.showOrders = settingsCollection.orderSettings.showOrders;
                this.realTimePricing = settingsCollection.productSettings.realTimePricing;
                if (this.showOrders) {
                    this.getRecentlyPurchasedItems();
                }
            };
            RecentlyPurchasedController.prototype.getSettingsFailed = function (error) {
            };
            RecentlyPurchasedController.prototype.getRecentlyPurchasedItems = function (page) {
                var _this = this;
                if (page === void 0) { page = 1; }
                var filter = { sort: "CreatedOn DESC", expand: "orderlines" };
                var pagination = { page: page, pageSize: this.pageSize };
                this.isOrdersLoaded = false;
                this.orderService.getOrders(filter, pagination).then(function (orderCollection) { _this.getOrdersCompleted(orderCollection, page); }, function (error) { _this.getOrdersFailed(error); });
            };
            RecentlyPurchasedController.prototype.getOrdersCompleted = function (orderCollection, page) {
                var orders = orderCollection.orders;
                this.isOrdersLoaded = true;
                for (var orderIndex = 0; orderIndex < orders.length && this.productItems.length <= this.maxProducts; orderIndex++) {
                    var order_2 = orders[orderIndex];
                    var orderLines = order_2.orderLines.sort(function (a, b) { return (b.qtyOrdered - a.qtyOrdered || a.lineNumber - b.lineNumber); });
                    var _loop_1 = function (orderLineIndex) {
                        var orderLine = orderLines[orderLineIndex];
                        if (orderLine.canAddToCart) {
                            var productItem = { id: orderLine.productId, unitOfMeasure: orderLine.unitOfMeasure, product: null };
                            if (productItem.id && !this_1.productItems.some(function (pi) { return (pi.id === orderLine.productId && pi.unitOfMeasure === orderLine.unitOfMeasure); }) && this_1.productItems.length < this_1.maxProducts) {
                                this_1.productItems.push(productItem);
                            }
                        }
                    };
                    var this_1 = this;
                    for (var orderLineIndex = 0; orderLineIndex < orderLines.length && this.productItems.length <= this.maxProducts; orderLineIndex++) {
                        _loop_1(orderLineIndex);
                    }
                }
                if (this.productItems.length < this.maxProducts && page < 10 && orders.length === this.pageSize) {
                    this.getRecentlyPurchasedItems(page + 1);
                }
                if (this.isOrdersLoaded && this.productItems.length > 0) {
                    var ids = [];
                    for (var index = 0; index < this.productItems.length; index++) {
                        if (ids.indexOf(this.productItems[index].id) < 0) {
                            ids.push(this.productItems[index].id);
                        }
                    }
                    this.getProducts(ids);
                }
            };
            RecentlyPurchasedController.prototype.getOrdersFailed = function (error) {
            };
            RecentlyPurchasedController.prototype.getProducts = function (ids) {
                var _this = this;
                this.productService.getProducts({ productIds: ids }, ["pricing"]).then(function (productCollection) { _this.getProductsCompleted(productCollection); }, function (error) { _this.getProductsFailed(error); });
            };
            RecentlyPurchasedController.prototype.getProductsCompleted = function (productCollection) {
                var _this = this;
                var products = productCollection.products;
                for (var index = 0; index < products.length; index++) {
                    var product = products[index];
                    product.qtyOrdered = product.minimumOrderQty || 1;
                    var _loop_2 = function (index_1) {
                        var productItem = this_2.productItems[index_1];
                        if (productItem.id === product.id) {
                            if (!productItem.unitOfMeasure || productItem.unitOfMeasure === product.unitOfMeasure) {
                                productItem.product = product;
                            }
                            else {
                                product.selectedUnitOfMeasure = productItem.unitOfMeasure;
                                this_2.productService.changeUnitOfMeasure(angular.copy(product)).then(function (result) { _this.changeUnitOfMeasureCompleted(result, productItem); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
                            }
                        }
                    };
                    var this_2 = this;
                    for (var index_1 = 0; index_1 < this.productItems.length; index_1++) {
                        _loop_2(index_1);
                    }
                }
                if (this.realTimePricing && this.productItems && this.productItems.length > 0) {
                    this.productService.getProductRealTimePrices(this.productItems.filter(function (o) { return o.product != null; }).map(function (o) { return o.product; })).then(function (realTimePricing) { return _this.getProductRealTimePricesCompleted(realTimePricing); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                }
            };
            RecentlyPurchasedController.prototype.getProductsFailed = function (error) {
            };
            RecentlyPurchasedController.prototype.getProductRealTimePricesCompleted = function (realTimePricing) {
            };
            RecentlyPurchasedController.prototype.getProductRealTimePricesFailed = function (error) {
                this.failedToGetRealTimePrices = true;
            };
            RecentlyPurchasedController.prototype.showUnitOfMeasureLabel = function (product) {
                return product && product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !product.quoteRequired;
            };
            RecentlyPurchasedController.prototype.changeUnitOfMeasureCompleted = function (product, productItem) {
                productItem.product = product;
            };
            RecentlyPurchasedController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            RecentlyPurchasedController.prototype.addToCart = function (product) {
                var _this = this;
                this.addingToCart = true;
                this.cartService.addLineFromProduct(product, null, null, true).then(function (cartLine) { _this.addToCartCompleted(cartLine); }, function (error) { _this.addToCartFailed(error); });
            };
            RecentlyPurchasedController.prototype.addToCartCompleted = function (cartLine) {
                this.addingToCart = false;
            };
            RecentlyPurchasedController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
            };
            RecentlyPurchasedController.$inject = ["settingsService", "orderService", "productService", "cartService", "$scope"];
            return RecentlyPurchasedController;
        }());
        order_1.RecentlyPurchasedController = RecentlyPurchasedController;
        angular
            .module("insite")
            .controller("RecentlyPurchasedController", RecentlyPurchasedController);
    })(order = insite.order || (insite.order = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.recently-purchased.controller.js.map