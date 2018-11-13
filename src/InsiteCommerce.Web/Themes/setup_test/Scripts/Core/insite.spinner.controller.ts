module insite.core {
    "use strict";

    export class SpinnerController {
        name: string;
        group: string;
        show: boolean;
        size: string;
        replace = false;
        register: boolean;

        static $inject = ["spinnerService"];

        constructor(protected spinnerService: core.ISpinnerService) {
            this.init();
        }

        init(): void {
            this.show = this.show && this.show.toString() === "true";
            // Register with the spinner service by default if not specified.
            if (!this.hasOwnProperty("register")) {
                this.register = true;
            } else {
                this.register = !!this.register;
            }

            if (!this.hasOwnProperty("size")) {
                this.size = "fullContent";
            }

            // Declare a mini-API to hand off to our service so the service
            // doesn't have a direct reference to this directive's scope.
            const api = {
                name: this.name,
                group: this.group,
                show: () => {
                    this.show = true;
                },
                hide: () => {
                    this.show = false;
                },
                toggle: () => {
                    this.show = !this.show;
                }
            };

            if (this.register) {
                this.spinnerService.register(api);
            }
        }
    }

    angular
        .module("insite")
        .controller("SpinnerController", SpinnerController);
}