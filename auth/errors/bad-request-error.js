class BadRequestError extends Error {
  statusCode = 400;
  message = "Not Found";

  constructor(message) {
    super(message);
    this.message = message;

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, BadRequestError.prototype);
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

module.exports = BadRequestError;
