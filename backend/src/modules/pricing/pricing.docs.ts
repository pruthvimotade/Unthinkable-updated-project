export const pricingDocs = {
  paths: {
    "/pricing/calculate": {
      post: {
        summary: "Calculate Delivery Price",
        description: "Calculates the base price and COD surcharge for a given delivery.",
        tags: ["Pricing"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  pickupAreaId: { type: "string", format: "uuid" },
                  dropAreaId: { type: "string", format: "uuid" },
                  length: { type: "number" },
                  width: { type: "number" },
                  height: { type: "number" },
                  actualWeight: { type: "number" },
                  orderType: { type: "string" },
                  paymentType: { type: "string" },
                },
                required: ["pickupAreaId", "dropAreaId", "actualWeight", "orderType", "paymentType"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Price calculation successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        pickupZone: { type: "string" },
                        dropZone: { type: "string" },
                        zoneType: { type: "string" },
                        actualWeight: { type: "number" },
                        volumetricWeight: { type: "number" },
                        billableWeight: { type: "number" },
                        basePrice: { type: "number" },
                        codSurcharge: { type: "number" },
                        finalPrice: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid input or No rate card found" },
        },
      },
    },
  },
  components: {
    schemas: {},
  },
};
