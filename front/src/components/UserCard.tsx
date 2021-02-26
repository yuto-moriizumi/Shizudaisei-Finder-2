import React from "react";
import { Card, Col, Row, Image, Button, Spinner } from "react-bootstrap";
import User from "../utils/User";
import dayjs from "dayjs";

type Props = {
  user: User;
  onFollow?: () => void;
};
export default class UserCard extends React.Component<Props, {}> {
  render() {
    const user = this.props.user;
    return (
      <Card key={user.id} className="mx-0 mb-4">
        <Card.Header>
          <Row>
            <Col className="pl-0" xs="auto">
              <Image src={user.img_url} thumbnail style={{ maxHeight: "48px" }} />
            </Col>
            <Col className="px-0" xs="auto">
              <Card.Link href={"https://twitter.com/" + user.screen_name} target="_blank">
                <p className="mb-0">{user.name}</p>
                <small>@{user.screen_name}</small>
              </Card.Link>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>{user.content}</Card.Body>
        <Card.Footer>
          <Row>
            <Col xs="auto" className="px-0">
              {dayjs(user.created_at).format("YYYY-MM-DD")}
            </Col>
            {this.props.onFollow ? (
              <Col xs="auto" className="px-0 ml-auto">
                {user.is_requesting ? ( //フォローリクエスト送信中であれば
                  <Button size="sm" disabled>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  </Button>
                ) : user.is_following ? (
                  <Button size="sm" disabled>
                    フォロー済
                  </Button>
                ) : (
                  <Button size="sm" onClick={this.props.onFollow.bind(this)}>
                    フォロー
                  </Button>
                )}
              </Col>
            ) : (
              "Error"
            )}
          </Row>
        </Card.Footer>
      </Card>
    );
  }
}
