import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Triumphs from "./views/Triumphs";

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/">
          <Triumphs />
        </Route>
      </Switch>
    </Router>
  );
};

export default App;
