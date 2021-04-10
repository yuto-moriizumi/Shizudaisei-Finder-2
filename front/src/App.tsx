import React, { lazy, Suspense } from 'react';
import { Link, Route } from 'react-router-dom';
import { Nav, Navbar, Image } from 'react-bootstrap';
import { Auth0ContextInterface, withAuth0 } from '@auth0/auth0-react';
import ProtectedRoute from './components/ProtectedRoute';

const Index = lazy(() => import('./views/Index'));
const Search = lazy(() => import('./views/Search'));
const LoginButton = lazy(() => import('./components/LoginButton'));
const LogoutButton = lazy(() => import('./components/LogoutButton'));
const ResTypo = lazy(() => import('./components/ResTypo'));

type Props = {
  auth0: Auth0ContextInterface;
};

class App extends React.Component<Props, {}> {
  render() {
    const { auth0 } = this.props;
    const { isLoading, isAuthenticated, user } = auth0;
    if (isLoading) return <h1>LOADING</h1>;
    return (
      <Suspense fallback={<h1>LOADING</h1>}>
        <Navbar bg="light" expand="sm">
          <Navbar.Brand>
            <Link to="/">
              <ResTypo as="span" classes={['h3', 'h2', 'h2', 'h2', 'h2']}>
                Shizudaisei Finder 2
              </ResTypo>
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
      </Suspense>
    );
  }
}

export default withAuth0(App);
//
