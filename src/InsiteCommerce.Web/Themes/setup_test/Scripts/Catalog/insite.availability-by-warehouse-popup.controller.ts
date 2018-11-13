module insite.catalog {
    "use strict";

    import WarehouseDto = Insite.Catalog.Services.Dtos.WarehouseDto;

    export class AvailabilityByWarehousePopupController {
        static $inject = ["coreService", "availabilityByWarehousePopupService"];
        warehouses: WarehouseDto[];

        constructor(
            protected coreService: core.ICoreService,
            protected availabilityByWarehousePopupService: IAvailabilityByWarehousePopupService) {
            this.init();
        }

        init(): void {
            this.availabilityByWarehousePopupService.registerDisplayFunction((data) => {
                this.warehouses = data.warehouses;
                this.coreService.displayModal("#popup-availability-by-warehouse");
            });
        }
    };

    export interface IAvailabilityByWarehousePopupData {
        warehouses: WarehouseDto[]
    }

    export interface IAvailabilityByWarehousePopupService {
        display(data: IAvailabilityByWarehousePopupData): void;
        registerDisplayFunction(p: (data: IAvailabilityByWarehousePopupData) => void);
    }

    export class AvailabilityByWarehousePopupService extends base.BasePopupService<any> implements IAvailabilityByWarehousePopupService {
        protected getDirectiveHtml(): string {
            return "<isc-availability-by-warehouse-popup></isc-availability-by-warehouse-popup>";
        }
    }

    angular
        .module("insite")
        .controller("AvailabilityByWarehousePopupController", AvailabilityByWarehousePopupController)
        .service("availabilityByWarehousePopupService", AvailabilityByWarehousePopupService)
        .directive("iscAvailabilityByWarehousePopup", () => ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Catalog-AvailabilityByWarehousePopup",
            scope: {},
            controller: "AvailabilityByWarehousePopupController",
            controllerAs: "vm"
        }));
}