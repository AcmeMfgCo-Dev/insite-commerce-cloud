var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        var SpinnerController = /** @class */ (function () {
            function SpinnerController(spinnerService) {
                this.spinnerService = spinnerService;
                this.replace = false;
                this.init();
            }
            SpinnerController.prototype.init = function () {
                var _this = this;
                this.show = this.show && this.show.toString() === "true";
                // Register with the spinner service by default if not specified.
                if (!this.hasOwnProperty("register")) {
                    this.register = true;
                }
                else {
                    this.register = !!this.register;
                }
                if (!this.hasOwnProperty("size")) {
                    this.size = "fullContent";
                }
                // Declare a mini-API to hand off to our service so the service
                // doesn't have a direct reference to this directive's scope.
                var api = {
                    name: this.name,
                    group: this.group,
                    show: function () {
                        _this.show = true;
                    },
                    hide: function () {
                        _this.show = false;
                    },
                    toggle: function () {
                        _this.show = !_this.show;
                    }
                };
                if (this.register) {
                    this.spinnerService.register(api);
                }
            };
            SpinnerController.$inject = ["spinnerService"];
            return SpinnerController;
        }());
        core.SpinnerController = SpinnerController;
        angular
            .module("insite")
            .controller("SpinnerController", SpinnerController);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.spinner.controller.js.map