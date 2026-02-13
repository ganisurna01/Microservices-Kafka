import React from "react";

function layout({ children }) {
  return (
    <>
      <h1>Logged In Header</h1>
      {children}
    </>
  );
}

export default layout;
