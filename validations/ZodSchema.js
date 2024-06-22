import * as z from "zod";

export const createCurrentSchema = (schema, data) => {
  let tempScheme = {};
  for (const key in schema) {
    const validationData = schema[key].validations;
    validationData.forEach((element) => {
      const { type, value, message, dependantType, optional } = element;
      if (type === "type") {
        switch (value) {
          case "number":
            tempScheme[key] = z.number({
              required_error: message,
              invalid_type_error: "Must be a number",
            });
            break;

          case "boolean":
            if (optional) {
              tempScheme[key] = z
                .boolean({
                  required_error: message,
                  invalid_type_error: "Must be a boolean",
                })
                .optional();
            } else {
              tempScheme[key] = z.boolean({
                required_error: message,
                invalid_type_error: "Must be a boolean",
              });
            }

            break;

          default:
            tempScheme[key] = z.string({
              required_error: message,
              invalid_type_error: "Must be a string",
            });
            break;
        }
      }

      if (type === "min") {
        tempScheme[key] = tempScheme[key].min(value, message);
      }
      if (type === "max") {
        tempScheme[key] = tempScheme[key].max(value, message);
      }

      if (type === "nonempty" && value === true) {
        tempScheme[key] = tempScheme[key].nonempty(message);
      }

      if (type === "email") {
        tempScheme[key] = tempScheme[key].email(value, message);
      }

      if (type === "function") {
        if (value === "isEmail") {
          tempScheme[key] = tempScheme[key].refine(
            (val) => validationFunction.isEmail(val),
            {
              message: message,
            }
          );
        }
        if (value === "isPhone") {
          tempScheme[key] = tempScheme[key].refine(
            (val) => validationFunction.isPhone(val),
            {
              message: message,
            }
          );
        }
      }

      if (type === "regx") {
        tempScheme[key] = tempScheme[key].refine(
          (val) => validationFunction.isRegx(val, value),
          {
            message: message,
          }
        );
      }

      if (type === "dependant") {
        const currentData = data[key];
        const compareData = data[value];
        const typeOfDependant = dependantType ? dependantType : "equal";
        tempScheme[key] = tempScheme[key].refine(
          () => dependantValidation(typeOfDependant, currentData, compareData),
          {
            message: message,
          }
        );
      }
    });
  }

  return z.object(tempScheme);
};

const dependantValidation = (type, currentData, compareData) => {
  const validation = {
    equal: currentData === compareData,
    ls: currentData < compareData,
    gt: currentData > compareData,
  };

  return validation[type] ? validation[type] : false;
};

export const validationFunction = {
  isEmail: (email) => {
    console.log(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  isPhone: (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  },
  isRegx: (value, customRegex) => {
    const emailRegex = customRegex;
    return emailRegex.test(value);
  },
};

export function validateOrder(key, obj) {
  const expectedOrder = [
    "type",
    "nonempty",
    "min",
    "max",
    "dependant",
    "regx",
    "function",
  ];

  const checkOrders = {};
  for (const key in obj) {
    const currentOrder = obj[key].map((item) => item.type);

    for (let i = 0; i < currentOrder.length; i++) {
      if (currentOrder[i] !== expectedOrder[i]) {
        checkOrders[key] =
          `Please Follow order (type>,nonempty, min, max, dependant, regx, function)`;
        break;
      }
    }
  }

  try {
    if (Object.keys(checkOrders).length !== 0) {
      throw new Error("validation order error");
    }
  } catch (error) {
    if (error) {
      console.error({ [key]: checkOrders });
    }
  }
}

export const getErrors = (errors) => {
  const message = {};

  const customSort = (a, b) => {
    const order = {
      custom: 0,
      too_big: 1,
      too_small: 2,
    };

    if (order[a.code] < order[b.code]) return -1;
    if (order[a.code] > order[b.code]) return 1;

    // If codes are the same, sort by maximum value for 'too_small'
    if (a.code === "too_small") {
      return (b.minimum || 0) - (a.minimum || 0);
    }

    return 0;
  };

  // Move items based on custom sorting logic
  const errorData = errors.sort(customSort);

  errorData.map((issue) => {
    const key = issue.path[0] ? issue.path[0] : "details";
    message[key] = issue.message;
  });
  console.log(message);
  return message;
};
