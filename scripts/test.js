let previousTime = 0;

function animate(stampTime ) {
  const deltaTime = stampTime - previousTime;
  previousTime = stampTime;
  requestAnimationFrame(animate);



}
animate();