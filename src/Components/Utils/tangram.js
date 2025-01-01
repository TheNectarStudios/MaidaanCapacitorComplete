import paper from "paper/dist/paper-core"
import { createPrimitive, useGap } from "css-system"
import React, { useContext, useMemo, useCallback } from "react"
import { path } from "pixi.js"
import ClipperLib from 'clipper-lib';

export const getTriangleCenter = points => {
    const d1 = points[1].getDistance(points[2])
    const d2 = points[0].getDistance(points[2])
    const d3 = points[0].getDistance(points[1])
  
    const perimeter = d1 + d2 + d3
  
    const triangleCenterX =
      (points[0].x * d1 + points[1].x * d2 + points[2].x * d3) / perimeter
    const triangleCenterY =
      (points[0].y * d1 + points[1].y * d2 + points[2].y * d3) / perimeter
  
    return new paper.Point(triangleCenterX, triangleCenterY)
  }

  export const countCorrectlyPlacedPieces = (coumpoundPath, piecesGroup, errorMargin) => {
    let correctPieceCount = 0;
  
    for (const pieceGroup of piecesGroup.children) {
      // Create the path for the current piece, offset it by the errorMargin
      const piecePath = new paper.Path({
        segments: getOffsettedPathPoints(
          pieceGroup.children["display"].segments.map(({ point }) => point),
          -errorMargin
        ),
        closed: true,
        insert: false,
      });
  
      // Unite this piece with the compound path
      const combinedPath = coumpoundPath.unite(piecePath, { insert: false });
  
      // Check if the piece fits correctly (compare lengths or areas, or check for overlap)
      // Here, we're checking if the length after uniting is roughly the same
      if (Math.round(combinedPath.length * 1000) === Math.round(coumpoundPath.length * 1000)) {
        correctPieceCount++;
      }
    }
    return correctPieceCount; // Return the number of correctly placed pieces
  };
  

export const getOffsettedPathPoints = (points, offset) => {

  const offsetter = new ClipperLib.ClipperOffset()

  const offsettedPathPoints = new ClipperLib.Paths()

  offsetter.AddPaths(
    [
      points.map(({ x, y }) => ({
        X: x,
        Y: y,
      })),
    ],
    ClipperLib.JoinType.jtMiter,
    ClipperLib.EndType.etClosedPolygon
  )

  offsetter.MiterLimit = 0
  offsetter.ArcTolerance = 0

  offsetter.Execute(offsettedPathPoints, offset)

  if (offsettedPathPoints.length) {
    return offsettedPathPoints[0].map(({ X, Y }) => new paper.Point(X, Y))
  }
}

export const getPathData = (piecesGroup, scaleFactor) => {
  let compoundPath

  for (const pieceGroup of piecesGroup.children) {
    const path = pieceGroup.children["display"]

    if (!compoundPath) {
      compoundPath = path
    } else {
      compoundPath = compoundPath.unite(path, {
        insert: false,
      })
    }
  }

  compoundPath.scale(1 / scaleFactor)

  compoundPath.position = new paper.Point(
    compoundPath.bounds.width / 2,
    compoundPath.bounds.height / 2
  )

  const path = compoundPath.exportSVG().getAttribute("d")
  const edges = compoundPath.curves.length
  const width = Math.round(compoundPath.bounds.width)
  const height = Math.round(compoundPath.bounds.height)
  const length = Math.round(compoundPath.length)

  compoundPath.remove()

  return {
    width,
    height,
    length,
    path,
    edges,
  }
}



