interface Window {
    javaScriptErrors: string[];
    recordError(errorMessage: string): void;
    dataLayer: any;
    currentVersion: string;
    safariBackState: any;
}

module insite {
    "use strict";

    export interface IAppRootScope extends ng.IRootScopeService {
        firstPage: boolean;
    }

    export interface IAppRunService {
        run: () => void;
    }

    export class AppRunService implements IAppRunService {
        static $inject = ["coreService", "$localStorage", "$window", "$rootScope", "$urlRouter", "spinnerService", "$location"];

        constructor(
            protected coreService: core.ICoreService,
            protected $localStorage: common.IWindowStorage,
            protected $window: ng.IWindowService,
            protected $rootScope: IAppRootScope,
            protected $urlRouter: angular.ui.IUrlRouterService,
            protected spinnerService: core.ISpinnerService,
            protected $location: ng.ILocationService) {
        }

        run(): void {
            (window as any).coreService = this.coreService;

            // If access_token is included in the query string, set it in local storage, this is used for authenticated swagger calls
            const hash: any = this.queryString(this.$window.location.pathname.split("&"));
            let accessToken = hash.access_token;
            if (accessToken) {
                this.$localStorage.set("accessToken", accessToken);
                const startHash = this.$window.location.pathname.indexOf("id_token");
                this.$window.location.pathname = this.$window.location.pathname.substring(0, startHash);
            }

            if (!accessToken) {
                const queryString: any = this.queryString(this.$window.location.search.replace(/^\?/, '').split("&"));
                if (queryString.access_token) {
                    this.$localStorage.set("accessToken", queryString.access_token);
                }
            }

            this.$rootScope.firstPage = true;

            this.$rootScope.$on("$locationChangeSuccess", () => { this.onLocationChangeSuccess(); });

            this.$rootScope.$on("$stateChangeStart", () => { this.onLocationChangeStart(); });

            this.$rootScope.$on("$stateChangeSuccess", () => { this.onStateChangeSuccess(); });

            // this seems to wait for rendering to be done but i dont think its bullet proof
            this.$rootScope.$on("$viewContentLoaded", () => { this.onViewContentLoaded(); });
        }

        protected onLocationChangeSuccess(): void {
            if (this.$rootScope.firstPage) {
                this.$urlRouter.listen();
                // fixes popups on initial page
                this.coreService.refreshUiBindings();
            }
        }

        protected onLocationChangeStart(): void {
            // on the first link click, hide the first page that was rendered server side
            this.$rootScope.firstPage = false;
            this.spinnerService.show("mainLayout");
        }

        protected onStateChangeSuccess(): void {
            this.spinnerService.hide("mainLayout");
        }

        protected onViewContentLoaded(): void {
            ($(document) as any).foundation();
            if (!this.$rootScope.firstPage) {
                this.sendGoogleAnalytics();
            }
            this.sendVirtualPageView();
        }

        sendGoogleAnalytics(): void {
            if (typeof ga !== "undefined") {
                ga("set", "location", this.$location.absUrl());
                ga("set", "page", this.$location.url());
                ga("send", "pageview");
            }
        }

        sendVirtualPageView(): void {
            if (window.dataLayer && (window as any).google_tag_manager) {
                window.dataLayer.push({
                    event: "virtualPageView",
                    page: {
                        title: window.document.title,
                        url: this.$location.url()
                    }
                });
            }
        }

        protected queryString(a: string[]): { [key: string]: string; } {
            if (!a) {
                return {};
            }
            const b: { [key: string]: string; } = {};
            for (let i = 0; i < a.length; ++i) {
                const p = a[i].split("=");
                if (p.length !== 2) {
                    continue;
                }
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        }
    }

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
        .run(["appRunService", ($appRunService: IAppRunService) => { $appRunService.run(); }])
        .service("appRunService", AppRunService);
}