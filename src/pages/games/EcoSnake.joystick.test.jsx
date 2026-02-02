import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { MobileJoystick } from '@/pages/games/EcoSnake';

expect.extend(matchers);

describe('EcoSnake MobileJoystick', () => {
  afterEach(() => {
    cleanup();
  });

  it('chama onDirection ao arrastar para a direita', () => {
    const onDirection = vi.fn();
    render(<MobileJoystick onDirection={onDirection} disabled={false} />);

    const joystick = screen.getByLabelText('Joystick');
    joystick.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
      });

    fireEvent.pointerDown(joystick, { pointerId: 1, clientX: 50, clientY: 50 });
    fireEvent.pointerMove(joystick, { pointerId: 1, clientX: 90, clientY: 50 });
    fireEvent.pointerUp(joystick, { pointerId: 1, clientX: 90, clientY: 50 });

    expect(onDirection).toHaveBeenCalledWith('right');
  });

  it('não chama onDirection quando desabilitado', () => {
    const onDirection = vi.fn();
    render(<MobileJoystick onDirection={onDirection} disabled />);

    const joystick = screen.getByLabelText('Joystick');
    fireEvent.pointerDown(joystick, { pointerId: 1, clientX: 50, clientY: 50 });
    fireEvent.pointerMove(joystick, { pointerId: 1, clientX: 90, clientY: 50 });
    fireEvent.pointerUp(joystick, { pointerId: 1, clientX: 90, clientY: 50 });

    expect(onDirection).not.toHaveBeenCalled();
  });
});
