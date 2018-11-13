import CategoryFacetDto = Insite.Core.Plugins.Search.Dtos.CategoryFacetDto;
import AttributeTypeFacetDto = Insite.Core.Plugins.Search.Dtos.AttributeTypeFacetDto;
import AttributeValueDto = Insite.Catalog.Services.Dtos.AttributeValueDto;

module insite.catalog {
    "use strict";

    export interface IProductListStateParams extends IContentPageStateParams {
        criteria: string;
    }

    export interface ICustomPagerContext {
        isSearch: boolean;
        view: string;
        selectView: (viewName: string) => void;
        attributeTypeFacets: AttributeTypeFacetDto[];
        changeTableColumn: (attribute: AttributeTypeFacetDto) => void;
        sortedTableColumns: AttributeTypeFacetDto[];
    };

    export class ProductListController {
        view: string;
        attributeValueIds: string[] = [];
        priceFilterMinimums: string[] = [];
        filterCategory: CategoryFacetDto;
        searchWithinTerms = [];
        query: string;
        ready = false;
        products: ProductCollectionModel = {} as any;
        settings: ProductSettingsModel;
        category: CategoryModel;  // regular category page
        breadCrumbs: BreadCrumbModel[];
        searchCategory: CategoryModel; // searching within a category
        page: number = null; // query string page
        pageSize: number = null; // query string pageSize
        sort: string = null; // query string sort
        isSearch: boolean;
        visibleTableProduct: ProductDto;
        visibleColumnNames: string[] = [];
        customPagerContext: ICustomPagerContext;
        paginationStorageKey = "DefaultPagination-ProductList";
        noResults: boolean;
        pageChanged = false; // true when the pager has done something to change pages.
        imagesLoaded: number;
        originalQuery: string;
        autoCorrectedQuery: boolean;
        includeSuggestions: string;
        searchHistoryLimit: number;
        failedToGetRealTimePrices = false;
        failedToGetRealTimeInventory = false;
        productFilterLoaded = false;
        filterType: string;
        addingToCart = false;
        initialAttributeTypeFacets: AttributeTypeFacetDto[];
        enableWarehousePickup: boolean;
        session: SessionModel;
        getPageDataCalled: boolean;

