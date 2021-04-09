import React from 'react';
import ButtonState from './ButtonState';

export default class FollowedState implements ButtonState {
  display = (<>フォロー済</>);

  variant = 'primary';

  disabled = true;
}
