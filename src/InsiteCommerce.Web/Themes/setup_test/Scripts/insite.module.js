var insite;
(function (insite) {
    "use strict";
    var AppRunService = /** @class */ (function () {
        function AppRunService(coreService, $localStorage, $window, $rootScope, $urlRouter, spinnerService, $location) {
            this.coreService = coreService;
            this.$localStorage = $localStorage;
            this.$window = $window;
            this.$rootScope = $rootScope;
            this.$urlRouter = $urlRouter;
            this.spinnerService = spinnerService;
            this.$location = $location;
        }
        AppRunService.prototype.run = function () {
            var _this = this;
            window.coreService = this.coreService;
            // If access_token is included in the query string, set it in local storage, this is used for authenticated swagger calls
            var hash = this.queryString(this.$window.location.pathname.split("&"));
            var accessToken = hash.access_token;
            if (accessToken) {
                this.$localStorage.set("accessToken", accessToken);
                var startHash = this.$window.location.pathname.indexOf("id_token");
                this.$window.location.pathname = this.$window.location.pathname.substring(0, startHash);
            }
            if (!accessToken) {
                var queryString = this.queryString(this.$window.location.search.replace(/^\?/, '').split("&"));
                if (queryString.access_token) {
                    this.$localStorage.set("accessToken", queryString.access_token);
                }
            }
            this.$rootScope.firstPage = true;
            this.$rootScope.$on("$locationChangeSuccess", function () { _this.onLocationChangeSuccess(); });
            this.$rootScope.$on("$stateChangeStart", function () { _this.onLocationChangeStart(); });
            this.$rootScope.$on("$stateChangeSuccess", function () { _this.onStateChangeSuccess(); });
            // this seems to wait for rendering to be done but i dont think its bullet proof
            this.$rootScope.$on("$viewContentLoaded", function () { _this.onViewContentLoaded(); });
        };
        AppRunService.prototype.onLocationChangeSuccess = function () {
            if (this.$rootScope.firstPage) {
                this.$urlRouter.listen();
                // fixes popups on initial page
                this.coreService.refreshUiBindings();
            }
        };
        AppRunService.prototype.onLocationChangeStart = function () {
            // on the first link click, hide the first page that was rendered server side
            this.$rootScope.firstPage = false;
            this.spinnerService.show("mainLayout");
        };
        AppRunService.prototype.onStateChangeSuccess = function () {
            this.spinnerService.hide("mainLayout");
        };
        AppRunService.prototype.onViewContentLoaded = function () {
            $(document).foundation();
            if (!this.$rootScope.firstPage) {
                this.sendGoogleAnalytics();
            }
            this.sendVirtualPageView();
        };
        AppRunService.prototype.sendGoogleAnalytics = function () {
            if (typeof ga !== "undefined") {
                ga("set", "location", this.$location.absUrl());
                ga("set", "page", this.$location.url());
                ga("send", "pageview");
            }
        };
        AppRunService.prototype.sendVirtualPageView = function () {
            if (window.dataLayer && window.google_tag_manager) {
                window.dataLayer.push({
                    event: "virtualPageView",
                    page: {
                        title: window.document.title,
                        url: this.$location.url()
                    }
                });
            }
        };
        AppRunService.prototype.queryString = function (a) {
            if (!a) {
                return {};
            }
            var b = {};
            for (var i = 0; i < a.length; ++i) {
                var p = a[i].split("=");
                if (p.length !== 2) {
                    continue;
                }
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        };
        AppRunService.$inject = ["coreService", "$localStorage", "$window", "$rootScope", "$urlRouter", "spinnerService", "$location"];
        return AppRunService;
    }());
    insite.AppRunService = AppRunService;
    angular
        .module("insite", [
        "insite-common",
        "insite-cmsShell",
        "ngSanitize",
        "ipCookie",
        "angular.filter",
        "ngMap",
        "ab-base64",
        "kendo.directives",
        "ui.router",
        "ui.sortable"
    ])
        .run(["appRunService", function ($appRunService) { $appRunService.run(); }])
        .service("appRunService", AppRunService);
})(insite || (insite = {}));
//# sourceMappingURL=insite.module.js.map