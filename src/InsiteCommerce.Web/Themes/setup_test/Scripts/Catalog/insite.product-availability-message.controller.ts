module insite.catalog {
    "use strict";

    export class ProductAvailabilityMessageController {
        static $inject = ["spinnerService", "availabilityByWarehousePopupService", "productService"];

        constructor(
            protected spinnerService: core.ISpinnerService,
            protected availabilityByWarehousePopupService: IAvailabilityByWarehousePopupService,
            protected productService: IProductService) {
        }

        showLink(productSettings: ProductSettingsModel, page: string): boolean {
            if (productSettings && productSettings.displayInventoryPerWarehouse && productSettings.showInventoryAvailability) {
                return !productSettings.displayInventoryPerWarehouseOnlyOnProductDetail || productSettings.displayInventoryPerWarehouseOnlyOnProductDetail && page === "ProductDetail";
            }

            return false;
        }

        openPopup(productSettings: ProductSettingsModel, productId: string, unitOfMeasure: string, configuration: string[]): void {
            this.spinnerService.show();
            if (productSettings.realTimeInventory) {
                this.getRealTimeInventory(productId, unitOfMeasure, configuration);
            } else {
                this.getWarehouses(productId, unitOfMeasure, configuration);
            }
        }

        protected getWarehouses(productId: string, unitOfMeasure: string, configuration: string[]): void {
            this.productService.getProductByParameters({ productId: productId, unitOfMeasure: unitOfMeasure, configuration: configuration, expand: "warehouses" }).then(
                (productModel: ProductModel) => { this.getProductCompleted(productModel); },
                (error: any) => { this.getProductFailed(error); });
        }

        protected getProductCompleted(productModel: ProductModel): void {
            this.spinnerService.hide();
            this.availabilityByWarehousePopupService.display({
                warehouses: productModel.product.warehouses
            });
        }

        protected getProductFailed(error: any): void {
            this.spinnerService.hide();
        }

        protected getRealTimeInventory(productId: string, unitOfMeasure: string, configuration: string[]): void {
            const configurations: { [key: string]: string[] } = {};
            configurations[`${productId}`] = configuration;
            this.productService.getProductRealTimeInventory([{ id: productId, productUnitOfMeasures: [] } as any], ["warehouses"], configurations).then(
                (realTimeInventory: RealTimeInventoryModel) => this.getProductRealTimeInventoryCompleted(realTimeInventory, productId, unitOfMeasure),
                (error: any) => this.getProductRealTimeInventoryFailed(error));
        }

        protected getProductRealTimeInventoryCompleted(realTimeInventory: RealTimeInventoryModel, productId: string, unitOfMeasure: string): void {
            this.spinnerService.hide();
            var realTimeInventoryResult = realTimeInventory.realTimeInventoryResults.find(o => o.productId === productId);
            if (realTimeInventoryResult) {
                var inventoryWarehousesDto = realTimeInventoryResult.inventoryWarehousesDtos.find(o => o.unitOfMeasure === unitOfMeasure)
                    || realTimeInventoryResult.inventoryWarehousesDtos[0];

                if (inventoryWarehousesDto) {
                    this.availabilityByWarehousePopupService.display({
                        warehouses: inventoryWarehousesDto.warehouseDtos
                    });
                }
            }
        }

        protected getProductRealTimeInventoryFailed(error: any): void {
            this.spinnerService.hide();
        }
    };

    angular
        .module("insite")
        .controller("ProductAvailabilityMessageController", ProductAvailabilityMessageController);
}