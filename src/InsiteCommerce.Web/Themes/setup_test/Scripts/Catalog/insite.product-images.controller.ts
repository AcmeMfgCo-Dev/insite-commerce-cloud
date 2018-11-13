module insite.catalog {
    "use strict";

    export class ProductImagesController {
        product: any;
        selectedImage: ProductImageDto;
        showCarouselOnZoomModal: boolean;
        mainPrefix = "main";
        zoomPrefix = "zoom";

        static $inject = ["$scope"];

        constructor(protected $scope: ng.IScope) {
            this.init();
        }

        init(): void {
            this.$scope.$watch(() => this.product.productImages, () => {
                if (this.product.productImages.length > 0) {
                    this.selectedImage = this.product.productImages[0];
                } else {
                    this.selectedImage = {
                        smallImagePath: this.product.smallImagePath,
                        mediumImagePath: this.product.mediumImagePath,
                        largeImagePath: this.product.largeImagePath,
                        altText: this.product.altText
                    } as ProductImageDto;
                }
            }, true);

            (angular.element("#imgZoom") as any).foundation("reveal");

            angular.element(document).on("close.fndtn.reveal", "#imgZoom[data-reveal]:visible", () => { this.onImgZoomClose(); });

            angular.element(document).on("opened.fndtn", "#imgZoom[data-reveal]", () => { this.onImgZoomOpened(); });
        }

        protected onImgZoomClose(): void {
            this.$scope.$apply(() => {
                this.showCarouselOnZoomModal = false;
            });
        }

        protected onImgZoomOpened(): void {
            this.$scope.$apply(() => {
                this.showCarouselOnZoomModal = true;
            });
        }

        getMainImageWidth(): number {
            return angular.element(`#${this.mainPrefix}ProductImage`).outerWidth();
        }

        getZoomImageWidth(): number {
            return angular.element(`#${this.zoomPrefix}ProductImage`).outerWidth();
        }
    }

    angular
        .module("insite")
        .controller("ProductImagesController", ProductImagesController);
}