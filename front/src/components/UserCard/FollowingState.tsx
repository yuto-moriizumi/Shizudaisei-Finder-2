import React from 'react';
import { Spinner } from 'react-bootstrap';
import ButtonState from "./ButtonState";

export default class FollowingState implements ButtonState {
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