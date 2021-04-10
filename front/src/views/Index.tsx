import React from 'react';
import { Button, CardDeck, Container, Jumbotron } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import User from '../utils/User.d';
import UserCard from '../components/UserCard/UserCard';
import getResponsiveElements from '../utils/getResponsiveElements';

interface State {
  users: User[];
  isLoading: boolean;
}

const SERVER_URL = process.env.REACT_APP_SERVER_URL;
if (!SERVER_URL) console.error('SERVER_URL must be specified');

export default class Index extends React.Component<{}, State> {
  private next = '';

  constructor(props: any) {
    super(props);
    this.state = { users: [], isLoading: false };
  }

  private handleScrollBinded = this.handleScroll.bind(this);

  componentDidMount() {
    this.getUsers(0);
    window.addEventListener('scroll', this.handleScrollBinded);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScrollBinded);
  }

  private handleScroll() {
    const LOADING_HEIGHT_RATE = 0.8;
    const { isLoading, users } = this.state;
    if (
      Math.ceil(window.innerHeight + document.documentElement.scrollTop) <
        document.documentElement.offsetHeight * LOADING_HEIGHT_RATE ||
      isLoading // ロード中はapiを呼ばない
    )
      return;
    this.getUsers(users.length);
  }

  private getUsers(offset: number) {
    this.setState({ isLoading: true });
    const { users } = this.state;
    axios
      .get(`${SERVER_URL}/users?offset=${offset}`)
      .then((res) => {
        this.setState({ users: users.concat(res.data) });
      })
      .catch((e) => console.log(e))
      .finally(() => this.setState({ isLoading: false }));
  }

  private cron() {
    axios
      .get(
        `${SERVER_URL}/users/update?type=fullarchive${
          this.next === '' ? '' : `&next=${this.next}`
        }`
      )
      .then((res) => {
        this.next = res.data.next;
        this.cron();
      })
      .catch((e) => console.log(e));
  }

  render() {
    const { users } = this.state;
    return (
      <>
        <Jumbotron className="text-center">
          <h1 className="display-1 d-none d-xl-block">仲間を、 見つけよう！</h1>
          <h1 className="display-2 d-none d-lg-block d-xl-none">
            仲間を、 見つけよう！
          </h1>
          <h1 className="display-4 d-none d-md-block d-lg-none">
            仲間を、 見つけよう！
          </h1>
          <h1 className="d-none d-sm-block d-md-none">仲間を、 見つけよう！</h1>
          <h2 className="d-xs-block d-sm-none">仲間を、 見つけよう！</h2>
          <p className="h3 mb-3 d-none d-md-block">
            Shizudaisei Finder
            2は、静大生のTwitterユーザを簡単に見つけられるWEBアプリです
          </p>
          <p className="h4 mb-3 d-none d-sm-block d-md-none">
            Shizudaisei Finder
            2は、静大生のTwitterユーザを簡単に見つけられるWEBアプリです
          </p>
          <p className="h5 mb-3 d-sm-none">
            Shizudaisei Finder
            2は、静大生のTwitterユーザを簡単に見つけられるWEBアプリです
          </p>
          <Link to="search">
            <Button size="lg">検索する</Button>
          </Link>
          {/* <Button
            size="lg"
            onClick={() => {
              this.cron();
            }}
          >
            管理者用:更新
          </Button> */}
        </Jumbotron>
        <Container fluid className="px-4 no-gutters">
          <CardDeck>
            {getResponsiveElements(
              users.map((user) => <UserCard key={user.id} user={user} />)
            )}
          </CardDeck>
        </Container>
      </>
    );
  }
}
