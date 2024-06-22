import { createCurrentSchema, getErrors } from "./ZodSchema.js";

export const schemaValidation = ({ schema, payload }) => {
  try {
    console.log({ schema });
    const currentSchema = createCurrentSchema(schema, payload);
    currentSchema.parse(payload);
    return { status: "success", data: payload };
  } catch (error) {
    console.log({ error });
    const message = getErrors(error.issues);
    return { status: "error", data: message };
  }
};
