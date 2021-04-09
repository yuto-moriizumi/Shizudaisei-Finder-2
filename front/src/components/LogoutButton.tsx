import React from 'react';
import { Auth0ContextInterface, withAuth0 } from '@auth0/auth0-react';
import { Button } from 'react-bootstrap';

type Props = {
  auth0: Auth0ContextInterface;
};
class LogoutButton extends React.Component<Props, {}> {
  render() {
    const { auth0 } = this.props;
    return (
      <Button
        block
        variant="danger"
        onClick={() =>
          auth0.logout({
            returnTo: window.location.origin,
          })
        }
      >
        ログアウト
      </Button>
    );
  }
}

export default withAuth0(LogoutButton);
