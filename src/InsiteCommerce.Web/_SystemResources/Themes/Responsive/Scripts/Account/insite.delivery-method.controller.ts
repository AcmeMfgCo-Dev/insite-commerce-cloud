﻿import WarehouseModel = Insite.Catalog.WebApi.V1.ApiModels.WarehouseModel;

module insite.account {
    "use strict";

    export class DeliveryMethodController {
        session: SessionModel;
        onChange: Function;
        fulfillmentMethod: string;
        pickUpWarehouse: WarehouseModel;
        prefix: string;
        showPickUpTitle: boolean;
        updateSessionOnChange: boolean;

        static $inject = ["$scope", "$rootScope", "sessionService", "selectPickUpLocationPopupService"];

        constructor(
            protected $scope: ng.IScope,
            protected $rootScope: ng.IRootScopeService,
            protected sessionService: account.ISessionService,
            protected selectPickUpLocationPopupService: ISelectPickUpLocationPopupService) {
            this.init();
        }

        init() {
            if (!this.session) {
                this.sessionService.getSession().then(
                    (session: SessionModel) => { this.getSessionCompleted(session); },
                    (error: any) => { this.getSessionFailed(error); });
            }

            this.$scope.$on("sessionUpdated", (event, session) => {
                this.onSessionUpdated(session);
            });
        }

        protected onSessionUpdated(session: SessionModel): void {
            if (this.updateSessionOnChange) {
                this.session = session;
                this.fulfillmentMethod = session.fulfillmentMethod;
                this.pickUpWarehouse = session.pickUpWarehouse;
            }
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.session = session;
            this.fulfillmentMethod = this.fulfillmentMethod ? this.fulfillmentMethod : session.fulfillmentMethod;
            this.pickUpWarehouse = this.pickUpWarehouse ? this.pickUpWarehouse : session.pickUpWarehouse;
        }

        protected getSessionFailed(error: any): void {
        }

        changeFulfillmentMethod(): void {
            if (angular.isFunction(this.onChange)) {
                this.onChange();
            }

            if (this.updateSessionOnChange) {
                this.updateSession(this.pickUpWarehouse);
            }
        }

        updateSession(warehouse: WarehouseModel, onSessionUpdate?: Function): void {
            if (this.session.isAuthenticated) {
                const session = {} as SessionModel;
                session.fulfillmentMethod = this.fulfillmentMethod;
                session.pickUpWarehouse = warehouse;
                this.sessionService.updateSession(session).then(
                    (updatedSession: SessionModel) => { this.updateSessionCompleted(updatedSession, onSessionUpdate); },
                    (error: any) => { this.updateSessionFailed(error); });
            } else {
                const currentContext = this.sessionService.getContext();
                currentContext.fulfillmentMethod = this.fulfillmentMethod;
                currentContext.pickUpWarehouseId = warehouse.id;
                this.sessionService.setContext(currentContext);

                this.session.fulfillmentMethod = this.fulfillmentMethod;
                this.session.pickUpWarehouse = warehouse;
                if (angular.isFunction(onSessionUpdate)) {
                    onSessionUpdate();
                }

                this.$rootScope.$broadcast("sessionUpdated", this.session);
                this.$rootScope.$broadcast("fulfillmentMethodChanged");
            }
        }

        protected updateSessionCompleted(session: SessionModel, onSessionUpdate?: Function): void {
            this.session = session;
            this.$rootScope.$broadcast("fulfillmentMethodChanged");
            if (angular.isFunction(onSessionUpdate)) {
                onSessionUpdate();
            }
        }

        protected updateSessionFailed(error: any): void {
        }

        protected openWarehouseSelectionModal(): void {
            this.selectPickUpLocationPopupService.display({
                session: this.session,
                updateSessionOnSelect: this.updateSessionOnChange,
                selectedWarehouse: this.pickUpWarehouse,
                onSelectWarehouse: (warehouse: WarehouseModel, onSessionUpdate?: Function) => this.updateSession(warehouse, onSessionUpdate)
            });
        }
    }

    angular
        .module("insite")
        .controller("DeliveryMethodController", DeliveryMethodController)
        .directive("iscDeliveryMethod", () => ({
            restrict: "E",
            replace: true,
            scope: {
                session: "=",
                fulfillmentMethod: "=",
                pickUpWarehouse: "=",
                prefix: "@",
                onChange: "&",
                updateSessionOnChange: "=",
                showPickUpTitle: "="
            },
            templateUrl: "/PartialViews/Account-DeliveryMethod",
            controller: "DeliveryMethodController",
            controllerAs: "vm",
            bindToController: true
        }));
}