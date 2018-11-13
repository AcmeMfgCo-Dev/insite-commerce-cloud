module insite.invoice {
    "use strict";

    export class InvoiceDetailController {
        invoice: InvoiceModel;
        btFormat: string;
        stFormat: string;
        validationMessage: string;

        static $inject = ["invoiceService", "coreService", "queryString"];

        constructor(
            protected invoiceService: invoice.IInvoiceService,
            protected coreService: core.ICoreService,
            protected queryString: common.IQueryStringService) {
            this.init();
        }

        init(): void {
            this.getInvoice();
        }

        getInvoice(): void {
            this.invoiceService.getInvoice(this.getInvoiceNumber(), "invoicelines,shipments").then(
                (invoice: InvoiceModel) => { this.getInvoiceCompleted(invoice); },
                (error: any) => { this.getInvoiceFailed(error); });
        }

        protected getInvoiceNumber(): string {
            let invoiceNumber = this.queryString.get("invoiceNumber");

            if (typeof invoiceNumber === "undefined") {
                const pathArray = window.location.pathname.split("/");
                const pathInvoiceNumber = pathArray[pathArray.length - 1];
                if (pathInvoiceNumber !== "InvoiceHistoryDetail") {
                    invoiceNumber = pathInvoiceNumber;
                }
            }

            return invoiceNumber;
        }

        protected getInvoiceCompleted(invoice: InvoiceModel): void {
            this.invoice = invoice;
            this.btFormat = this.formatCityCommaStateZip(this.invoice.billToCity, this.invoice.billToState, this.invoice.billToPostalCode);
            this.stFormat = this.formatCityCommaStateZip(this.invoice.shipToCity, this.invoice.shipToState, this.invoice.shipToPostalCode);
        }

        protected getInvoiceFailed(error: any): void {
            this.validationMessage = error.message || error;
        }

        protected formatCityCommaStateZip(city: string, state: string, zip: string): string {
            let formattedString = "";
            if (city) {
                formattedString = city;
                if (state) {
                    formattedString += `, ${state} ${zip}`;
                }
            }

            return formattedString;
        }

        showShareModal(entityId: string): void {
            this.coreService.displayModal(`#shareEntityPopupContainer_${entityId}`);
        }
    }

    angular
        .module("insite")
        .controller("InvoiceDetailController", InvoiceDetailController);
}