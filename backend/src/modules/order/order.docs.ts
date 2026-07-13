export const orderDocs = {
  paths: {
    "/orders/quote": {
      post: {
        summary: "Get Order Price Quote",
        description: "Calculates the price for a potential order without creating it.",
        tags: ["Orders", "Pricing"],
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
            description: "Price quote",
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
        },
      },
    },
    "/orders": {
      get: {
        summary: "List Orders",
        description: "Fetch a paginated list of orders.",
        tags: ["Orders", "Admin", "Agent"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "status", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Paginated orders list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        orders: { type: "array", items: { type: "object" } },
                        total: { type: "integer" },
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        totalPages: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create Order",
        description: "Creates a new delivery order. (Triggers Order Created Notification)",
        tags: ["Orders"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  pickupAreaId: { type: "string", format: "uuid" },
                  dropAreaId: { type: "string", format: "uuid" },
                  pickupAddress: { type: "string" },
                  pickupContact: { type: "string" },
                  dropAddress: { type: "string" },
                  dropContact: { type: "string" },
                  length: { type: "number" },
                  width: { type: "number" },
                  height: { type: "number" },
                  actualWeight: { type: "number" },
                  orderType: { type: "string" },
                  paymentType: { type: "string" },
                  description: { type: "string" },
                  specialInstructions: { type: "string" },
                },
                required: ["pickupAreaId", "dropAreaId", "pickupAddress", "pickupContact", "dropAddress", "dropContact", "actualWeight", "orderType", "paymentType"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Order created successfully" },
        },
      },
    },
    "/orders/{id}": {
      get: {
        summary: "Get Order Details",
        description: "Fetch complete details for a single order, including tracking and assignments.",
        tags: ["Orders"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": { description: "Order details" },
          "404": { description: "Order not found" },
        },
      },
    },
    "/orders/{id}/reschedule": {
      post: {
        summary: "Reschedule Failed Order",
        description: "Allows a customer to reschedule a FAILED delivery to a future date. (Triggers Notification)",
        tags: ["Orders"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  requestedDate: { type: "string", format: "date-time" },
                },
                required: ["requestedDate"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Successfully rescheduled" },
          "400": { description: "Order is not in FAILED status" },
          "403": { description: "Forbidden" },
        },
      },
    },
  },
  components: {
    schemas: {},
  },
};
