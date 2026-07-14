window.onerror = function (message, source, lineno, colno, error) {
  alert("ERROR: " + message + "\nLine: " + lineno + ":" + colno);
};
import React from "react";
import ReactDOM from "react-dom/client";
import AceBoard from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AceBoard />
  </React.StrictMode>
);
