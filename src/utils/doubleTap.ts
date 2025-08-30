export const createDoubleTapHandler = (
  onDoubleTap: () => void,
  delay = 300,
) => {
  let lastTap = 0;
  return () => {
    const now = Date.now();
    if (now - lastTap < delay) {
      onDoubleTap();
    }
    lastTap = now;
  };
};
