sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("de.autohaushessen.zahfahrzeug.controller.FahrzeugDetail", {

        onInit: function () {
            this.getRouter().getRoute("fahrzeugDetail").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            var sFahrzeugId = oEvent.getParameter("arguments").FahrzeugId;
            var sFin = oEvent.getParameter("arguments").Fin;
            var sPath = "/Fahrzeug(FahrzeugId='" + sFahrzeugId + "',Fin='" + sFin + "')";

            this.getView().bindElement({
                path: sPath,
                parameters: { $expand: "_Marke" }
            });
        },

        formatMarge: function (fVerkauf, fEinkauf) {
            if (!fVerkauf || !fEinkauf) return "0";
            return (parseFloat(fVerkauf) - parseFloat(fEinkauf)).toFixed(2);
        },

        onNavBack: function () {
            this.getRouter().navTo("fahrzeugList");
        },

        onReservieren: function () {
            MessageToast.show("Reservierung...");
        },

        onAusliefern: function () {
            MessageToast.show("Auslieferung...");
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        }
    });
});