export const restrictGroupWithinCanvas = (group, canvas) => {
    const correctionVector = group.pivot
      ? group.pivot.subtract(group.bounds.center)
      : new paper.Point()
  
    if (group.bounds.x < 0) {
      group.position.x = group.bounds.width / 2 + correctionVector.x
    }
    if (group.bounds.y < 0) {
      group.position.y = group.bounds.height / 2 + correctionVector.y
    }
  
    if (
      group.bounds.x + group.bounds.width >
      canvas.width / window.devicePixelRatio
    ) {
      group.position.x =
        canvas.width / window.devicePixelRatio -
        group.bounds.width / 2 +
        correctionVector.x
    }
  
    if (
      group.bounds.y + group.bounds.height >
      canvas.height / window.devicePixelRatio
    ) {
      group.position.y =
        canvas.height / window.devicePixelRatio -
        group.bounds.height / 2 +
        correctionVector.y
    }
    
  }


  
export const DEV = process.env.NODE_ENV === "development"
export const SMALL_TRIANGLE_BASE = 50 // If you change this, the world will fall appart
export const OVERLAPING_OPACITY = 0.25
export const COLLISION_MARGIN = 5
export const INSET_BORDER = 4
export const STRICT_ERROR_MARGIN = 2
export const SOFT_ERROR_MARGIN = 5
export const SNAP_DISTANCE = 10
export const CLICK_TIMEOUT = 300
export const VICTORY_PARTICLES_DURATION = 1500
export const SCRAMBLE_PADDING = 100
export const COLOR_TRANSITION_DURATION = 250
export const FADE_TRANSITION_DURATION = 1000
export const FADE_STAGGER_DURATION = 500
export const DIALOG_CLOSED_REASON = "DIALOG_CLOSED_REASON"

export const PARTICLES_COUNT = 60
export const MAX_PARTICLE_SIZE = 5
export const MIN_PARTICLE_SIZE = 2
export const MIN_PARTICLE_OPACITY = 0.25
export const MAX_PARTICLE_OPACITY = 0.75

export const scrambleGroup = (group, canvas) => {
  const maxPoint = new paper.Point(
    paper.project.view.bounds.width,
    paper.project.view.bounds.height
  ).subtract(SCRAMBLE_PADDING * 2)

  group.position = paper.Point.random()
    .multiply(maxPoint)
    .add(SCRAMBLE_PADDING)

  if (group.data.id === "rh") {
    const rotation = Math.round(Math.random() * 3) * 45
    group.rotation = rotation
    group.data.rotation = rotation
  } else {
    group.rotation = Math.round(Math.random() * 7) * 45
  }
}


export const updateColisionState = (pieceGroup, piecesGroup) => {
    for (const otherPieceGroup of piecesGroup.children) {
      if (otherPieceGroup === pieceGroup) {
        continue
      }
  
      const pieceCollisionShape = pieceGroup.children["collision"]
      const otherPieceCollisionShape = otherPieceGroup.children["collision"]

      if (
        pieceCollisionShape.intersects(otherPieceCollisionShape) ||
        doesPathContainsPath(pieceCollisionShape, otherPieceCollisionShape) ||
        doesPathContainsPath(otherPieceCollisionShape, pieceCollisionShape)
      ) {
        pieceGroup.data.collisions.add(otherPieceGroup.data.id)
        otherPieceGroup.data.collisions.add(pieceGroup.data.id)
      } else {
        pieceGroup.data.collisions.delete(otherPieceGroup.data.id)
        otherPieceGroup.data.collisions.delete(pieceGroup.data.id)
      }
    }
  
    let isTangramValid = true
  
    for (const otherPieceGroup of piecesGroup.children) {
      if (otherPieceGroup.data.collisions.size > 0) {
        isTangramValid = false
        otherPieceGroup.children["display"].opacity = OVERLAPING_OPACITY
      } else {
        otherPieceGroup.children["display"].opacity = 1
      }
    }
  
    return isTangramValid
  }

  export const doesPathContainsPath = (pathA, pathB) => {
    return pathB.segments.every(segment => pathA.contains(segment.point))
  }



