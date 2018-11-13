module insite.catalog {
    "use strict";

    export class CompareProductsCarouselController {
        addToCart: (param: { productId: string }) => void;
        removeComparedProduct: (param: { productId: string }) => void;
        openWishListPopup: (param: { product: ProductDto }) => void;
        maxTries: number;
        imagesLoaded: number;
        productsToCompare: ProductDto[];
        carousel: any;
        bottomCarousels: any[];

        static $inject = ["productService", "$timeout", "$window", "$scope"];

        constructor(
            protected productService: IProductService,
            protected $timeout: ng.ITimeoutService,
            protected $window: ng.IWindowService,
            protected $scope: ng.IScope) {
            this.init();
        }

        init(): void {
            this.imagesLoaded = 0;
            this.waitForDom(this.maxTries);
        }

        changeUnitOfMeasure(product: ProductDto): void {
            this.productService.changeUnitOfMeasure(product).then(
                (productDto: ProductDto) => { this.changeUnitOfMeasureCompleted(productDto); },
                (error: any) => {this.changeUnitOfMeasureFailed(error); });
        }

        protected changeUnitOfMeasureCompleted(product: ProductDto): void {
        }

        protected changeUnitOfMeasureFailed(error: any): void {
        }

        showQuantityBreakPricing(product: ProductDto): boolean {
            return product.canShowPrice
                && product.pricing
                && !!product.pricing.unitRegularBreakPrices
                && product.pricing.unitRegularBreakPrices.length > 1
                && !product.quoteRequired;
        }

        showUnitOfMeasure(product: ProductDto): boolean {
            return !!product && product.canShowUnitOfMeasure
                && !!product.unitOfMeasureDisplay
                && !!product.productUnitOfMeasures
                && product.productUnitOfMeasures.length > 1;
        }

        protected waitForDom(tries: number): void {
            if (isNaN(+tries)) {
                tries = this.maxTries || 1000; // Max 20000ms
            }

            // If DOM isn"t ready after max number of tries then stop
            if (tries > 0) {
                this.$timeout(() => {
                    if (this.isCarouselDomReadyAndImagesLoaded()) {
                        this.initializeCarousel();
                        this.$scope.$apply();
                    } else {
                        this.waitForDom(tries - 1);
                    }
                }, 20, false);
            }
        }

        protected isCarouselDomReadyAndImagesLoaded(): boolean {
            return $(".isc-carousel").length > 0
                && this.imagesLoaded === this.productsToCompare.length;
        }

        protected getItemsNumber(): number {
            const element = $(".top-carousel.isc-carousel");
            const width = element.innerWidth();

            if (width > 700) {
                return 4;
            } else if (width > 480) {
                return 3;
            } else {
                return 1;
            }
        }

        protected getItemSize(): number {
            const element = $(".top-carousel.isc-carousel");
            let width = element.innerWidth();

            if (width > 700) {
                width = width / 4;
            } else if (width > 480) {
                width = width / 3;
            }

            return width;
        }

        protected getItemsMove(): number {
            const container = $(".top-carousel.isc-carousel");
            if (container.innerWidth() > 700) {
                return 2;
            } else {
                return 1;
            }
        }

        protected reloadCarousel(): void {
            const num = $(".top-carousel .items .isc-productContainer").length;
            const el = $(".top-carousel.isc-carousel");
            let width = el.innerWidth();
            let itemsNum: number;
            let isItemsNumChanged = false;

            if (width > 700) {
                itemsNum = 4;
                this.showCarouselArrows(num > 4);
            } else if (width > 480) {
                itemsNum = 3;
                this.showCarouselArrows(num > 3);
            } else {
                itemsNum = 1;
                this.showCarouselArrows(num > 1);
            }

            if (this.carousel.vars.minItems !== itemsNum && this.carousel.vars.maxItems !== itemsNum) {
                this.carousel.vars.minItems = itemsNum;
                this.carousel.vars.maxItems = itemsNum;
                this.carousel.doMath();
                isItemsNumChanged = true;
            }

            this.$timeout(() => {
                if (isItemsNumChanged) {
                    this.carousel.resize();
                    if (num > itemsNum) {
                        if (this.carousel.currentSlide > num - itemsNum) {
                            this.carousel.flexAnimate(num - itemsNum);
                        }
                    } else {
                        this.carousel.flexAnimate(0);
                    }
                }

                this.equalizeCarouselDimensions();
            }, 0);

            if (this.bottomCarousels) {
                this.bottomCarousels.forEach(x => {
                    x.vars.minItems = itemsNum;
                    x.vars.maxItems = itemsNum;
                    x.vars.move = width > 480 ? 2 : 1;
                    x.doMath();
                    this.$timeout(() => {
                        x.resize();
                    }, 0);
                });

            }

            this.equalizeCarouselDimensions();
        }

        protected createFlexSlider(recreate: boolean = false): void {
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
                start: (slider: any) => { this.onTopCarouselStart(slider); }
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
                start: (slider: any) => { this.onBottomCarouselStart(slider); }
            });
        }

        protected onTopCarouselStart(slider: any): void {
            this.carousel = slider;
            this.reloadCarousel();
        }

        protected onBottomCarouselStart(slider: any): void {
            if (!this.bottomCarousels) {
                this.bottomCarousels = [];
            }

            this.bottomCarousels.push(slider);
            this.reloadCarousel();
        }

        protected initializeCarousel(): void {
            $(".pc-attr-carousel-container").addClass("pc-carousel");

            this.createFlexSlider(false);

            $(window).resize(() => { this.onWindowResize(); });

            $(".isc-small-attr-container li.pc-attr").click((event: JQueryEventObject) => { this.onAttributeTypeClick(event); });

            $(".isc-small-attr-container li.pc-value").click((event: JQueryEventObject) => { this.onAttributeValueClick(event); });

            // auto scroll to selected item in mobile size
            $(".isc-small-attr-container li.pc-attr .item-block").click((event: JQueryEventObject) => { this.onAttributeProductClick(event); });

            $(".removeProductFromComparison").click((event: JQueryEventObject) => { this.onRemoveProductFromComparisonClick(event); });
        }

        protected onWindowResize(): void {
            $(".top-carousel.isc-carousel").flexslider("pause");
            if ($(".pc-attr-carousel-container.isc-carousel")) {
                $(".pc-attr-carousel-container.isc-carousel").flexslider("pause");
            }
            this.reloadCarousel();
            $(".top-carousel.isc-carousel").flexslider("play");
            if ($(".pc-attr-carousel-container.isc-carousel")) {
                $(".pc-attr-carousel-container.isc-carousel").flexslider("play");
            }
        }

        protected onAttributeTypeClick(event: JQueryEventObject): void {
            // expand attribute
            event.preventDefault();
            event.stopPropagation();
            if ($("body").innerWidth() < 768) {
                $("li.pc-attr.pc-active").removeClass("pc-active");
                if ($(event.currentTarget).hasClass("pc-active")) {
                    $(event.currentTarget).removeClass("pc-active");
                } else {
                    $(event.currentTarget).addClass("pc-active");
                }
            }
        }

        protected onAttributeValueClick(event: JQueryEventObject): void {
            // expand attribute section
            event.preventDefault();
            event.stopPropagation();
            if ($("body").innerWidth() < 768) {
                $("li.pc-value.pc-active").removeClass("pc-active");
                if ($(event.currentTarget).hasClass("pc-active")) {
                    $(event.currentTarget).removeClass("pc-active");
                } else {
                    $(event.currentTarget).addClass("pc-active");
                }
            }
        }

        protected onAttributeProductClick(event: JQueryEventObject): void {
            const productId: string = $(event.currentTarget).find("[data-productid]").data("productid").toString();
            $(".top-carousel.isc-carousel").flexslider($(".isc-productContainer").find(`[data-productid='${productId}']:first`).closest("li").index());
        }

        protected onRemoveProductFromComparisonClick(event: JQueryEventObject): void {
            const productId: string = $(event.currentTarget).data("productid").toString();

            // remove several nodes relating to this product
            $(`[data-productid=${productId}]`).closest("li").remove();

            this.removeEmptyAttributes();

            this.createFlexSlider(true);

            this.removeComparedProduct({ productId: productId });

            // update the total number of items
            const itemCount = $(".top-carousel.isc-carousel .items li").length;
            $(".pc-controls .results-count .result-num").html(itemCount.toString());

            if (itemCount === 0) {
                this.$window.history.back();
            }
        }

        protected removeEmptyAttributes(): void {
            // delete attributes with products left
            const removeList = [];
            $(".isc-large-attr-container .pc-attr-list .pc-attr").each(function () {
                const item = $(this);
                let hasValues = false;
                item.find("li span").each(function () {
                    const span = $(this);
                    if (span.html()) {
                        hasValues = true;
                    }
                });
                if (!hasValues) {
                    removeList.push(item);
                }
            });

            $(".isc-small-attr-container .pc-attr-list .pc-attr").each(function () {
                const item = $(this);
                let hasValues = false;
                item.find("li").each(() => {
                    hasValues = true;
                });
                if (!hasValues) {
                    removeList.push(item);
                }
            });

            for (let i = 0; i < removeList.length; i++) {
                removeList[i].remove();
            }
        }

        protected equalizeCarouselDimensions(): void {
            if ($(".carousel-item-equalize").length > 0) {
                let maxHeight = -1;
                let maxThumbHeight = -1;
                let maxNameHeight = -1;
                let maxProductInfoHeight = -1;

                const navHeight = `min-height:${$("ul.item-list").height()}`;
                $(".left-nav-2").attr("style", navHeight);

                // clear the height overrides
                $(".carousel-item-equalize").each(function() {
                    $(this).find(".item-thumb").height("auto");
                    $(this).find(".item-name").height("auto");
                    $(this).find(".product-info").height("auto");
                    $(this).height("auto");
                });

                // find the max heights
                $(".carousel-item-equalize").each(function() {
                    const thumbHeight = $(this).find(".item-thumb").height();
                    maxThumbHeight = maxThumbHeight > thumbHeight ? maxThumbHeight : thumbHeight;
                    const nameHeight = $(this).find(".item-name").height();
                    maxNameHeight = maxNameHeight > nameHeight ? maxNameHeight : nameHeight;
                    const productInfoHeight = $(this).find(".product-info").height();
                    maxProductInfoHeight = maxProductInfoHeight > productInfoHeight ? maxProductInfoHeight : productInfoHeight;
                    const height = $(this).height();
                    maxHeight = maxHeight > height ? maxHeight : height;
                });

                // set all to max heights
                if (maxThumbHeight > 0) {
                    $(".carousel-item-equalize").each(function() {
                        $(this).find(".item-thumb").height(maxThumbHeight);
                        $(this).find(".item-name").height(maxNameHeight);
                        $(this).find(".product-info").height(maxProductInfoHeight);
                        $(this).height(maxHeight);
                        $(this).addClass("eq");
                    });
                }
            }
        }

        protected showCarouselArrows(shouldShowArrows: boolean): void {
            if (shouldShowArrows) {
                $(".carousel-control-prev,.carousel-control-next").show();
            } else {
                $(".carousel-control-prev,.carousel-control-next").hide();
            }
        }
    }

    angular
        .module("insite")
        .controller("CompareProductsCarouselController", CompareProductsCarouselController);
}