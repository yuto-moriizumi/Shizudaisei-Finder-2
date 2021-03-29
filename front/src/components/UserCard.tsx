import React from 'react';
import {
  Card,
  Col,
  Row,
  Image,
  Button,
  Spinner,
  Container,
} from 'react-bootstrap';
import User from '../utils/User';
import dayjs from 'dayjs';
import { ButtonVariant } from 'react-bootstrap/esm/types';

type Props = {
  user: User;
  onFollow?: () => void;
};
abstract class ButtonState {
  abstract display: JSX.Element;
  abstract variant: ButtonVariant;
  abstract disabled: boolean;
}
class BeforeFollowState implements ButtonState {
  display = (<>フォロー</>);
  variant = 'primary';
  disabled = false;
}
class FollowingState implements ButtonState {
  display = (
    <Spinner
      as="span"
      animation="border"
      size="sm"
      role="status"
      aria-hidden="true"
    />
  );
  variant = 'primary';
  disabled = true;
}
class FollowedState implements ButtonState {
  display = (<>フォロー済</>);
  variant = 'primary';
  disabled = true;
}
class FollowFailedState implements ButtonState {
  display = (<>フォロー失敗</>);
  variant = 'danger';
  disabled = true;
}

export default class UserCard extends React.Component<Props, {}> {
  render() {
    const user = this.props.user;

    //フォロー試行状態を判別する
    let buttonState: ButtonState;
    if (user.is_requesting) buttonState = new FollowingState();
    else if (user.follow_failed) buttonState = new FollowFailedState();
    else if (user.is_following) buttonState = new FollowedState();
    else buttonState = new BeforeFollowState();

    return (
      <Card key={user.id} className="mb-4">
        <Card.Header className="p-2">
          <Container fluid>
            <Row>
              <Col className="px-0" xs="2">
                <Image fluid src={user.img_url} style={{ maxHeight: '48px' }} />
              </Col>
              <Col className="pl-1 pr-0" xs="10">
                <Card.Link
                  href={'https://twitter.com/' + user.screen_name}
                  target="_blank"
                >
                  <h6 className="mb-0">{user.name}</h6>
                  <small>@{user.screen_name}</small>
                </Card.Link>
              </Col>
            </Row>
          </Container>
        </Card.Header>
        <Card.Body className="p-3">{user.content}</Card.Body>
        <Card.Footer>
          <Row className="px-2">
            <Col xs="auto" className="px-0">
              {dayjs(user.created_at).format('YYYY-MM-DD')}
            </Col>
            {this.props.onFollow ? (
              <Col xs="auto" className="px-0 ml-auto">
                <Button
                  size="sm"
                  variant={buttonState.variant}
                  disabled={buttonState.disabled}
                  onClick={
                    buttonState.disabled
                      ? undefined
                      : this.props.onFollow.bind(this)
                  }
                >
                  {buttonState.display}
                </Button>
              </Col>
            ) : (
              ''
            )}
          </Row>
        </Card.Footer>
      </Card>
    );
  }
}