const getPrimarySnap = (shape, otherShapes, snap) => {
    for (const otherShape of otherShapes) {
      for (const { point: otherPoint } of otherShape?.segments) {
        for (const { point: ghostPoint } of shape.segments) {
          const distance = ghostPoint.getDistance(otherPoint)
          if (distance < snap.distance) {
            snap.distance = distance
            snap.shape = otherShape
            snap.vector = otherPoint.subtract(ghostPoint)
          }
        }
      }
    }
  
    if (!snap.vector) {
      for (const otherShape of otherShapes) {
        for (const { point } of shape.segments) {
          for (const {
            point: startPoint,
            next: { point: endPoint },
          } of otherShape.segments) {
            const nearestPoint = getNearestPoint(point, startPoint, endPoint)
            const distance = nearestPoint.getDistance(point)
            if (distance < snap.distance) {
              snap.distance = distance
              snap.vector = nearestPoint.subtract(point)
              snap.shape = otherShape
              snap.segment = [startPoint, endPoint]
              snap.point = point
            }
          }
        }
  
        for (const { point: otherPoint } of otherShape.segments) {
          for (const {
            point: startPoint,
            next: { point: endPoint },
          } of shape.segments) {
            const nearestPoint = getNearestPoint(otherPoint, startPoint, endPoint)
            const distance = nearestPoint.getDistance(otherPoint)
            if (distance < snap.distance) {
              snap.distance = distance
              snap.vector = otherPoint.subtract(nearestPoint)
              snap.shape = shape
              snap.segment = [startPoint, endPoint]
            }
          }
        }
      }
    }
  
    return snap
  }
  
  const getSecondarySnap = (shape, otherShapes, snap) => {
    if (snap.segment) {
      let bestNewVectorLenth = snap.maxDistance
      let bestNewVector
  
      const [startPoint, endPoint] = snap.segment
  
      const angle1 = Math.atan2(
        endPoint.y - startPoint.y,
        endPoint.x - startPoint.x
      )
      const angle2 = Math.atan2(
        startPoint.y - endPoint.y,
        startPoint.x - endPoint.x
      )
  
      for (const angle of [angle1, angle2]) {
        for (const { point } of shape.segments) {
          if (point === snap.point) {
            //TODO snap.point should be an array of point when several points of the moved shape touch the snaped segment
            continue
          }
          const startPoint = point.add(snap.vector)
  
          const endPoint = new paper.Point(
            startPoint.x + snap.maxDistance * Math.cos(angle),
            startPoint.y + snap.maxDistance * Math.sin(angle)
          )
  
          const ray = new paper.Path.Line({
            from: startPoint,
            to: endPoint,
            insert: false,
          })
  
          for (const otherShape of otherShapes) {
            const intersections = ray.getIntersections(otherShape)
  
            for (const { point: intersectionPoint } of intersections) {
              const newVector = intersectionPoint
                .subtract(startPoint)
                .add(snap.vector)
  
              if (
                newVector.length < snap.maxDistance &&
                newVector.length <= bestNewVectorLenth
              ) {
                bestNewVectorLenth = newVector.length
                bestNewVector = newVector
              }
            }
          }
        }
      }
  
      if (bestNewVector) {
        snap.vector = bestNewVector
      }
    }
  }
  
  export const getSnapVector = (
    maxDistance,
    shape,
    otherPrimaryShapes,
    otherSecondaryShapes
  ) => {
    let snap = {
      maxDistance,
      distance: maxDistance,
    }
  
    getPrimarySnap(shape, otherPrimaryShapes, snap)
  
    if (otherSecondaryShapes) {
      getPrimarySnap(shape, otherSecondaryShapes, snap)
    }
  
    getSecondarySnap(
      shape,
      otherPrimaryShapes.filter((otherShape) => otherShape.shape !== snap.shape),
      snap
    )
  
    if (otherSecondaryShapes) {
      getSecondarySnap(shape, otherSecondaryShapes, snap)
    }
  
    return snap.vector
  }

  export const getNearestPoint = (point, startPoint, endPoint) => {
    const atob = { x: endPoint.x - startPoint.x, y: endPoint.y - startPoint.y }
    const atop = { x: point.x - startPoint.x, y: point.y - startPoint.y }
    const len = atob.x * atob.x + atob.y * atob.y
    let dot = atop.x * atob.x + atop.y * atob.y
    const t = Math.min(1, Math.max(0, dot / len))
  
    dot =
      (endPoint.x - startPoint.x) * (point.y - startPoint.y) -
      (endPoint.y - startPoint.y) * (point.x - startPoint.x)
  
    return new paper.Point(startPoint.x + atob.x * t, startPoint.y + atob.y * t)
  }