        static $inject = [
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

        constructor(
            protected $scope: ng.IScope,
            protected coreService: core.ICoreService,
            protected cartService: cart.ICartService,
            protected productService: IProductService,
            protected compareProductsService: ICompareProductsService,
            protected $rootScope: ng.IRootScopeService,
            protected $window: ng.IWindowService,
            protected $localStorage: common.IWindowStorage,
            protected paginationService: core.IPaginationService,
            protected searchService: ISearchService,
            protected spinnerService: core.ISpinnerService,
            protected addToWishlistPopupService: wishlist.AddToWishlistPopupService,
            protected settingsService: core.ISettingsService,
            protected $stateParams: IProductListStateParams,
            protected queryString: common.IQueryStringService,
            protected $location: ng.ILocationService,
            protected sessionService: account.ISessionService) {
            this.init();
        }

        init(): void {
            this.products.pagination = this.paginationService.getDefaultPagination(this.paginationStorageKey);
            this.filterCategory = { categoryId: null, selected: false, shortDescription: "", count: 0, subCategoryDtos: null, websiteId: null };
            this.view = this.$localStorage.get("productListViewName");

            this.getQueryStringValues();
            this.getHistoryValues();

            this.isSearch = this.query !== "";

            this.settingsService.getSettings().then(
                (settingsCollection: core.SettingsCollection) => { this.getSettingsCompleted(settingsCollection); },
                (error: any) => { this.getSettingsFailed(error); });

            this.sessionService.getSession().then(
                (session: SessionModel) => { this.getSessionCompleted(session); },
                (error: any) => { this.getSessionFailed(error); });

            const removeCompareProductsUpdated = this.$rootScope.$on("compareProductsUpdated", () => {
                this.onCompareProductsUpdated();
            });

            this.$scope.$on("$destroy", () => {
                removeCompareProductsUpdated();
            });

            this.$scope.$on("CategoryLeftNavController-filterUpdated", (event: any, filterType: any) => {
                this.filterType = filterType;
                this.onCategoryLeftNavFilterUpdated();
            });

            this.initBackButton();

            this.$scope.$watch(() => this.category, (newCategory) => {
                if (!newCategory) {
                    return;
                }

                this.getFacets(newCategory.id);
            });

            this.$scope.$on("sessionUpdated", (event: ng.IAngularEvent, session: SessionModel) => {
                this.onSessionUpdated(session);
            });
        }

        protected getFacets(categoryId: string): void {
            const params = {
                priceFilters: this.priceFilterMinimums,
                categoryId: categoryId,
                includeSuggestions: this.includeSuggestions,
                includeAlternateInventory: !this.enableWarehousePickup || this.session.fulfillmentMethod !== "PickUp"
            };

            const expand = ["onlyfacets"];
            this.productService.getProducts(params, expand).then(
                (productCollection: ProductCollectionModel) => { this.getFacetsCompleted(productCollection)},
                (error: any) => { this.getFacetsFailed(error); });
        }

        protected getFacetsCompleted(productCollection: ProductCollectionModel): void {
            this.initialAttributeTypeFacets = productCollection.attributeTypeFacets;
            this.resetVisibleColumnNames(productCollection);
            this.customPagerContext.sortedTableColumns = this.sortedTableColumns(productCollection);
        }

        protected getFacetsFailed(error: any): void {
        }

        protected getQueryStringValues(): void {
            this.query = this.$stateParams.criteria || this.queryString.get("criteria") || "";
            this.page = this.queryString.get("page") || null;
            this.pageSize = this.queryString.get("pageSize") || null;
            this.sort = this.queryString.get("sort") || null;
            this.includeSuggestions = this.queryString.get("includeSuggestions") || "true";
        }

        // get context values coming from the browser history (when back button was used)
        protected getHistoryValues(): void {
            const state = this.coreService.getHistoryState();
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
            } else {
                // no history for first page - return the default values
                this.page = 1;
                this.attributeValueIds = [];
                this.filterCategory = { categoryId: null, selected: false, shortDescription: "", count: 0, subCategoryDtos: null, websiteId: null };
                this.priceFilterMinimums = [];
                this.searchWithinTerms = [];
            }
        }

        protected getSettingsCompleted(settingsCollection: core.SettingsCollection): void {
            this.settings = settingsCollection.productSettings;
            this.searchHistoryLimit = settingsCollection.searchSettings ? settingsCollection.searchSettings.searchHistoryLimit : null;
            this.enableWarehousePickup = settingsCollection.accountSettings.enableWarehousePickup;
            this.applySettings();

            this.getPageDataOnInit();
        }

        protected getSettingsFailed(error: any): void {
        }

        protected onSessionUpdated(session: SessionModel): void {
            this.session = session;
            this.getPageData();
        }

        protected getSessionCompleted(session: SessionModel): void {
            this.session = session;
            this.getPageDataOnInit();
        }

        protected getPageDataOnInit(): void {
            if (this.session && this.settings && !this.getPageDataCalled) {
                this.getPageDataCalled = true;
                this.getPageData();
            }
        }

        protected getSessionFailed(error: any): void {
        }

        protected getPageData(): void {
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
        }

        protected onCompareProductsUpdated(): void {
            this.reloadCompareProducts();
        }

        protected onCategoryLeftNavFilterUpdated(): void {
            this.products.pagination.page = 1;
            this.updateProductData();
        }

        // set up the handlers for the browser back button using popstate events
        protected initBackButton(): void {
            // update the page when user hits the back button (without leaving the page)
            this.$window.addEventListener("popstate", this.restoreState);
            this.$scope.$on("$destroy", () => {
                this.$window.removeEventListener("popstate", this.restoreState);
            });
        }

