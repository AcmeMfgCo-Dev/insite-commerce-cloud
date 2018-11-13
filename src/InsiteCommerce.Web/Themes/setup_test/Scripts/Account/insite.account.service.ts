import AccountModel = Insite.Account.WebApi.V1.ApiModels.AccountModel;
import AccountSettingsModel = Insite.Account.WebApi.V1.ApiModels.AccountSettingsModel;
import AccountCollectionModel = Insite.Account.WebApi.V1.ApiModels.AccountCollectionModel;
import ExternalProviderLinkCollectionModel = Insite.IdentityServer.Models.ExternalProviderLinkCollectionModel;

module insite.account {
    "use strict";

    export interface IAccountService {
        expand: string;
        getAccountSettings(): ng.IPromise<AccountSettingsModel>;
        getAccounts(searchText?: string, pagination?: Insite.Core.WebApi.PaginationModel, sort?: string): ng.IPromise<AccountCollectionModel>;
        getAccount(accountId?: System.Guid): ng.IPromise<AccountModel>;
        getExternalProviders(): ng.IPromise<ExternalProviderLinkCollectionModel>;
        createAccount(account: AccountModel): ng.IPromise<AccountModel>;
        updateAccount(account: AccountModel, accountId?: System.Guid): ng.IPromise<AccountModel>;
    }

    export class AccountService {
        serviceUri = "/api/v1/accounts";
        settingsUri = "/api/v1/settings/account";
        expand = "";

        static $inject = ["$http", "$window", "httpWrapperService"];

        constructor(
            protected $http: ng.IHttpService,
            protected $window: ng.IWindowService,
            protected httpWrapperService: core.HttpWrapperService) {
        }

        getAccountSettings(): ng.IPromise<AccountSettingsModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: this.settingsUri, method: "GET" }),
                this.getAccountSettingsCompleted,
                this.getAccountSettingsFailed
            );
        }

        protected getAccountSettingsCompleted(response: ng.IHttpPromiseCallbackArg<AccountSettingsModel>): void {
        }

        protected getAccountSettingsFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getAccounts(searchText?: string, pagination?: Insite.Core.WebApi.PaginationModel, sort?: string): ng.IPromise<AccountCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: this.serviceUri, method: "GET", params: this.getAccountsParams(searchText, pagination, sort) }),
                this.getAccountsCompleted,
                this.getAccountsFailed
            );
        }

        protected getAccountsParams(searchText?: string, pagination?: Insite.Core.WebApi.PaginationModel, sort?: string): any {
            const params = {
                searchText: searchText,
                sort: sort
            } as any;

            if (this.expand) {
                params.expand = this.expand;
            }

            if (pagination) {
                params.page = pagination.page;
                params.pageSize = pagination.pageSize;
            }

            return params;
        }

        protected getAccountsCompleted(response: ng.IHttpPromiseCallbackArg<AccountCollectionModel>): void {
        }

        protected getAccountsFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getAccount(accountId?: System.Guid): ng.IPromise<AccountModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: `${this.serviceUri}/${!accountId ? "current" : accountId}`, method: "GET", params: this.getAccountParams() }),
                this.getAccountCompleted,
                this.getAccountFailed
            );
        }

        protected getAccountParams(): any {
            return this.expand ? { expand: this.expand } : {};
        }

        protected getAccountCompleted(response: ng.IHttpPromiseCallbackArg<AccountModel>): void {
        }

        protected getAccountFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        getExternalProviders(): ng.IPromise<ExternalProviderLinkCollectionModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ url: `/identity/externalproviders${this.$window.location.search}`, method: "GET" }),
                this.getExternalProvidersCompleted,
                this.getExternalProvidersFailed
            );
        }

        protected getExternalProvidersCompleted(response: ng.IHttpPromiseCallbackArg<ExternalProviderLinkCollectionModel>): void {
        }

        protected getExternalProvidersFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        createAccount(account: AccountModel): ng.IPromise<AccountModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http.post(this.serviceUri, account),
                this.createAccountCompleted,
                this.createAccountFailed
            );
        }

        protected createAccountCompleted(response: ng.IHttpPromiseCallbackArg<AccountModel>): void {
        }

        protected createAccountFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }

        updateAccount(account: AccountModel, accountId?: System.Guid): ng.IPromise<AccountModel> {
            return this.httpWrapperService.executeHttpRequest(
                this,
                this.$http({ method: "PATCH", url: `${this.serviceUri}/${!accountId ? "current" : accountId}`, data: account }),
                this.updateAccountCompleted,
                this.updateAccountFailed
            );
        }

        protected updateAccountCompleted(response: ng.IHttpPromiseCallbackArg<AccountModel>): void {
        }

        protected updateAccountFailed(error: ng.IHttpPromiseCallbackArg<any>): void {
        }
    }

    angular
        .module("insite")
        .service("accountService", AccountService);
}