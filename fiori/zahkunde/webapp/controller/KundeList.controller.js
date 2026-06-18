sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (Controller, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("de.autohaushessen.zahkunde.controller.KundeList", {

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oBinding = this.byId("kundeTable").getBinding("items");
            if (sQuery) {
                oBinding.filter(new Filter({
                    filters: [
                        new Filter("Nachname", FilterOperator.Contains, sQuery),
                        new Filter("Vorname", FilterOperator.Contains, sQuery),
                        new Filter("Ort", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            } else {
                oBinding.filter([]);
            }
        },

        onCreate: function () {
            if (!this._oCreateDialog) {
                this._oCreateDialog = sap.ui.xmlfragment(
                    "de.autohaushessen.zahkunde.view.CreateKundeDialog",
                    this
                );
                this.getView().addDependent(this._oCreateDialog);
            }
            this._oCreateDialog.open();
        },

        onSaveKunde: function () {
            var oModel = this.getView().getModel();
            var oCtx = oModel.bindList("/Kunde", null, null, null, { $$updateGroupId: "createGroup" });
            var oData = sap.ui.getCore().byId("createKundeForm").getModel().getData();

            oCtx.create(oData).created().then(function () {
                oModel.submitBatch("createGroup").then(function () {
                    MessageToast.show("Kunde angelegt");
                    this._oCreateDialog.close();
                    this.byId("kundeTable").getBinding("items").refresh();
                }.bind(this));
            }.bind(this));
        },

        onCancelCreate: function () {
            this._oCreateDialog.close();
        },

        onItemPress: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext();
            MessageToast.show("Kunde: " + oCtx.getProperty("Nachname"));
        }
    });
});
