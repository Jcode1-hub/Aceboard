window.onerror = function (message, source, lineno, colno, error) {
  console.error("ERROR: " + message + "\nLine: " + lineno + ":" + colno);
};
import React from "react";
import ReactDOM from "react-dom/client";
import AceBoard from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ color: "red", padding: 20, fontSize: 12, whiteSpace: "pre-wrap" }}>
          {this.state.error.toString()}
          {"\n\n"}
          {this.state.error.stack}
        </pre>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AceBoard />
    </ErrorBoundary>
  </React.StrictMode>
);
