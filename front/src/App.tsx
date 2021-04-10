import React from 'react';
import { Link, Route } from 'react-router-dom';
import { Nav, Navbar, Image } from 'react-bootstrap';
import { Auth0ContextInterface, withAuth0 } from '@auth0/auth0-react';
import Index from './views/Index';
import Search from './views/Search';
import ProtectedRoute from './components/ProtectedRoute';
import LoginButton from './components/LoginButton';
import LogoutButton from './components/LogoutButton';

type Props = {
  auth0: Auth0ContextInterface;
};

class App extends React.Component<Props, {}> {
  render() {
    const { auth0 } = this.props;
    const { isLoading, isAuthenticated, user } = auth0;
    if (isLoading) return <h1>LOADING</h1>;
    return (
      <>
        <Navbar bg="light" expand="sm">
          <Navbar.Brand>
            <Link to="/">
              <span className="d-none h2 d-md-block">Shizudaisei Finder 2</span>
              <span className="d-md-none h3">Shizudaisei Finder 2</span>
            </Link>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ml-auto">
              {isAuthenticated ? (
                <>
                  <Nav.Item>
                    <Image
                      src={user.picture}
                      thumbnail
                      className="img-fluid"
                      style={{ maxHeight: '5vh' }}
                    />
                  </Nav.Item>
                  <Nav.Item className="pt-2 mx-2">{user.nickname}</Nav.Item>
                  <Nav.Item>
                    <LogoutButton />
                  </Nav.Item>
                </>
              ) : (
                <Nav.Item>
                  <LoginButton />
                </Nav.Item>
              )}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <Route exact path="/" component={Index} />
        <ProtectedRoute path="/search" component={Search} />
      </>
    );
  }
}

export default withAuth0(App);
//
