import React from "react";
import { useHistory } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";

const Auth0ProviderWithHistory = ({ children }) => {
  const DOMAIN = process.env.REACT_APP_AUTH0_DOMAIN;
  const CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID;
  const AUDIENCE = process.env.REACT_APP_AUTH0_AUDIENCE;

  const history = useHistory();

  const onRedirectCallback = (appState) => {
    history.push(appState?.returnTo || window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={DOMAIN}
      clientId={CLIENT_ID}
      audience={AUDIENCE}
      // audience={`https://${DOMAIN}/api/v2/`}
      redirectUri={window.location.origin}
      onRedirectCallback={onRedirectCallback}
      // scope="read:current_user update:current_user_metadata"
    >
      {children}
    </Auth0Provider>
  );
};

export default Auth0ProviderWithHistory;
