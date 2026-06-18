sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/v4/ODataModel"
], function (UIComponent, JSONModel, ODataModel) {
    "use strict";

    return UIComponent.extend("de.autohaushessen.zahfahrzeug.Component", {
        metadata: { manifest: "json" },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();

            var oAppModel = new JSONModel({
                company: "Autohaus HESSEN GmbH",
                user: sap.ushell ? sap.ushell.Container.getUser().getId() : "Demo"
            });
            this.setModel(oAppModel, "app");
        }
    });
});
