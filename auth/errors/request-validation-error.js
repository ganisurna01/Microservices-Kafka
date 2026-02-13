class RequestValidationError extends Error {
  statusCode = 400;

  constructor(errors) {
    super(errors);
    this.errors = errors;

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }

  serializeErrors() {
    return {
      errors: this.errors.map((error) => {
        if (error.type === "field") {
          return { field: error.path, message: error.msg };
        }
        return { message: error.msg };
      }),
    };
  }
}

module.exports = RequestValidationError;
