var insite;
(function (insite) {
    var core;
    (function (core) {
        "use strict";
        var CoreService = /** @class */ (function () {
            function CoreService($rootScope, $http, $filter, $window, $location, $sessionStorage, $timeout, $templateCache, ipCookie, $state, $stateParams) {
                this.$rootScope = $rootScope;
                this.$http = $http;
                this.$filter = $filter;
                this.$window = $window;
                this.$location = $location;
                this.$sessionStorage = $sessionStorage;
                this.$timeout = $timeout;
                this.$templateCache = $templateCache;
                this.ipCookie = ipCookie;
                this.$state = $state;
                this.$stateParams = $stateParams;
                this.webApiRoot = null;
                this.settingsUri = "/api/v1/settings";
                this.init();
            }
            CoreService.prototype.init = function () {
                var _this = this;
                this.$rootScope.$on("$stateChangeSuccess", function (event, to, toParams, from, fromParams) {
                    _this.onStateChangeSuccess(event, to, toParams, from, fromParams);
                });
                // handle server side 401 redirects to sign in
                this.$rootScope.$on("$stateChangeError", function (event, to, toParams, from, fromParams, error) {
                    _this.onStateChangeError(event, to, toParams, from, fromParams, error);
                });
                this.$rootScope.$on("$locationChangeStart", function (event, newUrl, prevUrl) {
                    _this.onLocationChangeStart(event, newUrl, prevUrl);
                });
                this.$rootScope.$on("$viewContentLoaded", function (event) {
                    _this.onViewContentLoaded(event);
                });
                this.contextPersonaIds = this.ipCookie("SetContextPersonaIds");
            };
            CoreService.prototype.onStateChangeSuccess = function (event, to, toParams, from, fromParams) {
                if (this.isSafari()) {
                    if (toParams.path !== this.previousPath) {
                        if (this.saveState) {
                            this.saveState = false;
                        }
                        else {
                            this.$window.safariBackState = null;
                        }
                    }
                    this.previousPath = fromParams.path;
                }
            };
            CoreService.prototype.onStateChangeError = function (event, to, toParams, from, fromParams, error) {
                event.preventDefault();
                if (error.status === 401) {
                    var signIn = this.getSignInUrl() + "?returnUrl=" + encodeURIComponent(toParams.path);
                    this.$window.location.replace(signIn);
                }
            };
            CoreService.prototype.onLocationChangeStart = function (event, newUrl, prevUrl) {
                if (newUrl === prevUrl) {
                    return;
                }
                this.setReferringPath(prevUrl);
                this.hideNavMenuOnTouchDevices();
                this.closeAllModals();
                this.retainScrollPosition(newUrl, prevUrl);
                var contextPersonaIds = this.ipCookie("SetContextPersonaIds");
                if (this.contextPersonaIds !== contextPersonaIds) {
                    this.contextPersonaIds = contextPersonaIds;
                    this.$templateCache.removeAll();
                }
            };
            CoreService.prototype.setReferringPath = function (prevUrl) {
                this.referringPath = prevUrl.substring(prevUrl.toLowerCase().indexOf(window.location.hostname.toLowerCase()) + window.location.hostname.length);
            };
            CoreService.prototype.retainScrollPosition = function (newUrl, prevUrl) {
                var scrollPositions = {};
                var scrollPos = this.$sessionStorage.getObject("scrollPositions");
                if (scrollPos && scrollPos[newUrl]) {
                    scrollPositions[newUrl] = scrollPos[newUrl];
                }
                scrollPositions[prevUrl] = this.$window.scrollY;
                this.$sessionStorage.setObject("scrollPositions", scrollPositions);
            };
            CoreService.prototype.onViewContentLoaded = function (event) {
                this.restoreScrollPosition();
            };
            CoreService.prototype.restoreScrollPosition = function () {
                var _this = this;
                var scrollPositions = this.$sessionStorage.getObject("scrollPositions");
                if (!scrollPositions || !scrollPositions[this.$location.absUrl()]) {
                    this.$window.scrollTo(0, 0);
                    return;
                }
                this.$timeout(function () { _this.waitForRenderAndScroll(); });
            };
            CoreService.prototype.waitForRenderAndScroll = function () {
                var _this = this;
                if (this.$http.pendingRequests.length > 0) {
                    this.$timeout(function () { _this.waitForRenderAndScroll(); }, 100);
                }
                else {
                    var scrollPositions = this.$sessionStorage.getObject("scrollPositions");
                    this.$window.scrollTo(0, scrollPositions[this.$location.absUrl()]);
                }
            };
            // example: coreService.getObjectByPropertyValue(section.options, { selected: "true" })
            CoreService.prototype.getObjectByPropertyValue = function (values, expr) {
                var filteredFields = this.$filter("filter")(values, expr, true);
                return filteredFields ? filteredFields[0] : null;
            };
            CoreService.prototype.openWishListPopup = function (products) {
                this.$rootScope.$broadcast("addToWishList", { products: products });
            };
            CoreService.prototype.closeModal = function (selector) {
                var modal = angular.element(selector + ":visible");
                if (typeof (modal) !== "undefined" && modal !== null && modal.length > 0) {
                    modal.foundation("reveal", "close");
                }
            };
            CoreService.prototype.displayModal = function (html, onClose) {
                var $html = $(html);
                if ($html.parents("body").length === 0) {
                    $html.appendTo($("body"));
                }
                $html.foundation("reveal", "open");
                $(document).on("closed", $html, function () {
                    if (typeof onClose === "function") {
                        onClose();
                    }
                });
            };
            CoreService.prototype.refreshUiBindings = function () {
                $(document).foundation({ bindings: "events" });
            };
            CoreService.prototype.getReferringPath = function () {
                return this.referringPath;
            };
            CoreService.prototype.getCurrentPath = function () {
                return this.$location.url();
            };
            // do a smooth redirect - storefront spa must use this instead of $window.location.href
            CoreService.prototype.redirectToPath = function (path) {
                this.$location.url(path);
            };
            CoreService.prototype.redirectToPathAndRefreshPage = function (path) {
                this.$window.location.href = path;
            };
            CoreService.prototype.redirectToSignIn = function (returnToUrl) {
                if (returnToUrl === void 0) { returnToUrl = true; }
                var signInUrl = this.getSignInUrl();
                if (this.$window.location.pathname === signInUrl) {
                    return;
                }
                var currentUrl = this.$window.location.pathname + this.$window.location.search;
                if (returnToUrl && currentUrl !== "/") {
                    signInUrl += "?returnUrl=" + encodeURIComponent(currentUrl) + "&clientRedirect=true";
                }
                this.redirectToPath(signInUrl);
            };
            CoreService.prototype.getSignInUrl = function () {
                return core.signInUrl;
            };
            CoreService.prototype.isSafari = function () {
                return navigator.vendor && navigator.vendor.indexOf("Apple") > -1 &&
                    navigator.userAgent && !navigator.userAgent.match("CriOS");
            };
            // history.replaceState has back button issues on Safari so this replaces it there
            CoreService.prototype.replaceState = function (state) {
                if (this.isSafari()) {
                    this.saveState = true;
                    this.$window.safariBackState = state;
                }
                else {
                    this.$window.history.replaceState(state, "any");
                }
            };
            // history.pushState has back button issues on Safari so this replaces it there
            CoreService.prototype.pushState = function (state) {
                if (this.isSafari()) {
                    this.saveState = true;
                    this.$window.safariBackState = state;
                }
                else {
                    this.$window.history.pushState(state, "any");
                }
            };
            CoreService.prototype.getHistoryState = function () {
                if (this.isSafari()) {
                    return this.$window.safariBackState;
                }
                else {
                    return this.$window.history.state;
                }
            };
            CoreService.prototype.hideNavMenuOnTouchDevices = function () {
                insite.nav.uncheckBoxes("nav");
                insite.nav.closePanel();
                insite.nav.hideSubNav();
            };
            CoreService.prototype.closeAllModals = function () {
                $("[data-reveal]").each(function () {
                    $(this).foundation("reveal", "close");
                });
            };
            CoreService.$inject = ["$rootScope", "$http", "$filter", "$window", "$location", "$sessionStorage", "$timeout", "$templateCache", "ipCookie", "$state", "$stateParams"];
            return CoreService;
        }());
        core.CoreService = CoreService;
        angular
            .module("insite")
            .service("coreService", CoreService)
            .filter("trusted", ["$sce", function ($sce) { return function (val) { return $sce.trustAsHtml(val); }; }])
            .filter("escape", ["$window", function ($window) { return $window.encodeURIComponent; }]);
    })(core = insite.core || (insite.core = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.core.service.js.map