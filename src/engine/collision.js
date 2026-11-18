export function overlaps(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const reach = a.radius + b.radius;
  return dx * dx + dy * dy < reach * reach;
}

export function eachCollision(listA, listB, callback) {
  for (const a of listA) {
    if (!a.active) continue;
    for (const b of listB) {
      if (!b.active || a === b) continue;
      if (overlaps(a, b) && callback(a, b) === true) break;
      if (!a.active) break;
    }
  }
}
