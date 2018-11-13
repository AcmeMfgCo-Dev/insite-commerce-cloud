module insite.layout {
    "use strict";

    export class LayoutController {
        static $inject = ["$window"];

        constructor(
            protected $window: ng.IWindowService) {
            this.init();
        }

        init(): void {
        }

        hideHeader(): any {
            return (this.$window as any).insite.hideHeader;
        }

        hideFooter(): any {
            return (this.$window as any).insite.hideFooter;
        }
    }

    angular
        .module("insite")
        .controller("LayoutController", LayoutController);
}