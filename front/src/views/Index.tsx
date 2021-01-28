import React from "react";
import {
  Button,
  Card,
  CardDeck,
  Col,
  Container,
  Jumbotron,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";

export type User = {
  id: string;
  name: string;
  screen_name: string;
  img_url: string;
  content: string;
  created_at: string;
  is_following: boolean;
};
interface State {
  users: User[];
}

const SERVER_URL = process.env.REACT_APP_SERVER_URL;
if (!SERVER_URL) new Error("SERVER_URL must be specified");

export default class Index extends React.Component<{}, State> {
  state = { users: new Array<User>() };

  componentWillMount() {
    axios
      .get(`${SERVER_URL}/users`)
      .then((res) => {
        this.setState({ users: res.data });
      })
      .catch((err) => console.log(err));
  }

  render() {
    return (
      <React.Fragment>
        <Jumbotron>
          <Container>
            <h1>仲間を、見つけよう！</h1>
            <p>
              Shizudaisei Finder
              2は、静大生のTwitterユーザを簡単に見つけられるWEBアプリです
            </p>
            <Link to="search">
              <Button>検索する</Button>
            </Link>
          </Container>
        </Jumbotron>
        <Container fluid className="px-5">
          <CardDeck className="no-gutters">
            {this.state.users.map((user: User) => (
              <Col key={user.id} xs={12} sm={6} md={4} lg={3} xl={2}>
                <Card>
                  {/* <Card.Link href={page.url} target="_blank" rel="noreferrer">
                    <Card.Img
                      variant="top"
                      src={page.img}
                      referrerPolicy="no-referrer"
                    />
                    <Card.Body className="px-3 py-2">
                      <Card.Title className="mb-1">{page.title}</Card.Title>
                    </Card.Body>
                  </Card.Link>
                  <Card.Subtitle className="px-3 pb-2">
                    {page.name}
                  </Card.Subtitle>
                  <Card.Footer>
                    {dayjs(page.updated).format("YYYY/MM/DD")}
                  </Card.Footer> */}
                </Card>
              </Col>
            ))}
          </CardDeck>
        </Container>
      </React.Fragment>
    );
  }
}
