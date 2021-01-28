import React from "react";
import { Route } from "react-router-dom";
import { withAuthenticationRequired } from "@auth0/auth0-react";

// type Props = {
//   component: React.Component<any>;
// };
// class ProtectedRoute extends React.Component<Props, {}> {
//   render() {
//     const { component, ...args } = this.props;
//     return (
//       <Route
//         component={withAuthenticationRequired(component, {
//           onRedirecting: () => <h1>Loading...</h1>,
//         })}
//         {...args}
//       />
//     );
//   }
// }

const ProtectedRoute = ({ component, ...args }) => (
  <Route
    component={withAuthenticationRequired(component, {
      onRedirecting: () => <h1>Loading...</h1>,
    })}
    {...args}
  />
);

export default ProtectedRoute;
