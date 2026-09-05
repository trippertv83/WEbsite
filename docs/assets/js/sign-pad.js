export function attachSignPad(canvas) {
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let empty = true;

  function scalePos(event) {
    const rect = canvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    return {
      x: ((point.clientX - rect.left) * canvas.width) / rect.width,
      y: ((point.clientY - rect.top) * canvas.height) / rect.height,
    };
  }

  function start(event) {
    event.preventDefault();
    drawing = true;
    const pos = scalePos(event);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function move(event) {
    if (!drawing) return;
    event.preventDefault();
    const pos = scalePos(event);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1c222b';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    empty = false;
  }

  function end() {
    drawing = false;
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);

  return {
    isEmpty() {
      return empty;
    },
    clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      empty = true;
    },
    toDataURL() {
      return canvas.toDataURL('image/png');
    },
  };
}

export function stripDataUrl(dataUrl) {
  const text = String(dataUrl || '');
  const comma = text.indexOf(',');
  return comma >= 0 ? text.slice(comma + 1) : text;
}