        restoreState = () => {
            this.getQueryStringValues();
            this.getHistoryValues();

            const getProductParams: IProductCollectionParameters = {
                pageSize: this.pageSize || (this.products.pagination ? this.products.pagination.pageSize : null),
                sort: this.sort || this.$localStorage.get("productListSortType", null),
                page: this.page,
                attributeValueIds: this.attributeValueIds,
                priceFilters: this.priceFilterMinimums,
                includeSuggestions: this.includeSuggestions,
                includeAttributes: "IncludeOnProduct"
            };

            if (this.isSearch) {
                getProductParams.query = this.query;
                getProductParams.categoryId = this.category ? this.category.id : (this.filterCategory ? this.filterCategory.categoryId : null);
            } else {
                getProductParams.categoryId = this.category.id;
            }

            this.getProductData(getProductParams);
        }

        // do actions that depend on the product settings
        protected applySettings(): void {
            this.view = this.view || this.settings.defaultViewType.toLowerCase();
            if (this.view !== "list" && this.view !== "grid" && this.view !== "table") {
                this.view = "list";
            }

            this.customPagerContext = {
                isSearch: this.isSearch,
                view: this.view,
                selectView: this.selectView,
                attributeTypeFacets: this.products.attributeTypeFacets,
                changeTableColumn: ((attr) => this.changeTableColumn(attr)),
                sortedTableColumns: null
            };

            this.customPagerContext.selectView(this.customPagerContext.view);
        }

        // set the isBeingCompared boolean on the products
        protected reloadCompareProducts(): void {
            const productsToCompare = this.compareProductsService.getProductIds();
            this.products.products.forEach((product: ProductDto) => {
                product.isBeingCompared = lodash.contains(productsToCompare, product.id);
            });
        }

        protected resolvePage(): void {
            const path = this.$stateParams.path || window.location.pathname;
            this.productService.getCatalogPage(path).then(
                (catalogPage: CatalogPageModel) => { this.getCatalogPageCompleted(catalogPage); },
                (error: any) => { this.getCatalogPageFailed(error); }
            );
        }

        protected getCatalogPageCompleted(catalogPage: CatalogPageModel): void {
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
        }

        protected getCatalogPageFailed(error: any): void {
        }

        // params: object with query string parameters for the products REST service
        protected getProductData(params: IProductCollectionParameters, expand?: string[]): void {
            if (this.ready) {
                this.spinnerService.show("productlist");
            }

            expand = expand ? expand : ["pricing", "attributes", "facets"];

            this.productService.getProducts(params, expand).then(
                (productCollection: ProductCollectionModel) => { this.getProductsCompleted(productCollection, params, expand); },
                (error: any) => { this.getProductsFailed(error); });
        }

