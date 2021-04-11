import React, { lazy, Suspense } from 'react';
import { Button, CardDeck, Container, Jumbotron } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import User from '../utils/User.d';
import getResponsiveElements from '../utils/getResponsiveElements';

const ResTypo = lazy(() => import('../components/ResTypo'));
const UserCard = lazy(() => import('../components/UserCard/UserCard'));
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
        <Helmet>
          <title>静大生発見機 2 トップ</title>
          <meta
            name="description"
            content="静大生のTwitterユーザを簡単に見つけてフォローできるWEBアプリ。Twitterでログインして、友達をいっぱい作ろう！"
          />
        </Helmet>
        <Jumbotron className="text-center">
          <ResTypo
            classes={['h3', 'h1', 'display-4', 'display-2', 'display-1']}
          >
            仲間を、 見つけよう！
          </ResTypo>
          <ResTypo as="p" classes={['h6', 'h5', 'h4', 'h3', 'h2']}>
            Shizudaisei Finder
            2は、静大生のTwitterユーザを簡単に見つけられるWEBアプリです
          </ResTypo>
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
          <p className="mt-3">
            ©2021 森泉友登
            <address>
              <a href="https://twitter.com/YutoMoriizumi" className="mr-3">
                Twitter
              </a>
              <a href="https://github.com/yuto-moriizumi/Shizudaisei-Finder-2">
                Github
              </a>
            </address>
          </p>
        </Jumbotron>
        <Container fluid className="px-4 no-gutters">
          <CardDeck>
            <Suspense fallback={<h1>LOADING</h1>}>
              {getResponsiveElements(
                users.map((user) => <UserCard key={user.id} user={user} />)
              )}
            </Suspense>
          </CardDeck>
        </Container>
      </>
    );
  }
}
