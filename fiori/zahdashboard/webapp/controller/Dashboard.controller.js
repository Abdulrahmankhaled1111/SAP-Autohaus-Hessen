sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("de.autohaushessen.zahdashboard.controller.Dashboard", {

        onInit: function () {
            var oDashModel = new JSONModel({
                bestandAnzahl: 0,
                reserviertAnzahl: 0,
                umsatzMonat: 0,
                offeneRechnungen: 0
            });
            this.setModel(oDashModel, "dashboard");

            var oAppModel = new JSONModel({
                date: new Date().toLocaleDateString("de-DE", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric"
                })
            });
            this.setModel(oAppModel, "app");

            this._loadKPIs();
        },

        _loadKPIs: function () {
            var oModel = this.getView().getModel();
            var oDash = this.getModel("dashboard");

            oModel.bindList("/Bestand", null, null, null, { $count: true })
                .requestContexts(0, 1)
                .then(function (aContexts) {
                    var oBinding = oModel.bindList("/Bestand", null, null,
                        [new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "BESTAND")]);
                    oBinding.requestContexts(0, 100).then(function (aCtx) {
                        oDash.setProperty("/bestandAnzahl", aCtx.length);
                    });
                });

            oModel.bindList("/Bestand", null, null,
                [new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "RESV")])
                .requestContexts(0, 100).then(function (aCtx) {
                    oDash.setProperty("/reserviertAnzahl", aCtx.length);
                });

            oModel.bindList("/Rechnung", null, null,
                [new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "OFFEN"),
                        new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.EQ, "TEIL")
                    ],
                    and: false
                })])
                .requestContexts(0, 100).then(function (aCtx) {
                    oDash.setProperty("/offeneRechnungen", aCtx.length);
                });
        },

        onRefresh: function () {
            this._loadKPIs();
            this.byId("verkaufTable").getBinding("items").refresh();
        },

        _navToApp: function (sSemanticObject, sAction) {
            if (sap.ushell && sap.ushell.Container) {
                sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(function (oNav) {
                    oNav.toExternal({ target: { semanticObject: sSemanticObject, action: sAction } });
                });
            } else {
                sap.m.MessageToast.show("Navigation zu: " + sSemanticObject + "-" + sAction);
            }
        },

        onNavFahrzeug: function () { this._navToApp("ZAHFahrzeug", "display"); },
        onNavKunde: function () { this._navToApp("ZAHKunde", "display"); },
        onNavVerkauf: function () { this._navToApp("ZAHVerkauf", "display"); },
        onNavigateBestand: function () { this._navToApp("ZAHFahrzeug", "display"); },
        onNavigateUmsatz: function () { this._navToApp("ZAHUmsatz", "display"); },
        onNavRechnung: function () { this._navToApp("ZAHRechnung", "display"); }
    });
});
