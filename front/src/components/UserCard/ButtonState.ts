import { ButtonVariant } from 'react-bootstrap/esm/types';

export default abstract class ButtonState {
  abstract display: JSX.Element;

  abstract variant: ButtonVariant;

  abstract disabled: boolean;
}