        protected getProductsCompleted(productCollection: ProductCollectionModel, params: IProductCollectionParameters, expand?: string[]): void {
            this.addSearchResultEvent(params.query, productCollection);

            if (productCollection.searchTermRedirectUrl) {
                // use replace to prevent back button from returning to this page
                if (productCollection.searchTermRedirectUrl.lastIndexOf("http", 0) === 0) {
                    this.$window.location.replace(productCollection.searchTermRedirectUrl);
                } else {
                    this.$location.replace();
                    this.coreService.redirectToPath(productCollection.searchTermRedirectUrl);
                }
                return;
            }

            // got product data
            if (productCollection.exactMatch) {
                this.searchService.addSearchHistory(this.query, this.searchHistoryLimit, this.includeSuggestions.toLowerCase() === "true");
                this.coreService.redirectToPath(`${productCollection.products[0].productDetailUrl}?criteria=${encodeURIComponent(params.query)}`);
                return;
            }

            if (!this.pageChanged) {
                this.loadProductFilter(productCollection, expand);
            }

            this.products = productCollection;
            this.products.products.forEach(product => {
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
                } else {
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
        }

        protected addSearchResultEvent(searchTerm: string, productCollection: ProductCollectionModel): void {
            if (this.$window.dataLayer && productCollection.pagination && searchTerm) {
                this.$window.dataLayer.push({
                    'event': 'searchResults',
                    'searchQuery': productCollection.originalQuery,
                    'correctedQuery': productCollection.correctedQuery,
                    'numSearchResults': productCollection.pagination.totalItemCount
                });
            }
        }

        protected getProductsFailed(error: any): void {
            // no results
            this.ready = true;
            this.noResults = true;
        }

        protected getRealTimePrices(): void {
            if (this.settings.realTimePricing) {
                this.productService.getProductRealTimePrices(this.products.products).then(
                    (pricingResult: RealTimePricingModel) => this.getProductRealTimePricesCompleted(pricingResult),
                    (error: any) => this.getProductRealTimePricesFailed(error));
            }
        }

        protected getProductRealTimePricesCompleted(result: RealTimePricingModel): void {
            if (this.settings.inventoryIncludedWithPricing) {
                this.getRealTimeInventory();
            }
        }

        protected getProductRealTimePricesFailed(error: any): void {
            this.failedToGetRealTimePrices = true;

            if (this.settings.inventoryIncludedWithPricing) {
                this.failedToGetRealTimeInventory = true;
            }
        }

        protected getRealTimeInventory(): void {
            if (this.settings.realTimeInventory) {
                this.productService.getProductRealTimeInventory(this.products.products).then(
                    (realTimeInventory: RealTimeInventoryModel) => this.getProductRealTimeInventoryCompleted(realTimeInventory),
                    (error: any) => this.getProductRealTimeInventoryFailed(error));
            }
        }

        protected getProductRealTimeInventoryCompleted(realTimeInventory: RealTimeInventoryModel): void {
        }

        protected getProductRealTimeInventoryFailed(error: any): void {
            this.failedToGetRealTimeInventory = true;
        }

        protected loadProductFilter(result: ProductCollectionModel, expand?: string[]): void {
            if (this.filterType === "attribute") {
                if (result.attributeTypeFacets.length > 0) {
                    this.products.attributeTypeFacets = result.attributeTypeFacets;
                } else {
                    result.attributeTypeFacets = this.products.attributeTypeFacets;
                }

                result.categoryFacets = this.products.categoryFacets;
                result.priceRange = this.products.priceRange;
            }

            if (this.filterType === "price") {
                result.categoryFacets = this.products.categoryFacets;
                result.priceRange = this.products.priceRange;
            }

            if (!expand || !expand.some(e => e === "pricing")) {
                result.priceRange = this.products.priceRange;
            }
            if (!expand || !expand.some(e => e === "facets")) {
                result.attributeTypeFacets = this.products.attributeTypeFacets;
                result.categoryFacets = this.products.categoryFacets;
            }

            if (this.filterType !== "clear") {
                if (this.products.attributeTypeFacets) {
                    this.products.attributeTypeFacets.forEach((atf) => {
                        atf.attributeValueFacets.forEach((avf) => {
                            if (avf.selected) {
                                this.attributeValueIds.push(avf.attributeValueId.toString());
                            }
                        });
                    });
                }

                if (this.products.priceRange && this.products.priceRange.priceFacets) {
                    this.products.priceRange.priceFacets.forEach((pf) => {
                        if (pf.selected) {
                            this.priceFilterMinimums.push(pf.minimumPrice.toString());
                        }
                    });
                }

                if (this.category == null && result.categoryFacets) {
                    const categoryFacet = lodash.first(lodash.where(result.categoryFacets, { "selected": true }));
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
        }

        // updates products based on the state of this.pagination and the initial search/category query
        protected updateProductData(): void {
            this.storeHistory();
            this.$localStorage.set("productListSortType", this.products.pagination.sortType);

            const params = {
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
        }

        // store state in the browser history so back button will work
        protected storeHistory(): void {
            const state = {
                page: this.products.pagination.page,
                attributeValueIds: this.attributeValueIds,
                filterCategory: this.filterCategory,
                priceFilterMinimums: this.priceFilterMinimums,
                searchWithinTerms: this.searchWithinTerms
            };
            this.coreService.pushState(state);
        }

        attributeValueForSection(sectionFacet: AttributeTypeFacetDto, product: ProductDto): string {
            for (let i = 0; i < product.attributeTypes.length; i++) {
                const productSection = product.attributeTypes[i];
                if (productSection.id.toString() === sectionFacet.attributeTypeId.toString()) {
                    if (productSection.attributeValues.length > 0) {
                        return Array.prototype.map.call(productSection.attributeValues, o => ` ${o.valueDisplay}`).toString().trim();
                    }
                }
            }
            return null;
        }

        // tell the hopper to add the product to the compare list
        compareProduct(product: ProductDto): void {
            if (!product.isBeingCompared) {
                if (this.compareProductsService.getProductIds().length > 5) {
                    this.showExceedCompareLimitPopup();
                    return;
                }
                this.compareProductsService.addProduct(product);
            } else {
                this.compareProductsService.removeProduct(product.id.toString());
            }
            product.isBeingCompared = !product.isBeingCompared;
        }

        protected showExceedCompareLimitPopup(): void {
            (angular.element("#AddToCompareExceedsSixProducts") as any).foundation("reveal", "open");
        }

        addToCart(product: ProductDto): void {
            this.addingToCart = true;

            this.cartService.addLineFromProduct(product, null, null, true).then(
                (cartLine: CartLineModel) => { this.addToCartCompleted(cartLine); },
                (error: any) => { this.addToCartFailed(error); }
            );
        }

        protected addToCartCompleted(cartLine: CartLineModel): void {
            this.addingToCart = false;
        }

        protected addToCartFailed(error: any): void {
            this.addingToCart = false;
        }

        changeUnitOfMeasure(product: ProductDto): void {
            this.productService.updateAvailability(product);
            this.productService.changeUnitOfMeasure(product).then(
                (productDto: ProductDto) => { this.changeUnitOfMeasureCompleted(productDto); },
                (error: any) => { this.changeUnitOfMeasureFailed(error); }
            );
        }

        protected changeUnitOfMeasureCompleted(product: ProductDto): void {
        }

        protected changeUnitOfMeasureFailed(error: any): void {
        }

        // called by pager when a different view is selected, and also once at startup
        selectView = (viewName: string) => {
            this.killHeights();
            this.view = viewName;
            // product will be undefined if this was called on startup. let getProductData call waitForDom.
            if (viewName === "grid" && this.products.products) {
                this.waitForDom();
            }
            this.$localStorage.set("productListViewName", viewName);
            this.customPagerContext.view = viewName;
        }

        protected killHeights(): void {
            $(".item-inf-wrapper").removeAttr("style");
            $(".item-price").removeAttr("style");
            $(".item-thumb").removeAttr("style");
            $(".product-info").removeAttr("style");
            //$(".actions-block").removeAttr("style");
        }

        // Equalize the product grid after all of the images have been downloaded or they will be misaligned (grid view only)
        protected waitForDom(tries?: number): void {
            if (isNaN(+tries)) {
                tries = 1000; // Max 20000ms
            }

            // If DOM isn't ready after max number of tries then stop
            if (tries > 0) {
                setTimeout(() => {
                    if (this.imagesLoaded >= this.products.products.length) {
                        this.cEqualize();
                    } else {
                        this.waitForDom(tries - 1);
                    }
                }, 20);
            }
        }

        // in grid view, make all the boxes as big as the biggest one
        protected cEqualize(): void {
            const $itemBlocks = $(".item-block");
            if ($itemBlocks.length > 0) {
                let maxHeight = -1;
                let priceHeight = -1;
                let thumbHeight = -1;
                let productInfoHeight = -1;

                $itemBlocks.each((i, elem) => {
                    const $elem = $(elem);
                    maxHeight = maxHeight > $elem.find(".item-inf-wrapper").height() ? maxHeight : $elem.find(".item-inf-wrapper").height();
                    priceHeight = priceHeight > $elem.find(".item-price").height() ? priceHeight : $elem.find(".item-price").height();
                    thumbHeight = thumbHeight > $elem.find(".item-thumb").height() ? thumbHeight : $elem.find(".item-thumb").height();
                    productInfoHeight = productInfoHeight > $elem.find(".product-info").height() ? productInfoHeight : $elem.find(".product-info").height();
                });
                if (maxHeight > 0) {
                    $itemBlocks.each((i, elem) => {
                        const $elem = $(elem);
                        $elem.find(".item-inf-wrapper").height(maxHeight);
                        $elem.find(".item-price").height(priceHeight);
                        $elem.find(".item-thumb").height(thumbHeight);
                        $elem.find(".product-info").height(productInfoHeight);
                        $elem.addClass("eq");
                    });
                }
            }
        }

        openWishListPopup(product: ProductDto): void {
            this.addToWishlistPopupService.display([product]);
        }

        // changed handler on table view column check boxes (ui in pager.cshtml)
        changeTableColumn(attribute: AttributeTypeFacetDto): void {
            const columnNameIndex = this.visibleColumnNames.indexOf(attribute.name);
            if (columnNameIndex === -1) {
                if (this.visibleTableColumns().length >= 3) {
                    (attribute as any).checked = false;
                    this.coreService.displayModal("#popup-columns-limit");
                } else {
                    this.visibleColumnNames.push(attribute.name);
                }
            } else {
                this.visibleColumnNames.splice(columnNameIndex, 1);
            }
        }

        // all columns for table view check boxes
        protected sortedTableColumns(products: ProductCollectionModel): AttributeTypeFacetDto[] {
            if (!products.attributeTypeFacets) {
                return [];
            }

            return lodash.chain(products.attributeTypeFacets)
                .sortBy(["sort", "name"])
                .value();
        }

        // visible (checked) columns for table view
        protected visibleTableColumns(): any[] {
            return lodash.chain(this.initialAttributeTypeFacets)
                .sortBy(["sort", "name"])
                .filter(atf => this.visibleColumnNames.indexOf(atf.name) !== -1)
                .value();
        }

        toggleTablePanel(product: ProductDto): void {
            if (this.visibleTableProduct === product) {
                this.visibleTableProduct = null;
            } else {
                this.visibleTableProduct = product;
            }
        }

        isTablePanelVisible(product: ProductDto): boolean {
            return this.visibleTableProduct === product;
        }

        // returns true if this is a page that renders sub categories rather than products
        isCategoryPage(): boolean {
            return this.category && this.category.subCategories && this.category.subCategories.length > 0;
        }

        pagerPageChanged(): void {
            this.pageChanged = true;
        }

        goToSearchCriteria(searchCriteria: string, includeSuggestions: boolean = true) {
            this.$location.search("criteria", searchCriteria);
            if (!includeSuggestions) {
                this.$location.search("includeSuggestions", "false");
            }

            // for unknown reasons clicking on link does not trigger new search on microsites
            // so we need force re-init
            if ((this.$window as any).insiteMicrositeUriPrefix) {
                setTimeout(() => { this.init(); }, 50);
            }
        }

        resetVisibleColumnNames(products: ProductCollectionModel): void {
            this.visibleColumnNames = [];
            lodash.chain(this.sortedTableColumns(products))
                .first(3)
                .forEach(facet => {
                    this.visibleColumnNames.push(facet.name);
                    (<any>facet).checked = true;
                });
        }
    }

    angular
        .module("insite")
        .controller("ProductListController", ProductListController);
}