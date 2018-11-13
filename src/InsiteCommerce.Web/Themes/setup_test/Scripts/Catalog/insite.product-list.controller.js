var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        ;
        var ProductListController = /** @class */ (function () {
            function ProductListController($scope, coreService, cartService, productService, compareProductsService, $rootScope, $window, $localStorage, paginationService, searchService, spinnerService, addToWishlistPopupService, settingsService, $stateParams, queryString, $location, sessionService) {
                var _this = this;
                this.$scope = $scope;
                this.coreService = coreService;
                this.cartService = cartService;
                this.productService = productService;
                this.compareProductsService = compareProductsService;
                this.$rootScope = $rootScope;
                this.$window = $window;
                this.$localStorage = $localStorage;
                this.paginationService = paginationService;
                this.searchService = searchService;
                this.spinnerService = spinnerService;
                this.addToWishlistPopupService = addToWishlistPopupService;
                this.settingsService = settingsService;
                this.$stateParams = $stateParams;
                this.queryString = queryString;
                this.$location = $location;
                this.sessionService = sessionService;
                this.attributeValueIds = [];
                this.priceFilterMinimums = [];
                this.searchWithinTerms = [];
                this.ready = false;
                this.products = {};
                this.page = null; // query string page
                this.pageSize = null; // query string pageSize
                this.sort = null; // query string sort
                this.visibleColumnNames = [];
                this.paginationStorageKey = "DefaultPagination-ProductList";
                this.pageChanged = false; // true when the pager has done something to change pages.
                this.failedToGetRealTimePrices = false;
                this.failedToGetRealTimeInventory = false;
                this.productFilterLoaded = false;
                this.addingToCart = false;
                this.restoreState = function () {
                    _this.getQueryStringValues();
                    _this.getHistoryValues();
                    var getProductParams = {
                        pageSize: _this.pageSize || (_this.products.pagination ? _this.products.pagination.pageSize : null),
                        sort: _this.sort || _this.$localStorage.get("productListSortType", null),
                        page: _this.page,
                        attributeValueIds: _this.attributeValueIds,
                        priceFilters: _this.priceFilterMinimums,
                        includeSuggestions: _this.includeSuggestions,
                        includeAttributes: "IncludeOnProduct"
                    };
                    if (_this.isSearch) {
                        getProductParams.query = _this.query;
                        getProductParams.categoryId = _this.category ? _this.category.id : (_this.filterCategory ? _this.filterCategory.categoryId : null);
                    }
                    else {
                        getProductParams.categoryId = _this.category.id;
                    }
                    _this.getProductData(getProductParams);
                };
                // called by pager when a different view is selected, and also once at startup
                this.selectView = function (viewName) {
                    _this.killHeights();
                    _this.view = viewName;
                    // product will be undefined if this was called on startup. let getProductData call waitForDom.
                    if (viewName === "grid" && _this.products.products) {
                        _this.waitForDom();
                    }
                    _this.$localStorage.set("productListViewName", viewName);
                    _this.customPagerContext.view = viewName;
                };
                this.init();
            }
            ProductListController.prototype.init = function () {
                var _this = this;
                this.products.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
                this.filterCategory = { categoryId: null, selected: false, shortDescription: "", count: 0, subCategoryDtos: null, websiteId: null };
                this.view = this.$localStorage.get("productListViewName");
                this.getQueryStringValues();
                this.getHistoryValues();
                this.isSearch = this.query !== "";
                this.settingsService.getSettings().then(function (settingsCollection) { _this.getSettingsCompleted(settingsCollection); }, function (error) { _this.getSettingsFailed(error); });
                this.sessionService.getSession().then(function (session) { _this.getSessionCompleted(session); }, function (error) { _this.getSessionFailed(error); });
                var removeCompareProductsUpdated = this.$rootScope.$on("compareProductsUpdated", function () {
                    _this.onCompareProductsUpdated();
                });
                this.$scope.$on("$destroy", function () {
                    removeCompareProductsUpdated();
                });
                this.$scope.$on("CategoryLeftNavController-filterUpdated", function (event, filterType) {
                    _this.filterType = filterType;
                    _this.onCategoryLeftNavFilterUpdated();
                });
                this.initBackButton();
                this.$scope.$watch(function () { return _this.category; }, function (newCategory) {
                    if (!newCategory) {
                        return;
                    }
                    _this.getFacets(newCategory.id);
                });
                this.$scope.$on("sessionUpdated", function (event, session) {
                    _this.onSessionUpdated(session);
                });
            };
            ProductListController.prototype.getFacets = function (categoryId) {
                var _this = this;
                var params = {
                    priceFilters: this.priceFilterMinimums,
                    categoryId: categoryId,
                    includeSuggestions: this.includeSuggestions,
                    includeAlternateInventory: !this.enableWarehousePickup || this.session.fulfillmentMethod !== "PickUp"
                };
                var expand = ["onlyfacets"];
                this.productService.getProducts(params, expand).then(function (productCollection) { _this.getFacetsCompleted(productCollection); }, function (error) { _this.getFacetsFailed(error); });
            };
            ProductListController.prototype.getFacetsCompleted = function (productCollection) {
                this.initialAttributeTypeFacets = productCollection.attributeTypeFacets;
                this.resetVisibleColumnNames(productCollection);
                this.customPagerContext.sortedTableColumns = this.sortedTableColumns(productCollection);
            };
            ProductListController.prototype.getFacetsFailed = function (error) {
            };
            ProductListController.prototype.getQueryStringValues = function () {
                this.query = this.$stateParams.criteria || this.queryString.get("criteria") || "";
                this.page = this.queryString.get("page") || null;
                this.pageSize = this.queryString.get("pageSize") || null;
                this.sort = this.queryString.get("sort") || null;
                this.includeSuggestions = this.queryString.get("includeSuggestions") || "true";
            };
            // get context values coming from the browser history (when back button was used)
            ProductListController.prototype.getHistoryValues = function () {
                var state = this.coreService.getHistoryState();
                if (state) {
                    this.page = state.page;
                    if (state.attributeValueIds) {
                        this.attributeValueIds = state.attributeValueIds;
                    }
                    if (state.filterCategory) {
                        this.filterCategory = state.filterCategory;
                    }
                    if (state.priceFilterMinimums) {
                        this.priceFilterMinimums = state.priceFilterMinimums;
                    }
                    if (state.searchWithinTerms) {
                        this.searchWithinTerms = state.searchWithinTerms;
                    }
                }
                else {
                    // no history for first page - return the default values
                    this.page = 1;
                    this.attributeValueIds = [];
                    this.filterCategory = { categoryId: null, selected: false, shortDescription: "", count: 0, subCategoryDtos: null, websiteId: null };
                    this.priceFilterMinimums = [];
                    this.searchWithinTerms = [];
                }
            };
            ProductListController.prototype.getSettingsCompleted = function (settingsCollection) {
                this.settings = settingsCollection.productSettings;
                this.searchHistoryLimit = settingsCollection.searchSettings ? settingsCollection.searchSettings.searchHistoryLimit : null;
                this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
                this.applySettings();
                this.getPageDataOnInit();
            };
            ProductListController.prototype.getSettingsFailed = function (error) {
            };
            ProductListController.prototype.onSessionUpdated = function (session) {
                this.session = session;
                this.getPageData();
            };
            ProductListController.prototype.getSessionCompleted = function (session) {
                this.session = session;
                this.getPageDataOnInit();
            };
            ProductListController.prototype.getPageDataOnInit = function () {
                if (this.session && this.settings && !this.getPageDataCalled) {
                    this.getPageDataCalled = true;
                    this.getPageData();
                }
            };
            ProductListController.prototype.getSessionFailed = function (error) {
            };
            ProductListController.prototype.getPageData = function () {
                if (!this.isSearch) {
                    this.resolvePage();
                    return;
                }
                if (this.view === "table") {
                    this.view = "list";
                }
                this.getProductData({
                    query: this.query,
                    categoryId: this.category ? this.category.id : (this.filterCategory ? this.filterCategory.categoryId : null),
                    pageSize: this.pageSize || (this.products.pagination ? this.products.pagination.pageSize : null),
                    sort: this.sort || this.$localStorage.get("productListSortType", null),
                    page: this.page,
                    attributeValueIds: this.attributeValueIds,
                    priceFilters: this.priceFilterMinimums,
                    searchWithin: this.searchWithinTerms.join(" "),
                    includeSuggestions: this.includeSuggestions,
                    applyPersonalization: true,
                    includeAttributes: "IncludeOnProduct"
                });
            };
            ProductListController.prototype.onCompareProductsUpdated = function () {
                this.reloadCompareProducts();
            };
            ProductListController.prototype.onCategoryLeftNavFilterUpdated = function () {
                this.products.pagination.page = 1;
                this.updateProductData();
            };
            // set up the handlers for the browser back button using popstate events
            ProductListController.prototype.initBackButton = function () {
                var _this = this;
                // update the page when user hits the back button (without leaving the page)
                this.$window.addEventListener("popstate", this.restoreState);
                this.$scope.$on("$destroy", function () {
                    _this.$window.removeEventListener("popstate", _this.restoreState);
                });
            };
            // do actions that depend on the product settings
            ProductListController.prototype.applySettings = function () {
                var _this = this;
                this.view = this.view || this.settings.defaultViewType.toLowerCase();
                if (this.view !== "list" && this.view !== "grid" && this.view !== "table") {
                    this.view = "list";
                }
                this.customPagerContext = {
                    isSearch: this.isSearch,
                    view: this.view,
                    selectView: this.selectView,
                    attributeTypeFacets: this.products.attributeTypeFacets,
                    changeTableColumn: (function (attr) { return _this.changeTableColumn(attr); }),
                    sortedTableColumns: null
                };
                this.customPagerContext.selectView(this.customPagerContext.view);
            };
            // set the isBeingCompared boolean on the products
            ProductListController.prototype.reloadCompareProducts = function () {
                var productsToCompare = this.compareProductsService.getProductIds();
                this.products.products.forEach(function (product) {
                    product.isBeingCompared = lodash.contains(productsToCompare, product.id);
                });
            };
            ProductListController.prototype.resolvePage = function () {
                var _this = this;
                var path = this.$stateParams.path || window.location.pathname;
                this.productService.getCatalogPage(path).then(function (catalogPage) { _this.getCatalogPageCompleted(catalogPage); }, function (error) { _this.getCatalogPageFailed(error); });
            };
            ProductListController.prototype.getCatalogPageCompleted = function (catalogPage) {
                if (catalogPage.productId) {
                    return;
                }
                this.category = catalogPage.category;
                this.breadCrumbs = catalogPage.breadCrumbs;
                this.getProductData({
                    categoryId: this.category.id,
                    pageSize: this.pageSize || (this.products.pagination ? this.products.pagination.pageSize : null),
                    sort: this.sort || this.$localStorage.get("productListSortType", ""),
                    page: this.page,
                    attributeValueIds: this.attributeValueIds,
                    priceFilters: this.priceFilterMinimums,
                    searchWithin: this.searchWithinTerms.join(" "),
                    includeSuggestions: this.includeSuggestions,
                    getAllAttributeFacets: true,
                    applyPersonalization: true,
                    includeAttributes: "IncludeOnProduct",
                    includeAlternateInventory: !this.enableWarehousePickup || this.session.fulfillmentMethod !== "PickUp"
                });
                this.$rootScope.$broadcast("categoryLoaded", this.category.id);
            };
            ProductListController.prototype.getCatalogPageFailed = function (error) {
            };
            // params: object with query string parameters for the products REST service
            ProductListController.prototype.getProductData = function (params, expand) {
                var _this = this;
                if (this.ready) {
                    this.spinnerService.show("productlist");
                }
                expand = expand ? expand : ["pricing", "attributes", "facets"];
                this.productService.getProducts(params, expand).then(function (productCollection) { _this.getProductsCompleted(productCollection, params, expand); }, function (error) { _this.getProductsFailed(error); });
            };
            ProductListController.prototype.getProductsCompleted = function (productCollection, params, expand) {
                this.addSearchResultEvent(params.query, productCollection);
                if (productCollection.searchTermRedirectUrl) {
                    // use replace to prevent back button from returning to this page
                    if (productCollection.searchTermRedirectUrl.lastIndexOf("http", 0) === 0) {
                        this.$window.location.replace(productCollection.searchTermRedirectUrl);
                    }
                    else {
                        this.$location.replace();
                        this.coreService.redirectToPath(productCollection.searchTermRedirectUrl);
                    }
                    return;
                }
                // got product data
                if (productCollection.exactMatch) {
                    this.searchService.addSearchHistory(this.query, this.searchHistoryLimit, this.includeSuggestions.toLowerCase() === "true");
                    this.coreService.redirectToPath(productCollection.products[0].productDetailUrl + "?criteria=" + encodeURIComponent(params.query));
                    return;
                }
                if (!this.pageChanged) {
                    this.loadProductFilter(productCollection, expand);
                }
                this.products = productCollection;
                this.products.products.forEach(function (product) {
                    product.qtyOrdered = product.minimumOrderQty || 1;
                });
                this.reloadCompareProducts();
                //// allow the page to show
                this.ready = true;
                this.noResults = productCollection.products.length === 0;
                if (this.includeSuggestions === "true") {
                    if (productCollection.originalQuery) {
                        this.query = productCollection.correctedQuery || productCollection.originalQuery;
                        this.originalQuery = productCollection.originalQuery;
                        this.autoCorrectedQuery = productCollection.correctedQuery != null && productCollection.correctedQuery !== productCollection.originalQuery;
                    }
                    else {
                        this.autoCorrectedQuery = false;
                    }
                }
                this.searchService.addSearchHistory(this.query, this.searchHistoryLimit, this.includeSuggestions.toLowerCase() === "true");
                this.getRealTimePrices();
                if (!this.settings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
                this.imagesLoaded = 0;
                if (this.view === "grid") {
                    this.waitForDom();
                }
            };
            ProductListController.prototype.addSearchResultEvent = function (searchTerm, productCollection) {
                if (this.$window.dataLayer && productCollection.pagination && searchTerm) {
                    this.$window.dataLayer.push({
                        'event': 'searchResults',
                        'searchQuery': productCollection.originalQuery,
                        'correctedQuery': productCollection.correctedQuery,
                        'numSearchResults': productCollection.pagination.totalItemCount
                    });
                }
            };
            ProductListController.prototype.getProductsFailed = function (error) {
                // no results
                this.ready = true;
                this.noResults = true;
            };
            ProductListController.prototype.getRealTimePrices = function () {
                var _this = this;
                if (this.settings.realTimePricing) {
                    this.productService.getProductRealTimePrices(this.products.products).then(function (pricingResult) { return _this.getProductRealTimePricesCompleted(pricingResult); }, function (error) { return _this.getProductRealTimePricesFailed(error); });
                }
            };
            ProductListController.prototype.getProductRealTimePricesCompleted = function (result) {
                if (this.settings.inventoryIncludedWithPricing) {
                    this.getRealTimeInventory();
                }
            };
            ProductListController.prototype.getProductRealTimePricesFailed = function (error) {
                this.failedToGetRealTimePrices = true;
                if (this.settings.inventoryIncludedWithPricing) {
                    this.failedToGetRealTimeInventory = true;
                }
            };
            ProductListController.prototype.getRealTimeInventory = function () {
                var _this = this;
                if (this.settings.realTimeInventory) {
                    this.productService.getProductRealTimeInventory(this.products.products).then(function (realTimeInventory) { return _this.getProductRealTimeInventoryCompleted(realTimeInventory); }, function (error) { return _this.getProductRealTimeInventoryFailed(error); });
                }
            };
            ProductListController.prototype.getProductRealTimeInventoryCompleted = function (realTimeInventory) {
            };
            ProductListController.prototype.getProductRealTimeInventoryFailed = function (error) {
                this.failedToGetRealTimeInventory = true;
            };
            ProductListController.prototype.loadProductFilter = function (result, expand) {
                var _this = this;
                if (this.filterType === "attribute") {
                    if (result.attributeTypeFacets.length > 0) {
                        this.products.attributeTypeFacets = result.attributeTypeFacets;
                    }
                    else {
                        result.attributeTypeFacets = this.products.attributeTypeFacets;
                    }
                    result.categoryFacets = this.products.categoryFacets;
                    result.priceRange = this.products.priceRange;
                }
                if (this.filterType === "price") {
                    result.categoryFacets = this.products.categoryFacets;
                    result.priceRange = this.products.priceRange;
                }
                if (!expand || !expand.some(function (e) { return e === "pricing"; })) {
                    result.priceRange = this.products.priceRange;
                }
                if (!expand || !expand.some(function (e) { return e === "facets"; })) {
                    result.attributeTypeFacets = this.products.attributeTypeFacets;
                    result.categoryFacets = this.products.categoryFacets;
                }
                if (this.filterType !== "clear") {
                    if (this.products.attributeTypeFacets) {
                        this.products.attributeTypeFacets.forEach(function (atf) {
                            atf.attributeValueFacets.forEach(function (avf) {
                                if (avf.selected) {
                                    _this.attributeValueIds.push(avf.attributeValueId.toString());
                                }
                            });
                        });
                    }
                    if (this.products.priceRange && this.products.priceRange.priceFacets) {
                        this.products.priceRange.priceFacets.forEach(function (pf) {
                            if (pf.selected) {
                                _this.priceFilterMinimums.push(pf.minimumPrice.toString());
                            }
                        });
                    }
                    if (this.category == null && result.categoryFacets) {
                        var categoryFacet = lodash.first(lodash.where(result.categoryFacets, { "selected": true }));
                        if (categoryFacet) {
                            this.filterCategory.categoryId = categoryFacet.categoryId;
                            this.filterCategory.shortDescription = categoryFacet.shortDescription;
                            this.filterCategory.selected = true;
                            this.searchCategory = null;
                        }
                    }
                }
                this.productFilterLoaded = true;
                this.$scope.$broadcast("ProductListController-filterLoaded");
            };
            // updates products based on the state of this.pagination and the initial search/category query
            ProductListController.prototype.updateProductData = function () {
                this.storeHistory();
                this.$localStorage.set("productListSortType", this.products.pagination.sortType);
                var params = {
                    categoryId: this.category ? this.category.id : (this.filterCategory ? this.filterCategory.categoryId : null),
                    query: this.query,
                    searchWithin: this.searchWithinTerms.join(" "),
                    page: this.products.pagination.page,
                    pageSize: this.products.pagination.pageSize,
                    sort: this.products.pagination.sortType,
                    attributeValueIds: this.attributeValueIds,
                    priceFilters: this.priceFilterMinimums,
                    includeSuggestions: this.includeSuggestions,
                    getAllAttributeFacets: this.filterType === "attribute",
                    applyPersonalization: true,
                    includeAttributes: "IncludeOnProduct"
                };
                this.getProductData(params, this.pageChanged ? ["pricing", "attributes"] : null);
                this.pageChanged = false;
            };
            // store state in the browser history so back button will work
            ProductListController.prototype.storeHistory = function () {
                var state = {
                    page: this.products.pagination.page,
                    attributeValueIds: this.attributeValueIds,
                    filterCategory: this.filterCategory,
                    priceFilterMinimums: this.priceFilterMinimums,
                    searchWithinTerms: this.searchWithinTerms
                };
                this.coreService.pushState(state);
            };
            ProductListController.prototype.attributeValueForSection = function (sectionFacet, product) {
                for (var i = 0; i < product.attributeTypes.length; i++) {
                    var productSection = product.attributeTypes[i];
                    if (productSection.id.toString() === sectionFacet.attributeTypeId.toString()) {
                        if (productSection.attributeValues.length > 0) {
                            return Array.prototype.map.call(productSection.attributeValues, function (o) { return " " + o.valueDisplay; }).toString().trim();
                        }
                    }
                }
                return null;
            };
            // tell the hopper to add the product to the compare list
            ProductListController.prototype.compareProduct = function (product) {
                if (!product.isBeingCompared) {
                    if (this.compareProductsService.getProductIds().length > 5) {
                        this.showExceedCompareLimitPopup();
                        return;
                    }
                    this.compareProductsService.addProduct(product);
                }
                else {
                    this.compareProductsService.removeProduct(product.id.toString());
                }
                product.isBeingCompared = !product.isBeingCompared;
            };
            ProductListController.prototype.showExceedCompareLimitPopup = function () {
                angular.element("#AddToCompareExceedsSixProducts").foundation("reveal", "open");
            };
            ProductListController.prototype.addToCart = function (product) {
                var _this = this;
                this.addingToCart = true;
                this.cartService.addLineFromProduct(product, null, null, true).then(function (cartLine) { _this.addToCartCompleted(cartLine); }, function (error) { _this.addToCartFailed(error); });
            };
            ProductListController.prototype.addToCartCompleted = function (cartLine) {
                this.addingToCart = false;
            };
            ProductListController.prototype.addToCartFailed = function (error) {
                this.addingToCart = false;
            };
            ProductListController.prototype.changeUnitOfMeasure = function (product) {
                var _this = this;
                this.productService.updateAvailability(product);
                this.productService.changeUnitOfMeasure(product).then(function (productDto) { _this.changeUnitOfMeasureCompleted(productDto); }, function (error) { _this.changeUnitOfMeasureFailed(error); });
            };
            ProductListController.prototype.changeUnitOfMeasureCompleted = function (product) {
            };
            ProductListController.prototype.changeUnitOfMeasureFailed = function (error) {
            };
            ProductListController.prototype.killHeights = function () {
                $(".item-inf-wrapper").removeAttr("style");
                $(".item-price").removeAttr("style");
                $(".item-thumb").removeAttr("style");
                $(".product-info").removeAttr("style");
                //$(".actions-block").removeAttr("style");
            };
            // Equalize the product grid after all of the images have been downloaded or they will be misaligned (grid view only)
            ProductListController.prototype.waitForDom = function (tries) {
                var _this = this;
                if (isNaN(+tries)) {
                    tries = 1000; // Max 20000ms
                }
                // If DOM isn't ready after max number of tries then stop
                if (tries > 0) {
                    setTimeout(function () {
                        if (_this.imagesLoaded >= _this.products.products.length) {
                            _this.cEqualize();
                        }
                        else {
                            _this.waitForDom(tries - 1);
                        }
                    }, 20);
                }
            };
            // in grid view, make all the boxes as big as the biggest one
            ProductListController.prototype.cEqualize = function () {
                var $itemBlocks = $(".item-block");
                if ($itemBlocks.length > 0) {
                    var maxHeight_1 = -1;
                    var priceHeight_1 = -1;
                    var thumbHeight_1 = -1;
                    var productInfoHeight_1 = -1;
                    $itemBlocks.each(function (i, elem) {
                        var $elem = $(elem);
                        maxHeight_1 = maxHeight_1 > $elem.find(".item-inf-wrapper").height() ? maxHeight_1 : $elem.find(".item-inf-wrapper").height();
                        priceHeight_1 = priceHeight_1 > $elem.find(".item-price").height() ? priceHeight_1 : $elem.find(".item-price").height();
                        thumbHeight_1 = thumbHeight_1 > $elem.find(".item-thumb").height() ? thumbHeight_1 : $elem.find(".item-thumb").height();
                        productInfoHeight_1 = productInfoHeight_1 > $elem.find(".product-info").height() ? productInfoHeight_1 : $elem.find(".product-info").height();
                    });
                    if (maxHeight_1 > 0) {
                        $itemBlocks.each(function (i, elem) {
                            var $elem = $(elem);
                            $elem.find(".item-inf-wrapper").height(maxHeight_1);
                            $elem.find(".item-price").height(priceHeight_1);
                            $elem.find(".item-thumb").height(thumbHeight_1);
                            $elem.find(".product-info").height(productInfoHeight_1);
                            $elem.addClass("eq");
                        });
                    }
                }
            };
            ProductListController.prototype.openWishListPopup = function (product) {
                this.addToWishlistPopupService.display([product]);
            };
            // changed handler on table view column check boxes (ui in pager.cshtml)
            ProductListController.prototype.changeTableColumn = function (attribute) {
                var columnNameIndex = this.visibleColumnNames.indexOf(attribute.name);
                if (columnNameIndex === -1) {
                    if (this.visibleTableColumns().length >= 3) {
                        attribute.checked = false;
                        this.coreService.displayModal("#popup-columns-limit");
                    }
                    else {
                        this.visibleColumnNames.push(attribute.name);
                    }
                }
                else {
                    this.visibleColumnNames.splice(columnNameIndex, 1);
                }
            };
            // all columns for table view check boxes
            ProductListController.prototype.sortedTableColumns = function (products) {
                if (!products.attributeTypeFacets) {
                    return [];
                }
                return lodash.chain(products.attributeTypeFacets)
                    .sortBy(["sort", "name"])
                    .value();
            };
            // visible (checked) columns for table view
            ProductListController.prototype.visibleTableColumns = function () {
                var _this = this;
                return lodash.chain(this.initialAttributeTypeFacets)
                    .sortBy(["sort", "name"])
                    .filter(function (atf) { return _this.visibleColumnNames.indexOf(atf.name) !== -1; })
                    .value();
            };
            ProductListController.prototype.toggleTablePanel = function (product) {
                if (this.visibleTableProduct === product) {
                    this.visibleTableProduct = null;
                }
                else {
                    this.visibleTableProduct = product;
                }
            };
            ProductListController.prototype.isTablePanelVisible = function (product) {
                return this.visibleTableProduct === product;
            };
            // returns true if this is a page that renders sub categories rather than products
            ProductListController.prototype.isCategoryPage = function () {
                return this.category && this.category.subCategories && this.category.subCategories.length > 0;
            };
            ProductListController.prototype.pagerPageChanged = function () {
                this.pageChanged = true;
            };
            ProductListController.prototype.goToSearchCriteria = function (searchCriteria, includeSuggestions) {
                var _this = this;
                if (includeSuggestions === void 0) { includeSuggestions = true; }
                this.$location.search("criteria", searchCriteria);
                if (!includeSuggestions) {
                    this.$location.search("includeSuggestions", "false");
                }
                // for unknown reasons clicking on link does not trigger new search on microsites
                // so we need force re-init
                if (this.$window.insiteMicrositeUriPrefix) {
                    setTimeout(function () { _this.init(); }, 50);
                }
            };
            ProductListController.prototype.resetVisibleColumnNames = function (products) {
                var _this = this;
                this.visibleColumnNames = [];
                lodash.chain(this.sortedTableColumns(products))
                    .first(3)
                    .forEach(function (facet) {
                    _this.visibleColumnNames.push(facet.name);
                    facet.checked = true;
                });
            };
            ProductListController.$inject = [
                "$scope",
                "coreService",
                "cartService",
                "productService",
                "compareProductsService",
                "$rootScope",
                "$window",
                "$localStorage",
                "paginationService",
                "searchService",
                "spinnerService",
                "addToWishlistPopupService",
                "settingsService",
                "$stateParams",
                "queryString",
                "$location",
                "sessionService"
            ];
            return ProductListController;
        }());
        catalog.ProductListController = ProductListController;
        angular
            .module("insite")
            .controller("ProductListController", ProductListController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-list.controller.js.map