export const View = createPrimitive("div", ({ css, ...props }) => {
  return {
    css: useGap({
      display: "flex",
      minWidth: 0,
      minHeight: 0,
      flex: "none",
      alignSelf: "auto",
      alignItems: "stretch",
      flexDirection: "column",
      justifyContent: "flex-start",
      ...css,
    }),
    ...props,
  }
})


export const getTangramDifficulty = (tangram) =>
  tangram.edges > 16 ? 0 : tangram.edges > 8 ? 1 : 2



export const Card = ({
  showStroke,
  tangram,
  completed,
  selected,
  css,
  onBadgeClick,
  onClick,
  onLongPress,
  hideBadge,
  ...props
}) => {
  const { path, width, height, uid, approved, emoji } = tangram
  const difficulty = useMemo(() => getTangramDifficulty(tangram), [tangram])

  //console.log("Card")

  const color = "black"
  

  return (
    <View
      css={css}
      onClick={
        onClick
          ? () => {
              //playCard()
              onClick(tangram)
            }
          : undefined
      }
      //{...longPressHandlers}
      {...props}
    >
      <View
        css={{
          opacity: uid && approved === false ? 0.5 : 1,
          borderRadius: 5,
          boxShadow: selected
            ? `0px 0px 0px 4px ${color}`
            : "0px 0px 0px 1px rgba(0, 0, 0, 0.1)",
          m: 1,
          bg: "background",
          transition: `background-color ${COLOR_TRANSITION_DURATION}ms`,
          p: 3,
          textAlign: "center",
          position: "relative",
          cursor: onClick || onLongPress ? "pointer" : undefined,
          width: 128,
          height: 178,
        }}
        deps={[color, selected, uid, approved]}
      >
        <View
          as="svg"
          css={{
            flex: "1",
            justifyContent: "center",
            fill: color,
            stroke: showStroke ? "lime" : undefined,
            strokeWidth: showStroke ? 8 : undefined,
          }}
          deps={[showStroke, color]}
          viewBox={`0 0 ${width} ${height}`}
          dangerouslySetInnerHTML={{ __html: `<path d="${path}" />` }}
        />
        {completed && (
          <View
            css={{ position: "absolute", top: 1, left: 1, fontSize: "30px" }}
          >
            {emoji}
          </View>
        )}
        
      </View>

    </View>
  )
}
  

export const isTangramValid = piecesGroup => {
    for (const pieceGroup of piecesGroup.children) {
      if (pieceGroup.data.collisions.size > 0) {
        return false
      }
    }
  
    return true
  }



export const isTangramComplete = (coumpoundPath, piecesGroup, errorMargin) => {
    // console.log("isTangramComplete")
    // console.log(coumpoundPath,"coumpoundPath")
    // console.log(piecesGroup,"piecesGroup")
    // console.log(errorMargin,"errorMargin")
  let newCoumpoundPath = coumpoundPath

  for (const pieceGroup of piecesGroup.children) {
    if (pieceGroup.data.collisions.size > 0) {
      return
    }
    newCoumpoundPath = newCoumpoundPath.unite(
      new paper.Path({
        segments: getOffsettedPathPoints(
          pieceGroup.children["display"].segments.map(({ point }) => point),
          -errorMargin
        ),
        closed: true,
        insert: false,
      }),

      {
        insert: false,
      }
    )
  }


  return (
    Math.round(newCoumpoundPath.length * 1000) ===
    Math.round(coumpoundPath.length * 1000)
  )
}




