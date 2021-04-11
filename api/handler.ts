import serverless from 'serverless-http';
import app from './app';

const myhandler = serverless(app);
export default myhandler;
