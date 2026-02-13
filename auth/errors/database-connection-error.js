class DatabaseConnectionError extends Error {
  statusCode = 500;
  message = "Error connection to database";

  constructor() {
    super();

    // Only because we are extending a built in class
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
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

module.exports = DatabaseConnectionError;
