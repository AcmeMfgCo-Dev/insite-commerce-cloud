var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var CompareProductsCarouselController = /** @class */ (function () {
            function CompareProductsCarouselController(productService, $timeout, $window, $scope) {
                this.productService = productService;
                this.$timeout = $timeout;
                this.$window = $window;
                this.$scope = $scope;
                this.init();
            }
            CompareProductsCarouselController.prototype.init = function () {
                this.imagesLoaded = 0;
                this.waitForDom(this.maxTries);
            };
            CompareProductsCarouselController.prototype.changeUnitOfMeasure = function (product) {
                var _this = this;
                this.productService.changeUnitOfMeasure(product).then(function (productDto) { _this.changeUnitOfMeasureCompleted(productDto); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            CompareProductsCarouselController.prototype.changeUnitOfMeasureCompleted = function (product) {
            };
            CompareProductsCarouselController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            CompareProductsCarouselController.prototype.showQuantityBreakPricing = function (product) {
                return product.canShowPrice
                    && product.pricing
                    && !!product.pricing.unitRegularBreakPrices
                    && product.pricing.unitRegularBreakPrices.length > 1
                    && !product.quoteRequired;
            };
            CompareProductsCarouselController.prototype.showUnitOfMeasure = function (product) {
                return !!product && product.canShowUnitOfMeasure
                    && !!product.unitOfMeasureDisplay
                    && !!product.productUnitOfMeasures
                    && product.productUnitOfMeasures.length > 1;
            };
            CompareProductsCarouselController.prototype.waitForDom = function (tries) {
                var _this = this;
                if (isNaN(+tries)) {
                    tries = this.maxTries || 1000; // Max 20000ms
                }
                // If DOM isn"t ready after max number of tries then stop
                if (tries > 0) {
                    this.$timeout(function () {
                        if (_this.isCarouselDomReadyAndImagesLoaded()) {
                            _this.initializeCarousel();
                            _this.$scope.$apply();
                        }
                        else {
                            _this.waitForDom(tries - 1);
                        }
                    }, 20, false);
                }
            };
            CompareProductsCarouselController.prototype.isCarouselDomReadyAndImagesLoaded = function () {
                return $(".isc-carousel").length > 0
                    && this.imagesLoaded === this.productsToCompare.length;
            };
            CompareProductsCarouselController.prototype.getItemsNumber = function () {
                var element = $(".top-carousel.isc-carousel");
                var width = element.innerWidth();
                if (width > 700) {
                    return 4;
                }
                else if (width > 480) {
                    return 3;
                }
                else {
                    return 1;
                }
            };
            CompareProductsCarouselController.prototype.getItemSize = function () {
                var element = $(".top-carousel.isc-carousel");
                var width = element.innerWidth();
                if (width > 700) {
                    width = width / 4;
                }
                else if (width > 480) {
                    width = width / 3;
                }
                return width;
            };
            CompareProductsCarouselController.prototype.getItemsMove = function () {
                var container = $(".top-carousel.isc-carousel");
                if (container.innerWidth() > 700) {
                    return 2;
                }
                else {
                    return 1;
                }
            };
            CompareProductsCarouselController.prototype.reloadCarousel = function () {
                var _this = this;
                var num = $(".top-carousel .items .isc-productContainer").length;
                var el = $(".top-carousel.isc-carousel");
                var width = el.innerWidth();
                var itemsNum;
                var isItemsNumChanged = false;
                if (width > 700) {
                    itemsNum = 4;
                    this.showCarouselArrows(num > 4);
                }
                else if (width > 480) {
                    itemsNum = 3;
                    this.showCarouselArrows(num > 3);
                }
                else {
                    itemsNum = 1;
                    this.showCarouselArrows(num > 1);
                }
                if (this.carousel.vars.minItems !== itemsNum && this.carousel.vars.maxItems !== itemsNum) {
                    this.carousel.vars.minItems = itemsNum;
                    this.carousel.vars.maxItems = itemsNum;
                    this.carousel.doMath();
                    isItemsNumChanged = true;
                }
                this.$timeout(function () {
                    if (isItemsNumChanged) {
                        _this.carousel.resize();
                        if (num > itemsNum) {
                            if (_this.carousel.currentSlide > num - itemsNum) {
                                _this.carousel.flexAnimate(num - itemsNum);
                            }
                        }
                        else {
                            _this.carousel.flexAnimate(0);
                        }
                    }
                    _this.equalizeCarouselDimensions();
                }, 0);
                if (this.bottomCarousels) {
                    this.bottomCarousels.forEach(function (x) {
                        x.vars.minItems = itemsNum;
                        x.vars.maxItems = itemsNum;
                        x.vars.move = width > 480 ? 2 : 1;
                        x.doMath();
                        _this.$timeout(function () {
                            x.resize();
                        }, 0);
                    });
                }
                this.equalizeCarouselDimensions();
            };
            CompareProductsCarouselController.prototype.createFlexSlider = function (recreate) {
                var _this = this;
                if (recreate === void 0) { recreate = false; }
                if (recreate) {
                    $(".top-carousel.isc-carousel").removeData("flexslider");
                    $(".pc-attr-carousel-container.isc-carousel").removeData("flexslider");
                    this.carousel = null;
                    this.bottomCarousels = null;
                }
                $(".top-carousel.isc-carousel").flexslider({
                    animation: "slide",
                    controlNav: false,
                    animationLoop: true,
                    slideshow: false,
                    itemWidth: this.getItemSize(),
                    minItems: this.getItemsNumber(),
                    maxItems: this.getItemsNumber(),
                    move: this.getItemsMove(),
                    customDirectionNav: $(".carousel-control-nav"),
                    start: function (slider) { _this.onTopCarouselStart(slider); }
                });
                $(".pc-attr-carousel-container.isc-carousel").flexslider({
                    animation: "slide",
                    controlNav: false,
                    animationLoop: true,
                    slideshow: false,
                    itemWidth: this.getItemSize(),
                    minItems: this.getItemsNumber(),
                    maxItems: this.getItemsNumber(),
                    move: this.getItemsMove(),
                    customDirectionNav: $(".carousel-control-nav"),
                    start: function (slider) { _this.onBottomCarouselStart(slider); }
                });
            };
            CompareProductsCarouselController.prototype.onTopCarouselStart = function (slider) {
                this.carousel = slider;
                this.reloadCarousel();
            };
            CompareProductsCarouselController.prototype.onBottomCarouselStart = function (slider) {
                if (!this.bottomCarousels) {
                    this.bottomCarousels = [];
                }
                this.bottomCarousels.push(slider);
                this.reloadCarousel();
            };
            CompareProductsCarouselController.prototype.initializeCarousel = function () {
                var _this = this;
                $(".pc-attr-carousel-container").addClass("pc-carousel");
                this.createFlexSlider(false);
                $(window).resize(function () { _this.onWindowResize(); });
                $(".isc-small-attr-container li.pc-attr").click(function (event) { _this.onAttributeTypeClick(event); });
                $(".isc-small-attr-container li.pc-value").click(function (event) { _this.onAttributeValueClick(event); });
                // auto scroll to selected item in mobile size
                $(".isc-small-attr-container li.pc-attr .item-block").click(function (event) { _this.onAttributeProductClick(event); });
                $(".removeProductFromComparison").click(function (event) { _this.onRemoveProductFromComparisonClick(event); });
            };
            CompareProductsCarouselController.prototype.onWindowResize = function () {
                $(".top-carousel.isc-carousel").flexslider("pause");
                if ($(".pc-attr-carousel-container.isc-carousel")) {
                    $(".pc-attr-carousel-container.isc-carousel").flexslider("pause");
                }
                this.reloadCarousel();
                $(".top-carousel.isc-carousel").flexslider("play");
                if ($(".pc-attr-carousel-container.isc-carousel")) {
                    $(".pc-attr-carousel-container.isc-carousel").flexslider("play");
                }
            };
            CompareProductsCarouselController.prototype.onAttributeTypeClick = function (event) {
                // expand attribute
                event.preventDefault();
                event.stopPropagation();
                if ($("body").innerWidth() < 768) {
                    $("li.pc-attr.pc-active").removeClass("pc-active");
                    if ($(event.currentTarget).hasClass("pc-active")) {
                        $(event.currentTarget).removeClass("pc-active");
                    }
                    else {
                        $(event.currentTarget).addClass("pc-active");
                    }
                }
            };
            CompareProductsCarouselController.prototype.onAttributeValueClick = function (event) {
                // expand attribute section
                event.preventDefault();
                event.stopPropagation();
                if ($("body").innerWidth() < 768) {
                    $("li.pc-value.pc-active").removeClass("pc-active");
                    if ($(event.currentTarget).hasClass("pc-active")) {
                        $(event.currentTarget).removeClass("pc-active");
                    }
                    else {
                        $(event.currentTarget).addClass("pc-active");
                    }
                }
            };
            CompareProductsCarouselController.prototype.onAttributeProductClick = function (event) {
                var productId = $(event.currentTarget).find("[data-productid]").data("productid").toString();
                $(".top-carousel.isc-carousel").flexslider($(".isc-productContainer").find("[data-productid='" + productId + "']:first").closest("li").index());
            };
            CompareProductsCarouselController.prototype.onRemoveProductFromComparisonClick = function (event) {
                var productId = $(event.currentTarget).data("productid").toString();
                // remove several nodes relating to this product
                $("[data-productid=" + productId + "]").closest("li").remove();
                this.removeEmptyAttributes();
                this.createFlexSlider(true);
                this.removeComparedProduct({ productId: productId });
                // update the total number of items
                var itemCount = $(".top-carousel.isc-carousel .items li").length;
                $(".pc-controls .results-count .result-num").html(itemCount.toString());
                if (itemCount === 0) {
                    this.$window.history.back();
                }
            };
            CompareProductsCarouselController.prototype.removeEmptyAttributes = function () {
                // delete attributes with products left
                var removeList = [];
                $(".isc-large-attr-container .pc-attr-list .pc-attr").each(function () {
                    var item = $(this);
                    var hasValues = false;
                    item.find("li span").each(function () {
                        var span = $(this);
                        if (span.html()) {
                            hasValues = true;
                        }
                    });
                    if (!hasValues) {
                        removeList.push(item);
                    }
                });
                $(".isc-small-attr-container .pc-attr-list .pc-attr").each(function () {
                    var item = $(this);
                    var hasValues = false;
                    item.find("li").each(function () {
                        hasValues = true;
                    });
                    if (!hasValues) {
                        removeList.push(item);
                    }
                });
                for (var i = 0; i < removeList.length; i++) {
                    removeList[i].remove();
                }
            };
            CompareProductsCarouselController.prototype.equalizeCarouselDimensions = function () {
                if ($(".carousel-item-equalize").length > 0) {
                    var maxHeight_1 = -1;
                    var maxThumbHeight_1 = -1;
                    var maxNameHeight_1 = -1;
                    var maxProductInfoHeight_1 = -1;
                    var navHeight = "min-height:" + $("ul.item-list").height();
                    $(".left-nav-2").attr("style", navHeight);
                    // clear the height overrides
                    $(".carousel-item-equalize").each(function () {
                        $(this).find(".item-thumb").height("auto");
                        $(this).find(".item-name").height("auto");
                        $(this).find(".product-info").height("auto");
                        $(this).height("auto");
                    });
                    // find the max heights
                    $(".carousel-item-equalize").each(function () {
                        var thumbHeight = $(this).find(".item-thumb").height();
                        maxThumbHeight_1 = maxThumbHeight_1 > thumbHeight ? maxThumbHeight_1 : thumbHeight;
                        var nameHeight = $(this).find(".item-name").height();
                        maxNameHeight_1 = maxNameHeight_1 > nameHeight ? maxNameHeight_1 : nameHeight;
                        var productInfoHeight = $(this).find(".product-info").height();
                        maxProductInfoHeight_1 = maxProductInfoHeight_1 > productInfoHeight ? maxProductInfoHeight_1 : productInfoHeight;
                        var height = $(this).height();
                        maxHeight_1 = maxHeight_1 > height ? maxHeight_1 : height;
                    });
                    // set all to max heights
                    if (maxThumbHeight_1 > 0) {
                        $(".carousel-item-equalize").each(function () {
                            $(this).find(".item-thumb").height(maxThumbHeight_1);
                            $(this).find(".item-name").height(maxNameHeight_1);
                            $(this).find(".product-info").height(maxProductInfoHeight_1);
                            $(this).height(maxHeight_1);
                            $(this).addClass("eq");
                        });
                    }
                }
            };
            CompareProductsCarouselController.prototype.showCarouselArrows = function (shouldShowArrows) {
                if (shouldShowArrows) {
                    $(".carousel-control-prev,.carousel-control-next").show();
                }
                else {
                    $(".carousel-control-prev,.carousel-control-next").hide();
                }
            };
            CompareProductsCarouselController.$inject = ["productService", "$timeout", "$window", "$scope"];
            return CompareProductsCarouselController;
        }());
        catalog.CompareProductsCarouselController = CompareProductsCarouselController;
        angular
            .module("insite")
            .controller("CompareProductsCarouselController", CompareProductsCarouselController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.compare-products-carousel.controller.js.map