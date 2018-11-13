var insite;
(function (insite) {
    var catalog;
    (function (catalog) {
        "use strict";
        var ProductImagesController = /** @class */ (function () {
            function ProductImagesController($scope) {
                this.$scope = $scope;
                this.mainPrefix = "main";
                this.zoomPrefix = "zoom";
                this.init();
            }
            ProductImagesController.prototype.init = function () {
                var _this = this;
                this.$scope.$watch(function () { return _this.product.productImages; }, function () {
                    if (_this.product.productImages.length > 0) {
                        _this.selectedImage = _this.product.productImages[0];
                    }
                    else {
                        _this.selectedImage = {
                            smallImagePath: _this.product.smallImagePath,
                            mediumImagePath: _this.product.mediumImagePath,
                            largeImagePath: _this.product.largeImagePath,
                            altText: _this.product.altText
                        };
                    }
                }, true);
                angular.element("#imgZoom").foundation("reveal");
                angular.element(document).on("close.fndtn.reveal", "#imgZoom[data-reveal]:visible", function () { _this.onImgZoomClose(); });
                angular.element(document).on("opened.fndtn", "#imgZoom[data-reveal]", function () { _this.onImgZoomOpened(); });
            };
            ProductImagesController.prototype.onImgZoomClose = function () {
                var _this = this;
                this.$scope.$apply(function () {
                    _this.showCarouselOnZoomModal = false;
                });
            };
            ProductImagesController.prototype.onImgZoomOpened = function () {
                var _this = this;
                this.$scope.$apply(function () {
                    _this.showCarouselOnZoomModal = true;
                });
            };
            ProductImagesController.prototype.getMainImageWidth = function () {
                return angular.element("#" + this.mainPrefix + "ProductImage").outerWidth();
            };
            ProductImagesController.prototype.getZoomImageWidth = function () {
                return angular.element("#" + this.zoomPrefix + "ProductImage").outerWidth();
            };
            ProductImagesController.$inject = ["$scope"];
            return ProductImagesController;
        }());
        catalog.ProductImagesController = ProductImagesController;
        angular
            .module("insite")
            .controller("ProductImagesController", ProductImagesController);
    })(catalog = insite.catalog || (insite.catalog = {}));
})(insite || (insite = {}));
//# sourceMappingURL=insite.product-images.controller.js.map