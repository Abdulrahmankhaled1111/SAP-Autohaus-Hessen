sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("de.autohaushessen.zahverkauf.controller.VerkaufWizard", {

        onKundeSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oBinding = this.byId("kundeSelectTable").getBinding("items");
            if (sQuery) {
                oBinding.filter([new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("Nachname", sap.ui.model.FilterOperator.Contains, sQuery),
                        new sap.ui.model.Filter("Vorname", sap.ui.model.FilterOperator.Contains, sQuery)
                    ],
                    and: false
                })]);
            } else {
                oBinding.filter([]);
            }
        },

        onKundeSelected: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            if (oItem) {
                var oCtx = oItem.getBindingContext();
                this.getModel("wizard").setProperty("/kunde", {
                    id: oCtx.getProperty("KundeId"),
                    name: oCtx.getProperty("Vorname") + " " + oCtx.getProperty("Nachname")
                });
            }
        },

        onKundeValidated: function () {
            return this.getModel("wizard").getProperty("/kunde") !== null;
        },

        onFahrzeugSelected: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            if (oItem) {
                var oCtx = oItem.getBindingContext();
                this.getModel("wizard").setProperty("/fahrzeug", {
                    id: oCtx.getProperty("FahrzeugId"),
                    fin: oCtx.getProperty("Fin"),
                    bezeichnung: oCtx.getProperty("Modell"),
                    preis: oCtx.getProperty("Verkaufspreis")
                });
            }
        },

        onFahrzeugValidated: function () {
            return this.getModel("wizard").getProperty("/fahrzeug") !== null;
        },

        onCreateAuftrag: function () {
            var oWizard = this.getModel("wizard").getData();
            var oModel = this.getView().getModel();

            MessageBox.confirm(
                "Auftrag für " + oWizard.kunde.name + " erstellen?\nFahrzeug wird reserviert.",
                {
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            var oList = oModel.bindList("/Auftrag", null, null, null, { $$updateGroupId: "verkaufGroup" });
                            oList.create({
                                KundeId: oWizard.kunde.id,
                                Auftragsdatum: new Date().toISOString().split("T")[0],
                                Status: "OFFEN",
                                Brutto: oWizard.fahrzeug.preis,
                                Netto: (oWizard.fahrzeug.preis / 1.19).toFixed(2),
                                Mwst: (oWizard.fahrzeug.preis - oWizard.fahrzeug.preis / 1.19).toFixed(2),
                                Anzahlung: oWizard.anzahlung || 0,
                                Bemerkung: oWizard.bemerkung || ""
                            }).created().then(function () {
                                oModel.submitBatch("verkaufGroup").then(function () {
                                    MessageToast.show("Auftrag erstellt! Fahrzeug reserviert.");
                                });
                            });
                        }
                    }
                }
            );
        },

        onWizardComplete: function () {
            this.onCreateAuftrag();
        }
    });
});
