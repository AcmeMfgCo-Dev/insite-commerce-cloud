module insite.invoice {
    "use strict";

    export class InvoiceHistoryWidgetController {
        invoiceHistory: InvoiceCollectionModel;
        showInvoices: boolean;
        openActionsMenuId: string;

        static $inject = ["invoiceService", "coreService", "settingsService"];

        constructor(
            protected invoiceService: invoice.IInvoiceService,
            protected coreService: core.ICoreService,
            protected settingsService: core.ISettingsService) {
            this.init();
        }

        init(): void {
            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.showInvoices = settingsCollection.invoiceSettings.showInvoices;
            if (this.showInvoices) {
                this.getInvoices();
            }
        }

        protected getSettingsFailed(error: any): void {
        }

        getInvoices(): void {
            const searchFilter: ISearchFilter = {
                customerSequence: "-1",
                sort: "InvoiceDate DESC",
                fromDate: ""
            };

            const pagination = {
                page: 1,
                pageSize: 5
            } as PaginationModel;

            this.invoiceService.getInvoices(searchFilter, pagination).then(
                (invoiceCollection) => { this.getInvoicesCompleted(invoiceCollection); },
                (error) => { this.getInvoicesFailed(error); });
        }

        protected getInvoicesCompleted(invoiceCollection: InvoiceCollectionModel): void {
            this.invoiceHistory = invoiceCollection;
        }

        protected getInvoicesFailed(error: any): void {
        }

        showShareModal(entityId: string): void {
            this.coreService.displayModal(`#shareEntityPopupContainer_${entityId}`);
        }
    }

    angular
        .module("insite")
        .controller("InvoiceHistoryWidgetController", InvoiceHistoryWidgetController);
}