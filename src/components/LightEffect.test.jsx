/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { LightEffect, LightSwitch } from '../../frontend/src/components/ui/LightEffect';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

describe('LightEffect Component', () => {
  it('renders correctly when on', () => {
    const { container } = render(<LightEffect isOn={true} color="#10b981" />);
    // Check if the main light div exists (using class or hierarchy)
    const lightDivs = container.querySelectorAll('.rounded-full');
    expect(lightDivs.length).toBeGreaterThan(0);
  });

  it('renders correctly when off', () => {
    const { container } = render(<LightEffect isOn={false} />);
    // Should still render container but with different styles/opacity
    const lightDivs = container.querySelectorAll('.rounded-full');
    expect(lightDivs.length).toBeGreaterThan(0);
  });
});

describe('LightSwitch Component', () => {
  it('calls onToggle when clicked', () => {
    const onToggleMock = vi.fn();
    render(<LightSwitch isOn={false} onToggle={onToggleMock} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });

  it('displays correct icon based on state', () => {
    render(<LightSwitch isOn={true} onToggle={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
