class NotFoundError extends Error {
  statusCode = 404;
  message = "Not Found";

  constructor(errors) {
    super();
    this.errors = errors;

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeErrors() {
    return {
      errors: [
        {
          message: this.message,
        },
      ],
    };
  }
}

module.exports = NotFoundError;
