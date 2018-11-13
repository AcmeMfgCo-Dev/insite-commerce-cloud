module insite.order {
    "use strict";

    export interface IProductItem {
        id: System.Guid;
        unitOfMeasure?: string;
        product?: ProductDto;
    }

    export class RecentlyPurchasedController {
        showOrders: boolean;
        isOrdersLoaded: boolean;
        pageSize = 5;
        maxProducts = 5;
        productItems: IProductItem[] = [];
        addingToCart = false;
        realTimePricing = false;
        failedToGetRealTimePrices = false;

        static $inject = ["settingsService", "orderService", "productService", "cartService", "$scope"];

        constructor(
            protected settingsService: core.ISettingsService,
            protected orderService: order.IOrderService,
            protected productService: catalog.IProductService,
            protected cartService: cart.ICartService,
            protected $scope: ng.IScope) {
            this.init();
        }

        init(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.$scope.$on("fulfillmentMethodChanged", () => {
                this.isOrdersLoaded = false;
                this.productItems = [];
                if (this.showOrders) {
                    this.getRecentlyPurchasedItems();
                }
            });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.showOrders = settingsCollection.orderSettings.showOrders;
            this.realTimePricing = settingsCollection.productSettings.realTimePricing;
            if (this.showOrders) {
                this.getRecentlyPurchasedItems();
            }
        }

        protected getSettingsFailed(error: any): void {
        }

        getRecentlyPurchasedItems(page: number = 1): void {
            const filter = { sort: "CreatedOn DESC", expand: "orderlines" };
            const pagination = { page: page, pageSize: this.pageSize } as PaginationModel;
            this.isOrdersLoaded = false;
            this.orderService.getOrders(filter, pagination).then(
                (orderCollection: OrderCollectionModel) => { this.getOrdersCompleted(orderCollection, page); },
                (error: any) => { this.getOrdersFailed(error); }
            );
        }

        protected getOrdersCompleted(orderCollection: OrderCollectionModel, page: number): void {
            const orders = orderCollection.orders;
            this.isOrdersLoaded = true;

            for (let orderIndex = 0; orderIndex < orders.length && this.productItems.length <= this.maxProducts; orderIndex++) {
                const order = orders[orderIndex];
                let orderLines = order.orderLines.sort((a, b) => (b.qtyOrdered - a.qtyOrdered || a.lineNumber - b.lineNumber));
                for (let orderLineIndex = 0; orderLineIndex < orderLines.length && this.productItems.length <= this.maxProducts; orderLineIndex++) {
                    let orderLine = orderLines[orderLineIndex];
                    if (orderLine.canAddToCart) {
                        const productItem = { id: orderLine.productId, unitOfMeasure: orderLine.unitOfMeasure, product: null as any };
                        if (productItem.id && !this.productItems.some((pi) => (pi.id === orderLine.productId && pi.unitOfMeasure === orderLine.unitOfMeasure)) && this.productItems.length < this.maxProducts) {
                            this.productItems.push(productItem);
                        }
                    }
                }
            }

            if (this.productItems.length < this.maxProducts && page < 10 && orders.length === this.pageSize) {
                this.getRecentlyPurchasedItems(page + 1);
            }

            if (this.isOrdersLoaded && this.productItems.length > 0) {
                let ids = [];
                for (let index = 0; index < this.productItems.length; index++) {
                    if (ids.indexOf(this.productItems[index].id) < 0) {
                        ids.push(this.productItems[index].id);
                    }
                }

                this.getProducts(ids);
            }
        }

        protected getOrdersFailed(error: any): void {
        }

        getProducts(ids: System.Guid[]): void {
            this.productService.getProducts({ productIds: ids }, ["pricing"]).then(
                (productCollection: ProductCollectionModel) => { this.getProductsCompleted(productCollection); },
                (error: any) => { this.getProductsFailed(error); }
            );
        }

        protected getProductsCompleted(productCollection: ProductCollectionModel): void {
            const products = productCollection.products;
            for (let index = 0; index < products.length; index++) {
                const product = products[index];
                product.qtyOrdered = product.minimumOrderQty || 1;

                for (let index = 0; index < this.productItems.length; index++) {
                    let productItem = this.productItems[index];
                    if (productItem.id === product.id) {
                        if (!productItem.unitOfMeasure || productItem.unitOfMeasure === product.unitOfMeasure) {
                            productItem.product = product;
                        } else {
                            product.selectedUnitOfMeasure = productItem.unitOfMeasure;
                            this.productService.changeUnitOfMeasure(angular.copy(product)).then(
                                (result: ProductDto) => { this.changeUnitOfMeasureCompleted(result, productItem); },
                                (error: any) => { this.changeUnitOfMeasureFailed(error); });
                        }
                    }
                }
            }

            if (this.realTimePricing && this.productItems && this.productItems.length > 0) {
                this.productService.getProductRealTimePrices(this.productItems.filter(o => o.product != null ).map(o => o.product)).then(
                    (realTimePricing: RealTimePricingModel) => this.getProductRealTimePricesCompleted(realTimePricing),
                    (error: any) => this.getProductRealTimePricesFailed(error));
            }
        }

        protected getProductsFailed(error: any): void {
        }

        protected getProductRealTimePricesCompleted(realTimePricing: RealTimePricingModel): void {
        }

        protected getProductRealTimePricesFailed(error: any): void {
            this.failedToGetRealTimePrices = true;
        }

        showUnitOfMeasureLabel(product: ProductDto): boolean {
            return product && product.canShowUnitOfMeasure
                && !!product.unitOfMeasureDisplay
                && !product.quoteRequired;
        }

        protected changeUnitOfMeasureCompleted(product: ProductDto, productItem: IProductItem): void {
            productItem.product = product;
        }

        protected changeUnitOfMeasureFailed(error: any): void {
        }

        addToCart(product: ProductDto): void {
            this.addingToCart = true;

            this.cartService.addLineFromProduct(product, null, null, true).then(
                (cartLine: CartLineModel) => { this.addToCartCompleted(cartLine); },
                (error: any) => { this.addToCartFailed(error); }
            );
        }

        protected addToCartCompleted(cartLine: CartLineModel): void {
            this.addingToCart = false;
        }

        protected addToCartFailed(error: any): void {
            this.addingToCart = false;
        }
    }

    angular
        .module("insite")
        .controller("RecentlyPurchasedController", RecentlyPurchasedController);
}