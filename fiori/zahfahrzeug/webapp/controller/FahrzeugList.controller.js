sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("de.autohaushessen.zahfahrzeug.controller.FahrzeugList", {

        onInit: function () {
            var oUIModel = new sap.ui.model.json.JSONModel({ selectedStatus: "", selectedKey: null });
            this.getView().setModel(oUIModel, "ui");
        },

        onStatusFilter: function (oEvent) {
            var sKey = oEvent.getParameter("key");
            var oTable = this.byId("fahrzeugTable");
            var oBinding = oTable.getBinding("items");

            if (sKey === "ALL") {
                oBinding.filter([]);
            } else {
                oBinding.filter([new Filter("Status", FilterOperator.EQ, sKey)]);
            }
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("fahrzeugTable");
            var oBinding = oTable.getBinding("items");
            var aFilters = [];

            if (sQuery) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("Modell", FilterOperator.Contains, sQuery),
                        new Filter("Fin", FilterOperator.Contains, sQuery),
                        new Filter("Farbe", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }
            oBinding.filter(aFilters);
        },

        onRefresh: function () {
            this.byId("fahrzeugTable").getBinding("items").refresh();
            MessageToast.show("Aktualisiert");
        },

        onItemPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem") || oEvent.getSource().getSelectedItem();
            var oCtx = oItem.getBindingContext();
            this.getView().getModel("ui").setProperty("/selectedStatus", oCtx.getProperty("Status"));
            this.getView().getModel("ui").setProperty("/selectedKey", {
                FahrzeugId: oCtx.getProperty("FahrzeugId"),
                Fin: oCtx.getProperty("Fin")
            });
            this.getRouter().navTo("fahrzeugDetail", {
                FahrzeugId: oCtx.getProperty("FahrzeugId"),
                Fin: oCtx.getProperty("Fin")
            });
        },

        _getSelectedContext: function () {
            var oTable = this.byId("fahrzeugTable");
            var oItem = oTable.getSelectedItem();
            if (!oItem) {
                MessageToast.show("Bitte Fahrzeug auswählen");
                return null;
            }
            return oItem.getBindingContext();
        },

        onReservieren: function () {
            var oCtx = this._getSelectedContext();
            if (!oCtx) return;

            var oModel = this.getView().getModel();
            var oBinding = oModel.bindContext("/Fahrzeug(" +
                "FahrzeugId='" + oCtx.getProperty("FahrzeugId") + "'," +
                "Fin='" + oCtx.getProperty("Fin") + "'" +
                ")/com.sap.gateway.srvd.zui_ah_automotive.v0001.reservieren(...)");

            oBinding.execute().then(function () {
                MessageToast.show(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgReserviert"));
                this.onRefresh();
            }.bind(this)).catch(function (oError) {
                MessageBox.error(oError.message);
            });
        },

        onFreigeben: function () {
            var oCtx = this._getSelectedContext();
            if (!oCtx) return;

            var oModel = this.getView().getModel();
            var oBinding = oModel.bindContext("/Fahrzeug(" +
                "FahrzeugId='" + oCtx.getProperty("FahrzeugId") + "'," +
                "Fin='" + oCtx.getProperty("Fin") + "'" +
                ")/com.sap.gateway.srvd.zui_ah_automotive.v0001.freigeben(...)");

            oBinding.execute().then(function () {
                MessageToast.show(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgFreigegeben"));
                this.onRefresh();
            }.bind(this));
        },

        onAusliefern: function () {
            var oCtx = this._getSelectedContext();
            if (!oCtx) return;

            MessageBox.confirm("Fahrzeug wirklich ausliefern?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        var oModel = this.getView().getModel();
                        var oBinding = oModel.bindContext("/Fahrzeug(" +
                            "FahrzeugId='" + oCtx.getProperty("FahrzeugId") + "'," +
                            "Fin='" + oCtx.getProperty("Fin") + "'" +
                            ")/com.sap.gateway.srvd.zui_ah_automotive.v0001.ausliefern(...)");
                        oBinding.execute().then(function () {
                            MessageToast.show(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("msgAusgeliefert"));
                            this.onRefresh();
                        }.bind(this));
                    }
                }.bind(this)
            });
        },

        onCreate: function () {
            MessageToast.show("Neues Fahrzeug anlegen – Dialog öffnen");
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        }
    });
});
