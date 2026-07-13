export const trackingDocs = {
  paths: {
    "/tracking/{orderId}": {
      get: {
        summary: "Get Tracking Timeline",
        description: "Fetches the full tracking history and current status for an order.",
        tags: ["Tracking"],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          "200": {
            description: "Tracking timeline",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        orderId: { type: "string" },
                        orderNumber: { type: "string" },
                        currentStatus: { type: "string" },
                        events: { type: "array", items: { type: "object" } },
                      },
                    },
                  },
                },
              },
            },
          },
          "404": { description: "Order not found" },
        },
      },
    },
    "/tracking/{orderId}/status": {
      patch: {
        summary: "Update Order Status",
        description: "Advances the order to the next valid status (e.g. PICKED_UP -> IN_TRANSIT). Agent only. (Triggers Notifications on specific states)",
        tags: ["Tracking", "Agent"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "orderId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string" },
                  description: { type: "string" },
                  latitude: { type: "number" },
                  longitude: { type: "number" },
                },
                required: ["status"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Status updated successfully" },
          "400": { description: "Invalid status transition" },
          "403": { description: "Agent not assigned to this order" },
          "404": { description: "Order not found" },
        },
      },
    },
  },
  components: {
    schemas: {},
  },
};
