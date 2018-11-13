var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var AvailabilityByWarehousePopupController = /** @class */ (function () {
            function AvailabilityByWarehousePopupController(coreService, availabilityByWarehousePopupService) {
                this.coreService = coreService;
                this.availabilityByWarehousePopupService = availabilityByWarehousePopupService;
                this.init();
            }
            AvailabilityByWarehousePopupController.prototype.init = function () {
                var _this = this;
                this.availabilityByWarehousePopupService.registerDisplayFunction(function (data) {
                    _this.warehouses = data.warehouses;
                    _this.coreService.displayModal("#popup-availability-by-warehouse");
                });
            };
            AvailabilityByWarehousePopupController.$inject = ["coreService", "availabilityByWarehousePopupService"];
            return AvailabilityByWarehousePopupController;
        }());
        catalog.AvailabilityByWarehousePopupController = AvailabilityByWarehousePopupController;
        ;
        var AvailabilityByWarehousePopupService = /** @class */ (function (_super) {
            __extends(AvailabilityByWarehousePopupService, _super);
            function AvailabilityByWarehousePopupService() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            AvailabilityByWarehousePopupService.prototype.getDirectiveHtml = function () {
                return "<isc-availability-by-warehouse-popup></isc-availability-by-warehouse-popup>";
            };
            return AvailabilityByWarehousePopupService;
        }(base.BasePopupService));
        catalog.AvailabilityByWarehousePopupService = AvailabilityByWarehousePopupService;
        angular
            .module("insite")
            .controller("AvailabilityByWarehousePopupController", AvailabilityByWarehousePopupController)
            .service("availabilityByWarehousePopupService", AvailabilityByWarehousePopupService)
            .directive("iscAvailabilityByWarehousePopup", function () { return ({
            restrict: "E",
            replace: true,
            templateUrl: "/PartialViews/Catalog-AvailabilityByWarehousePopup",
            scope: {},
            controller: "AvailabilityByWarehousePopupController",
            controllerAs: "vm"
        }); });
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.availability-by-warehouse-popup.controller.js.map