const createTriangle = (size, id) => {
  const points = [
    new paper.Point(0, 0),
    new paper.Point(size * 2, 0),
    new paper.Point(size, size),
  ]

  const displayShape = new paper.Path({
    name: "display",
    segments: points,
    closed: true,
  })


  const collisionShape = new paper.Path({
    name: "collision",
    segments: getOffsettedPathPoints(points, -COLLISION_MARGIN),
    closed: true,
  })

  const insetBorderShape = new paper.Path({
    name: "insetBorder",
    segments: getOffsettedPathPoints(points, -INSET_BORDER),
    closed: true,
    strokeWidth: INSET_BORDER,
  })

  const triangleCenter = getTriangleCenter(points)

  const center = new paper.Point(
    paper.view.center.x + triangleCenter.x - displayShape.bounds.width / 2,
    paper.view.center.y + triangleCenter.y - displayShape.bounds.height / 2
  )

  const group = new paper.Group({
    children: [displayShape, collisionShape, insetBorderShape],
    position: paper.view.center,
    pivot: center,
    data: { id, collisions: new Set() },
    applyMatrix: true,
  })

  return group
}

const createRhombus = (size, id) => {
  const points = [
    new paper.Point(0, 0),
    new paper.Point(size * 2, 0),
    new paper.Point(size * 3, size),
    new paper.Point(size, size),
  ]

  const displayShape = new paper.Path({
    name: "display",
    segments: points,
    closed: true,
  })

  const collisionShape = new paper.Path({
    name: "collision",
    segments: getOffsettedPathPoints(points, -COLLISION_MARGIN),
    closed: true,
    strokeWidth: COLLISION_MARGIN,
  })

  const insetBorderShape = new paper.Path({
    name: "insetBorder",
    segments: getOffsettedPathPoints(points, -INSET_BORDER),
    closed: true,
    strokeWidth: INSET_BORDER,
  })

  const group = new paper.Group({
    children: [displayShape, collisionShape, insetBorderShape],
    position: paper.view.center,
    data: { id, collisions: new Set() },
    applyMatrix: true,
  })

  return group
}

const createSquare = (size, id) => {
  const displayShape = new paper.Path.Rectangle({
    name: "display",
    point: [0, 0],
    size: [size, size],
  })

  const collisionShape = new paper.Path.Rectangle({
    name: "collision",
    point: [COLLISION_MARGIN, COLLISION_MARGIN],
    size: [size - COLLISION_MARGIN * 2, size - COLLISION_MARGIN * 2],
  })

  const insetBorderShape = new paper.Path.Rectangle({
    name: "insetBorder",
    point: [INSET_BORDER, INSET_BORDER],
    size: [size - INSET_BORDER * 2, size - INSET_BORDER * 2],
    strokeWidth: INSET_BORDER,
  })

  const group = new paper.Group({
    children: [displayShape, collisionShape, insetBorderShape],
    position: paper.view.center,
    data: { id, collisions: new Set() },
    applyMatrix: true,
    rotation: Math.round(Math.random() * 7) * 45,
  })

  return group
}

export const createPiecesGroup = () => {
  const smallBase = 50;
  const mediumBase = Math.sqrt(Math.pow(smallBase, 2) * 2)
  const largeBase = Math.sqrt(Math.pow(mediumBase, 2) * 2)
  return new paper.Group([
    createTriangle(smallBase, "st1"),
    createTriangle(smallBase, "st2"),
    createTriangle(mediumBase, "mt1"),
    createTriangle(largeBase, "lt1"),
    createTriangle(largeBase, "lt2"),
    createSquare(mediumBase, "sq"),
    createRhombus(smallBase, "rh"),
  ])
}
