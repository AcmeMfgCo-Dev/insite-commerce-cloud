module insite.core {
    "use strict";

    export interface ICoreService {
        getObjectByPropertyValue<T>(values: T[], expr: {}): T;
        openWishListPopup(products: ProductDto[], popupId?: string): void;
        closeModal(selector: string): void;
        displayModal(html: any, onClose?: any): void;
        refreshUiBindings(): void;
        getReferringPath(): string;
        getCurrentPath(): string;
        redirectToPath(path: string);
        redirectToPathAndRefreshPage(path: string);
        redirectToSignIn(returnToUrl?: boolean);
        getSignInUrl(): string;
        replaceState(state: any): void;
        pushState(state: any): void;
        getHistoryState(): any;
    }

    export class CoreService implements ICoreService {
        webApiRoot = null;
        referringPath: string;
        signInUrl: string;
        settingsUri = "/api/v1/settings";
        previousPath: string;
        saveState: boolean;
        contextPersonaIds: string;

        static $inject = ["$rootScope", "$http", "$filter", "$window", "$location", "$sessionStorage", "$timeout", "$templateCache", "ipCookie", "$state", "$stateParams"];

        constructor(
            protected $rootScope: ng.IRootScopeService,
            protected $http: ng.IHttpService,
            protected $filter: ng.IFilterService,
            protected $window: ng.IWindowService,
            protected $location: ng.ILocationService,
            protected $sessionStorage: common.IWindowStorage,
            protected $timeout: ng.ITimeoutService,
            protected $templateCache: ng.ITemplateCacheService,
            protected ipCookie: any,
            protected $state: any,
            protected $stateParams: any
        ) {
            this.init();
        }

        init(): void {
            this.$rootScope.$on("$stateChangeSuccess", (event, to, toParams, from, fromParams) => {
                this.onStateChangeSuccess(event, to, toParams, from, fromParams);
            });

            // handle server side 401 redirects to sign in
            this.$rootScope.$on("$stateChangeError", (event, to, toParams, from, fromParams, error) => {
                this.onStateChangeError(event, to, toParams, from, fromParams, error);
            });

            this.$rootScope.$on("$locationChangeStart", (event, newUrl, prevUrl) => {
                this.onLocationChangeStart(event, newUrl, prevUrl);
            });

            this.$rootScope.$on("$viewContentLoaded", (event) => {
                this.onViewContentLoaded(event);
            });

            this.contextPersonaIds = this.ipCookie("SetContextPersonaIds");
        }

        protected onStateChangeSuccess(event: ng.IAngularEvent, to: any, toParams: any, from: any, fromParams: any): void {
            if (this.isSafari()) {
                if (toParams.path !== this.previousPath) {
                    if (this.saveState) {
                        this.saveState = false;
                    } else {
                        this.$window.safariBackState = null;
                    }
                }
                this.previousPath = fromParams.path;
            }
        }

        protected onStateChangeError(event: ng.IAngularEvent, to: any, toParams: any, from: any, fromParams: any, error: any): void {
            event.preventDefault();
            if (error.status === 401) {
                const signIn = `${this.getSignInUrl()}?returnUrl=${encodeURIComponent(toParams.path)}`;
                this.$window.location.replace(signIn);
            }
        }

        protected onLocationChangeStart(event: ng.IAngularEvent, newUrl: any, prevUrl: any): void {
            if (newUrl === prevUrl) {
                return;
            }

            this.setReferringPath(prevUrl);
            this.hideNavMenuOnTouchDevices();
            this.closeAllModals();
            this.retainScrollPosition(newUrl, prevUrl);

            const contextPersonaIds = this.ipCookie("SetContextPersonaIds");
            if (this.contextPersonaIds !== contextPersonaIds) {
                this.contextPersonaIds = contextPersonaIds;
                this.$templateCache.removeAll();
            }
        }

        protected setReferringPath(prevUrl: any): void {
            this.referringPath = prevUrl.substring(prevUrl.toLowerCase().indexOf(window.location.hostname.toLowerCase()) + window.location.hostname.length);
        }

        protected retainScrollPosition(newUrl: any, prevUrl: any): void {
            const scrollPositions = {};
            const scrollPos = this.$sessionStorage.getObject("scrollPositions");
            if (scrollPos && scrollPos[newUrl]) {
                scrollPositions[newUrl] = scrollPos[newUrl];
            }

            scrollPositions[prevUrl] = this.$window.scrollY;
            this.$sessionStorage.setObject("scrollPositions", scrollPositions);
        }

        protected onViewContentLoaded(event: ng.IAngularEvent): void {
            this.restoreScrollPosition();
        }

        protected restoreScrollPosition() {
            const scrollPositions = this.$sessionStorage.getObject("scrollPositions");
            if (!scrollPositions || !scrollPositions[this.$location.absUrl()]) {
                this.$window.scrollTo(0, 0);
                return;
            }

            this.$timeout(() => { this.waitForRenderAndScroll(); });
        }

        protected waitForRenderAndScroll(): void {
            if (this.$http.pendingRequests.length > 0) {
                this.$timeout(() => { this.waitForRenderAndScroll(); }, 100);
            } else {
                const scrollPositions = this.$sessionStorage.getObject("scrollPositions");
                this.$window.scrollTo(0, scrollPositions[this.$location.absUrl()]);
            }
        }

        // example: coreService.getObjectByPropertyValue(section.options, { selected: "true" })
        getObjectByPropertyValue<T>(values: T[], expr: {}): T {
            const filteredFields = this.$filter("filter")(values, expr, true);
            return filteredFields ? filteredFields[0] : null;
        }

        openWishListPopup(products: ProductDto[]): void {
            this.$rootScope.$broadcast("addToWishList", { products: products });
        }

        closeModal(selector: string): void {
            const modal = angular.element(`${selector}:visible`);
            if (typeof (modal) !== "undefined" && modal !== null && modal.length > 0) {
                (modal as any).foundation("reveal", "close");
            }
        }

        displayModal(html: any, onClose: any): void {
            const $html = $(html);
            if ($html.parents("body").length === 0) {
                $html.appendTo($("body"));
            }

            ($html as any).foundation("reveal", "open");
            $(document).on("closed", $html, () => {
                if (typeof onClose === "function") {
                    onClose();
                }
            });
        }

        refreshUiBindings(): void {
            ($(document) as any).foundation({ bindings: "events" });
        }

        getReferringPath(): string {
            return this.referringPath;
        }

        getCurrentPath(): string {
            return this.$location.url();
        }

        // do a smooth redirect - storefront spa must use this instead of $window.location.href
        redirectToPath(path: string): void {
            this.$location.url(path);
        }

        redirectToPathAndRefreshPage(path: string): void {
            this.$window.location.href = path;
        }

        redirectToSignIn(returnToUrl = true): void {
            let signInUrl = this.getSignInUrl();
            if (this.$window.location.pathname === signInUrl) {
                return;
            }

            const currentUrl = this.$window.location.pathname + this.$window.location.search;
            if (returnToUrl && currentUrl !== "/") {
                signInUrl += `?returnUrl=${encodeURIComponent(currentUrl)}&clientRedirect=true`;
            }

            this.redirectToPath(signInUrl);
        }

        getSignInUrl(): string {
            return (core as any).signInUrl;
        }

        protected isSafari(): boolean {
            return navigator.vendor && navigator.vendor.indexOf("Apple") > -1 &&
                navigator.userAgent && !navigator.userAgent.match("CriOS");
        }

        // history.replaceState has back button issues on Safari so this replaces it there
        replaceState(state: any): void {
            if (this.isSafari()) {
                this.saveState = true;
                this.$window.safariBackState = state;
            } else {
                this.$window.history.replaceState(state, "any");
            }
        }

        // history.pushState has back button issues on Safari so this replaces it there
        pushState(state: any): void {
            if (this.isSafari()) {
                this.saveState = true;
                this.$window.safariBackState = state;
            } else {
                this.$window.history.pushState(state, "any");
            }
        }

        getHistoryState(): any {
            if (this.isSafari()) {
                return this.$window.safariBackState;
            } else {
                return this.$window.history.state;
            }
        }

        protected hideNavMenuOnTouchDevices(): void {
            (insite as any).nav.uncheckBoxes("nav");
            (insite as any).nav.closePanel();
            (insite as any).nav.hideSubNav();
        }

        protected closeAllModals(): void {
            $("[data-reveal]").each(function () {
                ($(this) as any).foundation("reveal", "close");
            });
        }
    }

    angular
        .module("insite")
        .service("coreService", CoreService)
        .filter("trusted", ["$sce", $sce => val => $sce.trustAsHtml(val)])
        .filter("escape", ["$window", $window => $window.encodeURIComponent]);
}