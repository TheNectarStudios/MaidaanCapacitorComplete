export const MOVES_PER_PERSON = 5;
const targetMovementEachSideLength = 50;

export const targetMovementPaths = ['triangle', 'square', 'pentagon'];

export const getTargetMovement = (type, pos) => {
    if (type === 'pentagon') {
      let angleIncrement = (2 * Math.PI) / 5; // Angle between each vertex for a pentagon
      return [
        { x: pos.x, y: pos.y }, // Initial position
        {
          x: pos.x + targetMovementEachSideLength * Math.cos(0),
          y: pos.y + targetMovementEachSideLength * Math.sin(0),
        }, // First vertex
        {
          x: pos.x + targetMovementEachSideLength * Math.cos(angleIncrement),
          y: pos.y + targetMovementEachSideLength * Math.sin(angleIncrement),
        }, // Second vertex
        {
          x: pos.x + targetMovementEachSideLength * Math.cos(2 * angleIncrement),
          y: pos.y + targetMovementEachSideLength * Math.sin(2 * angleIncrement),
        }, // Third vertex
        {
          x: pos.x + targetMovementEachSideLength * Math.cos(3 * angleIncrement),
          y: pos.y + targetMovementEachSideLength * Math.sin(3 * angleIncrement),
        }, // Fourth vertex
        {
          x: pos.x + targetMovementEachSideLength * Math.cos(4 * angleIncrement),
          y: pos.y + targetMovementEachSideLength * Math.sin(4 * angleIncrement),
        }, // Fifth vertex
      ];
    }
    if (type === 'square') {
        return [
        { x: pos.x, y: pos.y }, // Initial position
        { x: pos.x + targetMovementEachSideLength, y: pos.y }, // targetMovementEachSideLength pixels to the right
        { x: pos.x + targetMovementEachSideLength, y: pos.y - targetMovementEachSideLength }, // targetMovementEachSideLength pixels up
        { x: pos.x, y: pos.y - targetMovementEachSideLength }, // targetMovementEachSideLength pixels to the left and up
      ]
    }
    return [
      { x: pos.x, y: pos.y }, // Initial position
      { x: pos.x + targetMovementEachSideLength, y: pos.y }, // targetMovementEachSideLength pixels to the right
      // {
      //   x: pos.x + targetMovementEachSideLength / 2,
      //   y: pos.y - targetMovementEachSideLength * Math.sin(Math.PI / 3),
      // }, // targetMovementEachSideLength pixels at an angle of 60 degrees
    ];
}

export const getRandomTargetMovementVertices = (pos) => {
    // const randomIndex = Math.floor(Math.random() * 3);
    const targetMovementPath = targetMovementPaths[0];
    return getTargetMovement(targetMovementPath, pos);
  };

export const generateRandomTargetPosition = () => {
    return {
    x: Math.floor(Math.random() * (window.innerWidth - 90)),
    // y: window.innerWidth / 2 + 80
    y: Math.floor(
         Math.max(Math.random(),0.3) *
         (window.innerHeight * 0.75 - window.innerWidth / 2 - 100)
    ),
    };
};
