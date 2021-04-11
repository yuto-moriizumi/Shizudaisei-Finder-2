import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import Auth0ProviderWithHistory from './components/Auth0ProviderWithHistory';
// import enableMock from './utils/mockApi';

// enableMock();
render(
  <React.StrictMode>
    <Router>
      <Auth0ProviderWithHistory>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </Auth0ProviderWithHistory>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
