import React from 'react';
import {Animated} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {SkeletonBlock, SkeletonList} from '../Skeleton';

jest.useFakeTimers();

const render = (element: React.ReactElement) => {
  let tree: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
};

describe('Skeleton', () => {
  it('renders the requested number of grid cards with an accessible loading label', () => {
    const tree = render(<SkeletonList variant="grid" count={3} />);
    const root = tree.root.findByProps({accessibilityLabel: 'Loading'});
    expect(root.props.accessibilityRole).toBe('progressbar');
    expect(root.props.children).toHaveLength(3);
    // title + 6 label/value pairs per grid card
    expect(tree.root.findAllByType(Animated.View)).toHaveLength(3 * 13);
    act(() => tree.unmount());
  });

  it('defaults to four card placeholders', () => {
    const tree = render(<SkeletonList />);
    const root = tree.root.findByProps({accessibilityLabel: 'Loading'});
    expect(root.props.children).toHaveLength(4);
    act(() => tree.unmount());
  });

  it('a standalone block pulses on its own', () => {
    const tree = render(<SkeletonBlock width="50%" height={10} />);
    expect(tree.root.findAllByType(Animated.View)).toHaveLength(1);
    act(() => tree.unmount());
  });
});
